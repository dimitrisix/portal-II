import { NextRequest, NextResponse } from "next/server";
import path from "path";
import os from "os";
import fs from "fs/promises";
import fsSync from "fs";
import crypto from "crypto";
import { verifyApiAuth } from "@/lib/auth-server";
import { getBaseUploadDir } from "@/lib/safe-upload";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos

const MAX_CHUNK_SIZE = 25 * 1024 * 1024; // 25 MB máximo por fragmento

export async function POST(request: Request) {
  const auth = await verifyApiAuth(request, {
    permission: "revista.manage",
  });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const uploadId = (formData.get("uploadId") as string)?.trim();
    const chunkIndexRaw = formData.get("chunkIndex") as string | null;
    const totalChunksRaw = formData.get("totalChunks") as string | null;
    const fileName = (formData.get("fileName") as string)?.trim() || "documento.pdf";
    const fileSizeRaw = formData.get("fileSize") as string | null;
    const chunk = formData.get("chunk") as File | null;

    if (!uploadId || !/^[a-zA-Z0-9_-]{10,80}$/.test(uploadId)) {
      return NextResponse.json(
        { error: "Identificador de carga (uploadId) inválido o ausente." },
        { status: 400 },
      );
    }

    const chunkIndex = chunkIndexRaw !== null ? parseInt(chunkIndexRaw, 10) : -1;
    const totalChunks = totalChunksRaw !== null ? parseInt(totalChunksRaw, 10) : -1;
    const fileSize = fileSizeRaw !== null ? parseInt(fileSizeRaw, 10) : 0;

    if (chunkIndex < 0 || totalChunks <= 0 || chunkIndex >= totalChunks) {
      return NextResponse.json(
        { error: "Índice de fragmento o total de fragmentos inválido." },
        { status: 400 },
      );
    }

    if (!chunk || chunk.size === 0) {
      return NextResponse.json(
        { error: "El fragmento recibido está vacío." },
        { status: 400 },
      );
    }

    if (chunk.size > MAX_CHUNK_SIZE) {
      return NextResponse.json(
        { error: "El fragmento excede el tamaño máximo permitido (25MB)." },
        { status: 400 },
      );
    }

    // Usar os.tmpdir() (/tmp en Linux) que garantiza permisos de escritura universales
    const tempDir = path.join(os.tmpdir(), "portal-revista-temp", uploadId);
    await fs.mkdir(tempDir, { recursive: true });

    // En el primer fragmento (índice 0), validar los Magic Bytes de PDF (%PDF -> 0x25, 0x50, 0x44, 0x46)
    if (chunkIndex === 0) {
      const headerSlice = await chunk.slice(0, 1024).arrayBuffer();
      const headerBuffer = Buffer.from(headerSlice);

      if (
        headerBuffer.length < 4 ||
        headerBuffer[0] !== 0x25 ||
        headerBuffer[1] !== 0x50 ||
        headerBuffer[2] !== 0x44 ||
        headerBuffer[3] !== 0x46
      ) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch {}
        return NextResponse.json(
          { error: "El archivo no es un documento PDF válido o está corrupto." },
          { status: 400 },
        );
      }
    }

    // Escribir el fragmento en disco
    const partPath = path.join(tempDir, `${chunkIndex}.part`);
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
    await fs.writeFile(partPath, chunkBuffer);

    // Si aún no es el último fragmento, confirmar recepción exitosa
    if (chunkIndex < totalChunks - 1) {
      return NextResponse.json({
        success: true,
        completed: false,
        chunkIndex,
        totalChunks,
      });
    }

    // ==========================================
    // ÚLTIMO FRAGMENTO: ENSAMBLAR EL ARCHIVO FINAL
    // ==========================================
    for (let i = 0; i < totalChunks; i++) {
      const p = path.join(tempDir, `${i}.part`);
      if (!fsSync.existsSync(p)) {
        return NextResponse.json(
          { error: `Falta el fragmento ${i + 1} de ${totalChunks}. Carga incompleta.` },
          { status: 400 },
        );
      }
    }

    const cleanOriginalName = fileName.replace(/[^\w\s.-]/gi, "").trim() || "Revista.pdf";
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.pdf`;

    const baseDir = getBaseUploadDir();
    const primaryUploadDir = path.join(baseDir, "public", "uploads", "revista");
    const standaloneUploadDir = path.join(
      baseDir,
      ".next",
      "standalone",
      "public",
      "uploads",
      "revista",
    );

    try {
      await fs.mkdir(primaryUploadDir, { recursive: true, mode: 0o777 });
      try {
        await fs.chmod(primaryUploadDir, 0o777);
      } catch {}
    } catch (mkdirErr: unknown) {
      const err = mkdirErr as { code?: string; message?: string };
      if (err?.code === "EACCES" || err?.message?.includes("EACCES")) {
        return NextResponse.json(
          {
            error:
              "Permiso denegado en el servidor al crear la carpeta public/uploads/revista. Ejecuta: sudo mkdir -p /var/www/portal/public/uploads/revista && sudo chmod -R 777 /var/www/portal/public",
          },
          { status: 500 },
        );
      }
      throw mkdirErr;
    }

    try {
      await fs.mkdir(standaloneUploadDir, { recursive: true });
    } catch {
      // Ignorar si la carpeta standalone no existe o no tiene permisos
    }

    const primaryFilePath = path.join(primaryUploadDir, uniqueName);
    const standaloneFilePath = path.join(standaloneUploadDir, uniqueName);

    // Escribir ensamblado secuencial por streams con control estricto de backpressure (mantiene memoria RAM baja y estable)
    const writeStream = fsSync.createWriteStream(primaryFilePath);

    for (let i = 0; i < totalChunks; i++) {
      const p = path.join(tempDir, `${i}.part`);
      const buffer = await fs.readFile(p);
      if (!writeStream.write(buffer)) {
        await new Promise<void>((resolve) =>
          writeStream.once("drain", () => resolve()),
        );
      }
    }

    writeStream.end();
    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => resolve());
      writeStream.on("error", (err: unknown) => {
        const e = err as { code?: string; message?: string };
        if (e?.code === "EACCES" || e?.message?.includes("EACCES")) {
          reject(
            new Error(
              "Permiso denegado al escribir el archivo en public/uploads/revista. Ejecuta: sudo chmod -R 777 /var/www/portal/public",
            ),
          );
        } else {
          reject(err);
        }
      });
    });

    try {
      await fs.chmod(primaryFilePath, 0o666);
    } catch {}

    // Copiar hacia carpeta uploads raíz (para Nginx)
    const rootUploadDir = path.join(baseDir, "uploads", "revista");
    try {
      await fs.mkdir(rootUploadDir, { recursive: true, mode: 0o777 });
      await fs.chmod(rootUploadDir, 0o777);
      const rootFilePath = path.join(rootUploadDir, uniqueName);
      await fs.copyFile(primaryFilePath, rootFilePath);
      await fs.chmod(rootFilePath, 0o666);
    } catch {}

    // Copiar hacia carpeta standalone
    try {
      await fs.copyFile(primaryFilePath, standaloneFilePath);
      await fs.chmod(standaloneFilePath, 0o666);
    } catch {
      // Ignorar si no está en modo standalone
    }

    // Limpiar carpeta temporal de fragmentos
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}

    const totalBytes = fileSize > 0 ? fileSize : (await fs.stat(primaryFilePath)).size;
    const fileSizeFormatted =
      totalBytes >= 1024 * 1024
        ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(totalBytes / 1024)} KB`;

    return NextResponse.json({
      success: true,
      completed: true,
      publicUrl: `/uploads/revista/${uniqueName}`,
      originalName: cleanOriginalName,
      fileSizeFormatted,
    });
  } catch (error: unknown) {
    const errObj = error as { code?: string; message?: string };
    const errMsg = errObj?.message || String(error);
    console.error("Error al procesar fragmento de subida:", error);

    if (
      errObj?.code === "EACCES" ||
      errMsg.includes("EACCES") ||
      errMsg.includes("permission denied")
    ) {
      return NextResponse.json(
        {
          error:
            "Error de permisos (EACCES) en el servidor al guardar el archivo. Ejecuta: sudo chmod -R 777 /var/www/portal/public/uploads",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: `Error al procesar fragmento: ${errMsg}` },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyApiAuth(request, {
    permission: "revista.manage",
  });
  if (!auth.ok) {
    return auth.response;
  }

  const uploadId = request.nextUrl.searchParams.get("uploadId");
  if (uploadId && /^[a-zA-Z0-9_-]{10,80}$/.test(uploadId)) {
    const tempDir = path.join(os.tmpdir(), "portal-revista-temp", uploadId);
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  }

  return NextResponse.json({ success: true });
}
