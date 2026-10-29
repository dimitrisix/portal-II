import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyApiAuth } from "@/lib/auth-server";
import { processAndSaveImage } from "@/lib/safe-upload";
import { logAction } from "@/app/dashboard/auditoria/logger";
import { notifyPortalChange } from "@/lib/portal-sync";

const CLAVE_CONFIG = "LOGO_PORTAL_URL";
const LOGO_DEFECTO = "/logo.png";

// GET: Obtener el logo desde la base de datos (público)
export async function GET() {
  try {
    const registro = await prisma.configuracionPortal.findUnique({
      where: { clave: CLAVE_CONFIG },
    });

    return NextResponse.json(
      { url: registro?.valor || LOGO_DEFECTO },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Error al consultar logo en base de datos:", error);
    return NextResponse.json({ url: LOGO_DEFECTO }, { status: 500 });
  }
}

// POST: Almacenar archivo y registrar en base de datos (Protegido)
export async function POST(request: Request) {
  // 1. Barrera de Seguridad
  const auth = await verifyApiAuth(request, { permission: "logo.manage" });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    // 2. Procesamiento y Almacenamiento Seguro (Valida MIME, Magic Bytes, Tamaño y neutraliza Path Traversal)
    const uploadResult = await processAndSaveImage(file, "logo");

    if (!uploadResult.success || !uploadResult.publicUrl) {
      return NextResponse.json(
        { error: uploadResult.error || "Error al procesar la imagen del logo" },
        { status: 400 },
      );
    }

    const configuracion = await prisma.configuracionPortal.upsert({
      where: { clave: CLAVE_CONFIG },
      update: { valor: uploadResult.publicUrl },
      create: {
        clave: CLAVE_CONFIG,
        valor: uploadResult.publicUrl,
      },
    });

    revalidatePath("/");
    notifyPortalChange("logo");

    await logAction({
      action: "UPDATE_LOGO",
      module: "Identidad",
      details: `Logotipo actualizado por ${auth.user.name}. Ruta: ${uploadResult.publicUrl}`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    return NextResponse.json({
      success: true,
      logo: { url: configuracion.valor },
    });
  } catch (error) {
    console.error("Error al persistir logo en base de datos:", error);
    return NextResponse.json(
      { error: "Error interno al guardar en base de datos" },
      { status: 500 },
    );
  }
}
