import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyApiAuth } from "@/lib/auth-server";
import { logAction } from "@/app/dashboard/auditoria/logger";
import { notifyPortalChange } from "@/lib/portal-sync";

export const dynamic = "force-dynamic";

interface FooterRequestBody {
  imagenUrl?: string;
  altTexto?: string;
  direccion?: string;
  rif?: string;
  textoCopyright?: string;
  visible?: boolean;
}

const DEFECTO = {
  imagenUrl: "/images/cintillo-footer.png",
  altTexto: "Cintillo Institucional",
  direccion: "Av. Andrés Bello, Edificio Las Fundaciones, Caracas - Venezuela",
  rif: "G-20002451-8",
  textoCopyright:
    "Fundación Propatria 2000 / FUNDAPROAL. Todos los derechos reservados.",
  visible: true,
};

export async function GET() {
  try {
    let footer = await prisma.footerConfig.findUnique({
      where: { id: 1 },
    });

    if (!footer) {
      footer = await prisma.footerConfig.create({
        data: { id: 1, ...DEFECTO },
      });
    }

    return NextResponse.json(footer, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error: unknown) {
    console.error("Error en GET /api/configuracion/footer:", error);
    return NextResponse.json(DEFECTO, { status: 200 });
  }
}

export async function POST(request: Request) {
  // 1. Barrera de Seguridad
  const auth = await verifyApiAuth(request, {
    permission: "pie_pagina.manage",
  });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body: FooterRequestBody = await request.json();
    const { imagenUrl, altTexto, direccion, rif, textoCopyright, visible } =
      body;

    // Validación y sanitización estricta de longitudes
    const sanitizedImagen = imagenUrl?.trim().slice(0, 500) || DEFECTO.imagenUrl;
    const sanitizedAlt = altTexto?.trim().slice(0, 150) || DEFECTO.altTexto;
    const sanitizedDireccion =
      direccion !== undefined
        ? direccion.trim().slice(0, 300)
        : DEFECTO.direccion;
    const sanitizedRif =
      rif !== undefined ? rif.trim().slice(0, 50) : DEFECTO.rif;
    const sanitizedCopyright =
      textoCopyright !== undefined
        ? textoCopyright.trim().slice(0, 300)
        : DEFECTO.textoCopyright;
    const isVisible = visible !== undefined ? Boolean(visible) : true;

    const footer = await prisma.footerConfig.upsert({
      where: { id: 1 },
      update: {
        imagenUrl: sanitizedImagen,
        altTexto: sanitizedAlt,
        direccion: sanitizedDireccion,
        rif: sanitizedRif,
        textoCopyright: sanitizedCopyright,
        visible: isVisible,
      },
      create: {
        id: 1,
        imagenUrl: sanitizedImagen,
        altTexto: sanitizedAlt,
        direccion: sanitizedDireccion,
        rif: sanitizedRif,
        textoCopyright: sanitizedCopyright,
        visible: isVisible,
      },
    });

    revalidatePath("/");
    notifyPortalChange("footer");

    await logAction({
      action: "UPDATE_FOOTER_CONFIG",
      module: "Pie de Página",
      details: `Configuración de pie de página actualizada por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    return NextResponse.json({ success: true, footer });
  } catch (error: unknown) {
    console.error("Error en POST /api/configuracion/footer:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error al actualizar configuración del pie de página";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
