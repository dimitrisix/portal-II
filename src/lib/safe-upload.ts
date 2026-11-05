// Ubicación: src/lib/safe-upload.ts
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB para imágenes
const MAX_PDF_SIZE = 1024 * 1024 * 1024; // 1 GB (1024 MB) para permitir cualquier archivo PDF sin restricciones

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

export function getAllCandidateBaseDirs(): string[] {
  const cwd = process.cwd();
  const list = [
    cwd,
    "/var/www/portal",
    "/var/www/portal-II",
    "/home/tecnologia/portal",
    "/home/tecnologia/portal-II",
  ];
  return Array.from(new Set(list));
}

/**
 * Obtiene el directorio base de la aplicación.
 * Prioriza el directorio de trabajo del proceso en ejecución (process.cwd()) si contiene 'public',
 * o verifica las rutas habituales del entorno de producción Linux (/var/www/portal, /var/www/portal-II).
 */
export function getBaseUploadDir(): string {
  const cwd = process.cwd();
  if (fsSync.existsSync(path.join(cwd, "public"))) {
    return cwd;
  }
  if (fsSync.existsSync("/var/www/portal/public")) {
    return "/var/www/portal";
  }
  if (fsSync.existsSync("/var/www/portal-II/public")) {
    return "/var/www/portal-II";
  }
  if (fsSync.existsSync("/home/tecnologia/portal/public")) {
    return "/home/tecnologia/portal";
  }
  if (fsSync.existsSync("/home/tecnologia/portal-II/public")) {
    return "/home/tecnologia/portal-II";
  }
  return cwd;
}

/**
 * Crea y asegura los directorios de carga en todos los destinos posibles
 * (public/uploads, uploads raíz y standalone), configurando permisos universales 0777
 * y symlink para que Nginx (www-data) y Node.js puedan leer y escribir sin bloqueos.
 */
export async function ensureUploadDirectories(subfolder: string = ""): Promise<{
  primaryDir: string;
  rootUploadDir: string;
  standaloneDir: string;
}> {
  const cleanSubfolder = subfolder.replace(/[^a-zA-Z0-9_-]/g, "");
  const baseDir = getBaseUploadDir();

  const primaryDir = path.join(baseDir, "public", "uploads", cleanSubfolder);
  const rootUploadDir = path.join(baseDir, "uploads", cleanSubfolder);
  const standaloneDir = path.join(
    baseDir,
    ".next",
    "standalone",
    "public",
    "uploads",
    cleanSubfolder,
  );

  const candidateBases = getAllCandidateBaseDirs();
  const dirsToEnsure: string[] = [
    path.join(baseDir, "public", "uploads"),
    primaryDir,
    path.join(baseDir, "uploads"),
    rootUploadDir,
    path.join(baseDir, ".next", "standalone", "public", "uploads"),
    standaloneDir,
  ];

  for (const cBase of candidateBases) {
    if (fsSync.existsSync(cBase)) {
      dirsToEnsure.push(
        path.join(cBase, "public", "uploads"),
        path.join(cBase, "public", "uploads", cleanSubfolder),
        path.join(cBase, "uploads"),
        path.join(cBase, "uploads", cleanSubfolder),
        path.join(cBase, ".next", "standalone", "public", "uploads"),
        path.join(cBase, ".next", "standalone", "public", "uploads", cleanSubfolder),
      );
    }
  }

  const uniqueDirs = Array.from(new Set(dirsToEnsure));

  for (const dir of uniqueDirs) {
    try {
      await fs.mkdir(dir, { recursive: true, mode: 0o777 });
      await fs.chmod(dir, 0o777);
    } catch {
      // Ignorar si ya existe o no se pueden cambiar permisos en Windows
    }
  }

  // En Linux, asegurar symlink en los directorios base existentes
  if (process.platform !== "win32") {
    for (const cBase of candidateBases) {
      try {
        const publicUploads = path.join(cBase, "public", "uploads");
        const rootUploads = path.join(cBase, "uploads");
        if (fsSync.existsSync(publicUploads) && !fsSync.existsSync(rootUploads)) {
          fsSync.symlinkSync(publicUploads, rootUploads, "dir");
        }
      } catch {}
    }
  }

  return { primaryDir, rootUploadDir, standaloneDir };
}

