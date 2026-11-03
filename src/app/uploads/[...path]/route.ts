import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fsSync from "fs";
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: segments } = await context.params;

    if (!segments || segments.length === 0) {
      return new NextResponse("Ruta inválida", { status: 400 });
    }

    // Prevención estricta de Path Traversal
    const safeSegments = segments
      .map((s) => s.replace(/[^a-zA-Z0-9_.-]/g, ""))
      .filter((s) => s !== ".." && s !== "." && s.length > 0);

    if (safeSegments.length === 0) {
      return new NextResponse("Acceso no permitido", { status: 403 });
    }

    const relativeSubpath = safeSegments.join(path.sep);
    const baseDir = getBaseUploadDir();

    let absolutePath = path.join(baseDir, "public", "uploads", relativeSubpath);

    if (!fsSync.existsSync(absolutePath)) {
      const fallbackCwd = path.join(
        process.cwd(),
        "public",
        "uploads",
        relativeSubpath,
      );
      const standalonePath = path.join(
        baseDir,
        ".next",
        "standalone",
        "public",
        "uploads",
        relativeSubpath,
      );

      if (fsSync.existsSync(fallbackCwd)) {
        absolutePath = fallbackCwd;
      } else if (fsSync.existsSync(standalonePath)) {
        absolutePath = standalonePath;
      } else {
        return new NextResponse("Archivo no encontrado", { status: 404 });
      }
    }

    const stat = fsSync.statSync(absolutePath);
    if (!stat.isFile()) {
      return new NextResponse("Recurso no válido", { status: 404 });
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const baseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    };

    const range = request.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

      if (start >= stat.size || end >= stat.size) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${stat.size}`,
          },
        });
      }

      const chunkLength = end - start + 1;
      const fileStream = fsSync.createReadStream(absolutePath, { start, end });
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
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Content-Length": chunkLength.toString(),
        },
      });
    }

    const fileStream = fsSync.createReadStream(absolutePath);
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
        "Content-Length": stat.size.toString(),
      },
    });
  } catch (error) {
    console.error("[UPLOADS ROUTE ERROR]:", error);
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

    const safeSegments = segments
      .map((s) => s.replace(/[^a-zA-Z0-9_.-]/g, ""))
      .filter((s) => s !== ".." && s !== "." && s.length > 0);

    const relativeSubpath = safeSegments.join(path.sep);
    const baseDir = getBaseUploadDir();
    let absolutePath = path.join(baseDir, "public", "uploads", relativeSubpath);

    if (!fsSync.existsSync(absolutePath)) {
      return new NextResponse(null, { status: 404 });
    }

    const stat = fsSync.statSync(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stat.size.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
