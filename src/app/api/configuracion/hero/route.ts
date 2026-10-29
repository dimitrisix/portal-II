import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyApiAuth } from "@/lib/auth-server";
import { processAndSaveImage, safeDeleteUploadedFile } from "@/lib/safe-upload";
import { logAction } from "@/app/dashboard/auditoria/logger";
import { notifyPortalChange } from "@/lib/portal-sync";

// GET: Obtener todas las imágenes activas ordenadas (Público)
export async function GET() {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { activo: true },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(slides, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error al obtener slides:", error);
    return NextResponse.json(
      { error: "Error al cargar imágenes" },
      { status: 500 },
    );
  }
}

// POST: Subir y agregar una nueva imagen al carrusel (Protegido)
export async function POST(request: Request) {
  // 1. Barrera de Seguridad
  const auth = await verifyApiAuth(request, { permission: "hero.manage" });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("imagen") as File | null;

    // 2. Procesamiento y guardado seguro de imagen
    const uploadResult = await processAndSaveImage(file, "hero");

    if (!uploadResult.success || !uploadResult.publicUrl) {
      return NextResponse.json(
        { error: uploadResult.error || "Error al procesar la imagen del banner" },
        { status: 400 },
      );
    }

    const nuevoSlide = await prisma.heroSlide.create({
      data: {
        imagenUrl: uploadResult.publicUrl,
        activo: true,
      },
    });

    revalidatePath("/");
    notifyPortalChange("hero");

    await logAction({
      action: "CREATE_HERO_SLIDE",
      module: "Banner Principal",
      details: `Nueva imagen de banner agregada por ${auth.user.name}. ID: ${nuevoSlide.id}`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    return NextResponse.json({ success: true, slide: nuevoSlide });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    return NextResponse.json(
      { error: "Error al procesar la imagen" },
      { status: 500 },
    );
  }
}

// DELETE: Eliminar una imagen del carrusel por su ID (Protegido)
export async function DELETE(request: Request) {
  // 1. Barrera de Seguridad
  const auth = await verifyApiAuth(request, { permission: "hero.manage" });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get("id");
    const id = Number(idStr);

    if (!id || !Number.isInteger(id)) {
      return NextResponse.json(
        { error: "ID de banner inválido o no proporcionado" },
        { status: 400 },
      );
    }

    const slide = await prisma.heroSlide.findUnique({
      where: { id },
    });

    if (slide) {
      // Eliminar el archivo físico de forma segura sin riesgo de Path Traversal
      await safeDeleteUploadedFile(slide.imagenUrl, "hero");

      await prisma.heroSlide.delete({
        where: { id },
      });

      await logAction({
        action: "DELETE_HERO_SLIDE",
        module: "Banner Principal",
        details: `Banner ID ${id} eliminado por ${auth.user.name}.`,
        userId: auth.user.id,
        userName: auth.user.name,
      });
    }

    revalidatePath("/");
    notifyPortalChange("hero");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar slide:", error);
    return NextResponse.json(
      { error: "Error al eliminar la imagen" },
      { status: 500 },
    );
  }
}