/**
 * Valida la firma binaria (Magic Bytes) para impedir evasión de extensiones (.exe renombrado a .png).
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimeType === "image/webp") {
    const isRiff = buffer.toString("ascii", 0, 4) === "RIFF";
    const isWebp = buffer.toString("ascii", 8, 12) === "WEBP";
    return isRiff && isWebp;
  }

  if (mimeType === "image/svg+xml") {
    const text = buffer
      .toString("utf8", 0, Math.min(buffer.length, 2048))
      .toLowerCase();
    return (
      (text.includes("<svg") || text.includes("<?xml")) &&
      !text.includes("<script")
    );
  }

  return false;
}

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Procesa y almacena un archivo de forma segura con verificación estricta de tamaño,
 * MIME type, magic bytes y neutralización de nombres (anti Path Traversal).
 */
export async function processAndSaveImage(
  file: File | null,
  subfolder: string = "",
): Promise<UploadResult> {
  if (!file || file.size === 0) {
    return { success: false, error: "No se seleccionó ningún archivo de imagen." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `El archivo excede el tamaño máximo permitido (${MAX_FILE_SIZE / 1024 / 1024}MB).`,
    };
  }

  const mimeType = file.type.toLowerCase().trim();
  const safeExtension = ALLOWED_MIME_TYPES[mimeType];

  if (!safeExtension) {
    return {
      success: false,
      error: "Formato no permitido. Solo se admiten imágenes JPG, PNG o WEBP seguras.",
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validación estricta de contenido real (Magic Bytes)
  if (!validateMagicBytes(buffer, mimeType)) {
    return {
      success: false,
      error: "El archivo parece estar corrupto o no coincide con su formato declarado.",
    };
  }

  // Sanitización de subcarpeta (solo alfanumérico y guiones)
  const cleanSubfolder = subfolder.replace(/[^a-zA-Z0-9_-]/g, "");

  // Generación de nombre criptográficamente seguro (evita colisiones y Path Traversal)
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExtension}`;

  let primaryDir: string;

  try {
    const dirs = await ensureUploadDirectories(cleanSubfolder);
    primaryDir = dirs.primaryDir;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "EACCES") {
      return {
        success: false,
        error:
          "Permiso denegado en el servidor al guardar imagen. Ejecuta: sudo mkdir -p /var/www/portal/public/uploads && sudo chmod -R 777 /var/www/portal/public",
      };
    }
    throw err;
  }

  const primaryFilePath = path.join(primaryDir, uniqueName);
  let primaryWritten = false;

  // 1. Escribir en almacenamiento principal (public/uploads/...)
  try {
    await fs.writeFile(primaryFilePath, buffer);
    try {
      await fs.chmod(primaryFilePath, 0o666);
    } catch {}
    primaryWritten = true;
  } catch (err) {
    console.error("[UPLOAD WRITE ERROR primaryFilePath]:", err);
  }

  // 2. Replicar de inmediato en todas las posibles ubicaciones del servidor Linux (Nginx y Node)
  const candidateBases = getAllCandidateBaseDirs();
  for (const cBase of candidateBases) {
    const targetPaths = [
      path.join(cBase, "public", "uploads", cleanSubfolder, uniqueName),
      path.join(cBase, "uploads", cleanSubfolder, uniqueName),
      path.join(cBase, ".next", "standalone", "public", "uploads", cleanSubfolder, uniqueName),
    ];

    for (const target of targetPaths) {
      if (target !== primaryFilePath) {
        try {
          const parent = path.dirname(target);
          if (fsSync.existsSync(parent)) {
            await fs.writeFile(target, buffer);
            await fs.chmod(target, 0o666);
            primaryWritten = true;
          }
        } catch {}
      }
    }
  }

  if (!primaryWritten) {
    return {
      success: false,
      error:
        "Error de permisos en el servidor: no se pudo escribir el archivo. Ejecuta en el servidor: sudo chmod -R 777 public/uploads uploads",
    };
  }

  const publicUrl = cleanSubfolder
    ? `/uploads/${cleanSubfolder}/${uniqueName}`
    : `/uploads/${uniqueName}`;

  return {
    success: true,
    publicUrl,
  };
}

export interface PdfUploadResult {
  success: boolean;
  publicUrl?: string;
  originalName?: string;
  fileSizeFormatted?: string;
  error?: string;
}

/**
 * Procesa y almacena un archivo PDF de forma segura (verificando magic bytes %PDF,
 * tamaño máximo y neutralizando el nombre de archivo).
 */
export async function processAndSavePdf(
  file: File | null,
  subfolder: string = "revista",
): Promise<PdfUploadResult> {
  if (!file || file.size === 0) {
    return { success: false, error: "No se seleccionó ningún archivo PDF." };
  }

  if (file.size > MAX_PDF_SIZE) {
    return {
      success: false,
      error: `El archivo PDF supera el tamaño límite permitido (${MAX_PDF_SIZE / 1024 / 1024}MB).`,
    };
  }

  // Verificación estricta de Magic Bytes (%PDF -> 0x25, 0x50, 0x44, 0x46)
  // Inspecciona solo los primeros 1024 bytes sin cargar archivos masivos (400MB+) en memoria
  const headerSlice = await file.slice(0, 1024).arrayBuffer();
  const headerBuffer = Buffer.from(headerSlice);

  if (
    headerBuffer.length < 4 ||
    headerBuffer[0] !== 0x25 ||
    headerBuffer[1] !== 0x50 ||
    headerBuffer[2] !== 0x44 ||
    headerBuffer[3] !== 0x46
  ) {
    return {
      success: false,
      error: "El archivo no es un documento PDF válido o se encuentra corrupto.",
    };
  }

  // Sanitización de subcarpeta
  const cleanSubfolder = subfolder.replace(/[^a-zA-Z0-9_-]/g, "");

  // Formato legible de tamaño
  const fileSizeFormatted =
    file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

  // Sanitizar nombre original para visualización
  const originalName = file.name
    ? file.name.replace(/[^\w\s.-]/gi, "").trim()
    : "Revista.pdf";

  // Generar nombre criptográfico para evitar colisiones
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.pdf`;

  let primaryDir: string;

  try {
    const dirs = await ensureUploadDirectories(cleanSubfolder);
    primaryDir = dirs.primaryDir;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "EACCES") {
      return {
        success: false,
        error:
          "Permiso denegado en el servidor al guardar el PDF. Ejecuta: sudo mkdir -p /var/www/portal/public/uploads/revista && sudo chmod -R 777 /var/www/portal/public",
      };
    }
    throw err;
  }

  const primaryFilePath = path.join(primaryDir, uniqueName);

  // Guardado eficiente por Streaming por fragmentos:
  // Escribe directamente al disco sin saturar la memoria RAM aun en archivos de 400MB o más
  const writeStream = fsSync.createWriteStream(primaryFilePath);
  const webStream = file.stream();
  const nodeReadable = Readable.fromWeb(webStream as unknown as import("stream/web").ReadableStream);

  await pipeline(nodeReadable, writeStream);

  try {
    await fs.chmod(primaryFilePath, 0o666);
  } catch {}

  // Replicar en todas las rutas candidatas (Nginx y Node)
  const candidateBases = getAllCandidateBaseDirs();
  for (const cBase of candidateBases) {
    const targetPaths = [
      path.join(cBase, "public", "uploads", cleanSubfolder, uniqueName),
      path.join(cBase, "uploads", cleanSubfolder, uniqueName),
      path.join(cBase, ".next", "standalone", "public", "uploads", cleanSubfolder, uniqueName),
    ];
    for (const target of targetPaths) {
      if (target !== primaryFilePath) {
        try {
          const parent = path.dirname(target);
          if (fsSync.existsSync(parent)) {
            await fs.copyFile(primaryFilePath, target);
            await fs.chmod(target, 0o666);
          }
        } catch {}
      }
    }
  }

  const publicUrl = cleanSubfolder
    ? `/uploads/${cleanSubfolder}/${uniqueName}`
    : `/uploads/${uniqueName}`;

  return {
    success: true,
    publicUrl,
    originalName,
    fileSizeFormatted,
  };
}

