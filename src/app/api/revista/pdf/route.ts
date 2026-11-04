import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { getBaseUploadDir } from "@/lib/safe-upload";

export const dynamic = "force-dynamic";

/**
 * Endpoint de transmisión optimizada (HTTP Range Requests) para documentos PDF masivos (400MB+).
 * Permite que los visores de PDF del navegador soliciten solo los bytes de las páginas
 * que el usuario está leyendo en tiempo real, abriendo el documento en menos de un segundo
 * sin descargar los 400MB completos en memoria y con permisos completos de visualización en iframe.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let filePathParam = searchParams.get("file");
    const idParam = searchParams.get("id");

    // Si no se especifica archivo, buscar por ID o la revista activa de mayor prioridad
    if (!filePathParam) {
      try {
        if (idParam && Number(idParam) > 0) {
          const revistaDb = await prisma.revistaConfig.findUnique({
            where: { id: Number(idParam) },
          });
          if (revistaDb?.archivoUrl) filePathParam = revistaDb.archivoUrl;
        } else {
          const revistaActiva = await prisma.revistaConfig.findFirst({
            where: { habilitado: true, archivoUrl: { not: null } },
            orderBy: [{ orden: "asc" }, { id: "desc" }],
          });
          if (revistaActiva?.archivoUrl) filePathParam = revistaActiva.archivoUrl;
        }
      } catch {
        // Fallback a ConfiguracionPortal
        try {
          const portalConf = await prisma.configuracionPortal.findUnique({
            where: { clave: "CONFIG_REVISTA" },
          });
          if (portalConf?.valor) {
            const parsed = JSON.parse(portalConf.valor);
            if (parsed.archivoUrl) filePathParam = parsed.archivoUrl;
          }
        } catch {}
      }
    }

    if (!filePathParam || !filePathParam.startsWith("/uploads/")) {
      return new NextResponse("No se encontró ningún archivo de revista configurado.", {
        status: 404,
      });
    }

    // Prevención estricta de Path Traversal
    const safeSubpath = path.normalize(filePathParam).replace(/^(\.\.[\/\\])+/, "").replace(/^[\\\/]+/, "");
    const baseDir = getBaseUploadDir();
    let absoluteFilePath = path.join(baseDir, "public", safeSubpath);

    if (!fs.existsSync(/*turbopackIgnore: true*/ absoluteFilePath)) {
      const fallbackCwd = path.join(process.cwd(), "public", safeSubpath);
      const standalonePath = path.join(baseDir, ".next", "standalone", "public", safeSubpath);
      const varWwwPath = path.join("/var/www/portal", "public", safeSubpath);
      const homeTecPath = path.join("/home/tecnologia/portal", "public", safeSubpath);

      if (fs.existsSync(/*turbopackIgnore: true*/ fallbackCwd)) {
        absoluteFilePath = fallbackCwd;
      } else if (fs.existsSync(/*turbopackIgnore: true*/ standalonePath)) {
        absoluteFilePath = standalonePath;
      } else if (fs.existsSync(/*turbopackIgnore: true*/ varWwwPath)) {
        absoluteFilePath = varWwwPath;
      } else if (fs.existsSync(/*turbopackIgnore: true*/ homeTecPath)) {
        absoluteFilePath = homeTecPath;
      } else {
        return new NextResponse("El archivo físico del documento no existe en el servidor.", {
          status: 404,
        });
      }
    }

    const stat = fs.statSync(/*turbopackIgnore: true*/ absoluteFilePath);
    const fileSize = stat.size;
    const range = request.headers.get("range");

    // Cabeceras de seguridad y permisos de visualización embebida en iframe
    const baseHeaders = {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="revista-institucional.pdf"',
      "Accept-Ranges": "bytes",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy":
        "default-src 'self' blob: data:; frame-ancestors 'self'; object-src 'self' blob: data:;",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    };

    // Si el navegador solicita un rango de bytes específico (Streaming parcial)
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunkLength = end - start + 1;
      const fileStream = fs.createReadStream(/*turbopackIgnore: true*/ absoluteFilePath, { start, end });

      // Convertir Node stream a Web ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
        cancel() {
          fileStream.destroy();
        },
      });

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": chunkLength.toString(),
        },
      });
    }

    // Solicitud sin rango: transmitir el archivo completo por fragmentos
    const fileStream = fs.createReadStream(/*turbopackIgnore: true*/ absoluteFilePath);
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Error al transmitir PDF:", error);
    return new NextResponse("Error interno al leer el documento PDF", { status: 500 });
  }
}

