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
};

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

  const primaryUploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    cleanSubfolder,
  );
  const standaloneUploadDir = path.join(
    process.cwd(),
    ".next",
    "standalone",
    "public",
    "uploads",
    cleanSubfolder,
  );

  // Crear carpetas de forma segura
  await fs.mkdir(primaryUploadDir, { recursive: true });
  await fs.mkdir(standaloneUploadDir, { recursive: true });

  const primaryFilePath = path.join(primaryUploadDir, uniqueName);
  const standaloneFilePath = path.join(standaloneUploadDir, uniqueName);

  // Escribir en ambas ubicaciones
  await fs.writeFile(primaryFilePath, buffer);
  await fs.writeFile(standaloneFilePath, buffer);

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

  const primaryUploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    cleanSubfolder,
  );
  const standaloneUploadDir = path.join(
    process.cwd(),
    ".next",
    "standalone",
    "public",
    "uploads",
    cleanSubfolder,
  );

  await fs.mkdir(primaryUploadDir, { recursive: true });
  await fs.mkdir(standaloneUploadDir, { recursive: true });

  const primaryFilePath = path.join(primaryUploadDir, uniqueName);
  const standaloneFilePath = path.join(standaloneUploadDir, uniqueName);

  // Guardado eficiente por Streaming por fragmentos:
  // Escribe directamente al disco sin saturar la memoria RAM aun en archivos de 400MB o más
  const writeStream = fsSync.createWriteStream(primaryFilePath);
  const webStream = file.stream();
  const nodeReadable = Readable.fromWeb(webStream as unknown as import("stream/web").ReadableStream);

  await pipeline(nodeReadable, writeStream);

  // Clonación directa por sistema de archivos hacia la carpeta standalone
  try {
    await fs.copyFile(primaryFilePath, standaloneFilePath);
  } catch {
    // Si la carpeta standalone no está en uso en desarrollo, continuar normalmente
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

  const primaryFilePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    cleanSubfolder,
    fileName,
  );
  const standaloneFilePath = path.join(
    process.cwd(),
    ".next",
    "standalone",
    "public",
    "uploads",
    cleanSubfolder,
    fileName,
  );

  try {
    await fs.unlink(primaryFilePath);
  } catch {
    // Archivo ya no existía
  }

  try {
    await fs.unlink(standaloneFilePath);
  } catch {
    // Archivo ya no existía
  }
}
