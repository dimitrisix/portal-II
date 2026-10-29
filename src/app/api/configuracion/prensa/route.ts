import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyApiAuth } from "@/lib/auth-server";
import { extraerYouTubeId } from "@/lib/videoUtils";
import { logAction } from "@/app/dashboard/auditoria/logger";
import { notifyPortalChange } from "@/lib/portal-sync";

export const dynamic = "force-dynamic";

interface PrensaRequestBody {
  id?: number | string;
  titulo?: string;
  descripcion?: string;
  videoUrl?: string;
  fecha?: string;
}

// GET: Obtener todos los videos activos ordenados (Público)
export async function GET() {
  try {
    const videos = await prisma.prensaVideo.findMany({
      where: { activo: true },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(videos ?? [], {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: unknown) {
    console.error("Error en GET /api/configuracion/prensa:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST: Crear o editar video (Protegido)
export async function POST(request: Request) {
  // 1. Barrera de Seguridad
  const auth = await verifyApiAuth(request, { permission: "prensa.manage" });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body: PrensaRequestBody = await request.json();
    const { id, titulo, descripcion, videoUrl, fecha } = body;

    const sanitizedTitulo = titulo?.trim().slice(0, 200);
    const sanitizedUrl = videoUrl?.trim();
    const sanitizedDesc = descripcion?.trim().slice(0, 1000) || null;

    if (!sanitizedTitulo || !sanitizedUrl) {
      return NextResponse.json(
        { error: "El título y la URL del video son requeridos" },
        { status: 400 },
      );
    }

    // Validación estricta de formato del video (previene inyección de URLs maliciosas)
    if (!extraerYouTubeId(sanitizedUrl)) {
      return NextResponse.json(
        {
          error:
            "La URL ingresada no es válida. Solo se admiten enlaces legítimos de YouTube o Instagram.",
        },
        { status: 400 },
      );
    }

    const fechaFinal =
      fecha?.trim().slice(0, 50) ||
      new Date().toLocaleDateString("es-VE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

    let video;
    if (id && Number(id) > 0) {
      video = await prisma.prensaVideo.update({
        where: { id: Number(id) },
        data: {
          titulo: sanitizedTitulo,
          descripcion: sanitizedDesc,
          videoUrl: sanitizedUrl,
          fecha: fechaFinal,
        },
      });

      await logAction({
        action: "UPDATE_PRENSA",
        module: "Prensa",
        details: `Video de prensa ID ${id} ("${sanitizedTitulo}") editado por ${auth.user.name}.`,
        userId: auth.user.id,
        userName: auth.user.name,
      });
    } else {
      video = await prisma.prensaVideo.create({
        data: {
          titulo: sanitizedTitulo,
          descripcion: sanitizedDesc,
          videoUrl: sanitizedUrl,
          fecha: fechaFinal,
          activo: true,
        },
      });

      await logAction({
        action: "CREATE_PRENSA",
        module: "Prensa",
        details: `Nuevo video de prensa publicado: "${sanitizedTitulo}" por ${auth.user.name}.`,
        userId: auth.user.id,
        userName: auth.user.name,
      });
    }

    revalidatePath("/");
    revalidatePath("/prensa");
    notifyPortalChange("prensa");
    return NextResponse.json({ success: true, video });
  } catch (error: unknown) {
    console.error("Error en POST /api/configuracion/prensa:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al procesar el video";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Eliminar video (Protegido)
export async function DELETE(request: Request) {
  // 1. Barrera de Seguridad
  const auth = await verifyApiAuth(request, { permission: "prensa.manage" });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const videoId = Number(id);

    const video = await prisma.prensaVideo.findUnique({
      where: { id: videoId },
    });

    if (video) {
      await prisma.prensaVideo.delete({
        where: { id: videoId },
      });

      await logAction({
        action: "DELETE_PRENSA",
        module: "Prensa",
        details: `Video ID ${videoId} ("${video.titulo}") eliminado por ${auth.user.name}.`,
        userId: auth.user.id,
        userName: auth.user.name,
      });
    }

    revalidatePath("/");
    revalidatePath("/prensa");
    notifyPortalChange("prensa");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error en DELETE /api/configuracion/prensa:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al eliminar video";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
