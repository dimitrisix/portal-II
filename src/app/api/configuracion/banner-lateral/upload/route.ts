import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyApiAuth } from "@/lib/auth-server";
import { processAndSaveImage } from "@/lib/safe-upload";
import { logAction } from "@/app/dashboard/auditoria/logger";
import { notifyPortalChange } from "@/lib/portal-sync";

export const dynamic = "force-dynamic";

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

    // 2. Procesamiento y almacenamiento seguro
    const uploadResult = await processAndSaveImage(file, "banner-lateral");

    if (!uploadResult.success || !uploadResult.publicUrl) {
      return NextResponse.json(
        { error: uploadResult.error || "Error al procesar la ilustración lateral" },
        { status: 400 },
      );
    }

    // 3. Actualizar registro en base de datos
    const banner = await prisma.bannerLateralConfig.upsert({
      where: { id: 1 },
      update: {
        imagenUrl: uploadResult.publicUrl,
        visible: true,
      },
      create: {
        id: 1,
        imagenUrl: uploadResult.publicUrl,
        visible: true,
      },
    });

    revalidatePath("/");
    notifyPortalChange("banner-lateral");

    await logAction({
      action: "UPDATE_BANNER_LATERAL",
      module: "Banner Lateral",
      details: `Ilustración lateral actualizada por ${auth.user.name}. Ruta: ${uploadResult.publicUrl}`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error("Error al subir ilustración lateral:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error al procesar y guardar la imagen";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
