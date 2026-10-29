import path from "path";
import fs from "fs/promises";

export async function saveUploadedFile(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  // 1. Ruta en el proyecto principal
  const primaryDir = path.join(process.cwd(), "public", "uploads");

  // 2. Ruta física exacta en el standalone de producción
  const standaloneDir = path.join(
    process.cwd(),
    ".next",
    "standalone",
    "public",
    "uploads",
  );

  // Asegurar que ambas carpetas existan
  await fs.mkdir(primaryDir, { recursive: true });
  await fs.mkdir(standaloneDir, { recursive: true });

  const primaryPath = path.join(primaryDir, filename);
  const standalonePath = path.join(standaloneDir, filename);

  // Escribir el archivo físicamente en AMBAS ubicaciones simultáneamente
  await fs.writeFile(primaryPath, buffer);
  await fs.writeFile(standalonePath, buffer);

  return `/uploads/${filename}`;
}