/**
 * Elimina un archivo físico asegurando que pertenezca a la carpeta public/uploads
 * previniendo ataques de Path Traversal (evita borrar archivos del sistema operativo).
 */
export async function safeDeleteUploadedFile(
  publicUrl: string,
  subfolder: string = "",
): Promise<void> {
  if (!publicUrl || !publicUrl.startsWith("/uploads/")) return;

  const cleanSubfolder = subfolder.replace(/[^a-zA-Z0-9_-]/g, "");
  const expectedPrefix = cleanSubfolder
    ? `/uploads/${cleanSubfolder}/`
    : "/uploads/";

  if (!publicUrl.startsWith(expectedPrefix)) return;

  const fileName = path.basename(publicUrl);
  if (!fileName || fileName.includes("..")) return;

  const candidateBases = getAllCandidateBaseDirs();
  for (const cBase of candidateBases) {
    const pathsToDelete = [
      path.join(cBase, "public", "uploads", cleanSubfolder, fileName),
      path.join(cBase, "uploads", cleanSubfolder, fileName),
      path.join(cBase, ".next", "standalone", "public", "uploads", cleanSubfolder, fileName),
    ];
    for (const p of pathsToDelete) {
      try {
        await fs.unlink(p);
      } catch {}
    }
  }
}
