import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fsSync from "fs";
import { Readable } from "stream";
import { getBaseUploadDir } from "@/lib/safe-upload";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".json": "application/json",
};

/**
 * Busca de forma exhaustiva la ruta física del archivo subido en todas las carpetas
 * posibles del servidor (/var/www/portal, /home/tecnologia/portal, cwd, standalone).
 */
function resolveUploadFilePath(segments: string[]): string | null {
  if (!segments || segments.length === 0) return null;

  // Prevención estricta de Path Traversal
  const safeSegments = segments
    .map((s) => s.replace(/[^a-zA-Z0-9_.-]/g, ""))
    .filter((s) => s !== ".." && s !== "." && s.length > 0);

  if (safeSegments.length === 0) return null;

  const relativeSubpath = path.join(...safeSegments);
  const baseDir = getBaseUploadDir();

  const candidatePaths = [
    path.join(baseDir, "public", "uploads", relativeSubpath),
    path.join(baseDir, "uploads", relativeSubpath),
    path.join(process.cwd(), "public", "uploads", relativeSubpath),
    path.join(process.cwd(), "uploads", relativeSubpath),
    path.join("/var/www/portal", "public", "uploads", relativeSubpath),
    path.join("/var/www/portal", "uploads", relativeSubpath),
    path.join("/home/tecnologia/portal", "public", "uploads", relativeSubpath),
    path.join("/home/tecnologia/portal", "uploads", relativeSubpath),
    path.join(baseDir, ".next", "standalone", "public", "uploads", relativeSubpath),
    path.join(process.cwd(), ".next", "standalone", "public", "uploads", relativeSubpath),
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fsSync.existsSync(/*turbopackIgnore: true*/ candidate)) {
        const stat = fsSync.statSync(/*turbopackIgnore: true*/ candidate);
        if (stat.isFile()) {
          return candidate;
        }
      }
    } catch {}
  }

  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: segments } = await context.params;

    if (!segments || segments.length === 0) {
      return new NextResponse("Ruta inválida", { status: 400 });
    }

    const absolutePath = resolveUploadFilePath(segments);

    if (!absolutePath) {
      return new NextResponse("Archivo no encontrado", { status: 404 });
    }

    const stat = fsSync.statSync(/*turbopackIgnore: true*/ absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const baseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
    };

    // Manejo de peticiones de rango HTTP (ej: reproductores o visores PDF de navegador)
    const range = request.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

      if (isNaN(start) || start >= stat.size || end >= stat.size || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${stat.size}`,
          },
        });
      }

      const chunkLength = end - start + 1;
      const buffer = Buffer.alloc(chunkLength);
      const fd = fsSync.openSync(/*turbopackIgnore: true*/ absolutePath, "r");
      fsSync.readSync(fd, buffer, 0, chunkLength, start);
      fsSync.closeSync(fd);

      return new NextResponse(new Uint8Array(buffer), {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Content-Length": chunkLength.toString(),
        },
      });
    }

    // Para archivos de hasta 20 MB (imágenes PNG/JPG/WEBP/SVG): entrega inmediata sin overhead
    if (stat.size <= 20 * 1024 * 1024) {
      const fileBuffer = fsSync.readFileSync(/*turbopackIgnore: true*/ absolutePath);
      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          ...baseHeaders,
          "Content-Length": stat.size.toString(),
        },
      });
    }

    // Para archivos masivos (>20 MB como PDFs masivos): streaming
    const fileStream = fsSync.createReadStream(/*turbopackIgnore: true*/ absolutePath);
    const webStream = Readable.toWeb(fileStream);

    return new NextResponse(webStream as unknown as ReadableStream, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": stat.size.toString(),
      },
    });
  } catch (error) {
    console.error("[API UPLOADS ERROR]:", error);
    return new NextResponse("Error al leer el archivo", { status: 500 });
  }
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: segments } = await context.params;
    if (!segments || segments.length === 0) {
      return new NextResponse(null, { status: 400 });
    }

    const absolutePath = resolveUploadFilePath(segments);
    if (!absolutePath) {
      return new NextResponse(null, { status: 404 });
    }

    const stat = fsSync.statSync(/*turbopackIgnore: true*/ absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stat.size.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

