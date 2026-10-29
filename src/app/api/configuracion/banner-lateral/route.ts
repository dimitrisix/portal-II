import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyApiAuth } from "@/lib/auth-server";
import { processAndSaveImage } from "@/lib/safe-upload";
import { logAction } from "@/app/dashboard/auditoria/logger";
import { notifyPortalChange } from "@/lib/portal-sync";

export const dynamic = "force-dynamic";

// 1. Método GET: Lo que usa la portada y el panel para LEER la imagen (Público)
export async function GET() {
  try {
    let banner = await prisma.bannerLateralConfig.findUnique({
      where: { id: 1 },
    });

    if (!banner) {
      banner = await prisma.bannerLateralConfig.create({
        data: {
          id: 1,
          imagenUrl: "/images/silueta-madre.png",
          visible: true,
        },
      });
    }

    return NextResponse.json(banner, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error al obtener banner:", error);
    return NextResponse.json(
      { error: "Error al leer la base de datos" },
      { status: 500 },
    );
  }
}

// 2. Método POST: Subir imagen del banner (Protegido)
export async function POST(request: Request) {
  // 1. Barrera de Seguridad
  const auth = await verifyApiAuth(request, {
    permission: "banner_lateral.manage",
  });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const visibleStr = formData.get("visible") as string | null;
    const isVisible = visibleStr !== "false";

    let rutaImagen: string | undefined;

    if (file && file.size > 0) {
      const uploadResult = await processAndSaveImage(file, "banner-lateral");
      if (!uploadResult.success || !uploadResult.publicUrl) {
        return NextResponse.json(
          { error: uploadResult.error || "Error al procesar la imagen" },
          { status: 400 },
        );
      }
      rutaImagen = uploadResult.publicUrl;
    }

    const bannerActualizado = await prisma.bannerLateralConfig.upsert({
      where: { id: 1 },
      update: {
        ...(rutaImagen ? { imagenUrl: rutaImagen } : {}),
        visible: isVisible,
      },
      create: {
        id: 1,
        imagenUrl: rutaImagen || "/images/silueta-madre.png",
        visible: isVisible,
      },
    });

    revalidatePath("/");
    notifyPortalChange("banner-lateral");

    await logAction({
      action: "UPDATE_BANNER_LATERAL",
      module: "Banner Lateral",
      details: `Configuración de banner lateral actualizada por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    return NextResponse.json({
      success: true,
      banner: bannerActualizado,
    });
  } catch (error) {
    console.error("Error al subir banner lateral:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error al procesar la imagen del banner";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
