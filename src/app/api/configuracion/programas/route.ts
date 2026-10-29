import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyApiAuth } from "@/lib/auth-server";
import { processAndSaveImage, safeDeleteUploadedFile } from "@/lib/safe-upload";
import { logAction } from "@/app/dashboard/auditoria/logger";
import { notifyPortalChange } from "@/lib/portal-sync";

export const dynamic = "force-dynamic";

// 1. GET: Listar programas (Público)
export async function GET() {
  try {
    const programas = await prisma.programa.findMany({
      where: { activo: true },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(programas ?? [], {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: unknown) {
    console.error("Error en GET /api/configuracion/programas:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// 2. POST: Crear o Editar programa (Protegido)
export async function POST(request: Request) {
  // 1. Barrera de Seguridad
  const auth = await verifyApiAuth(request, {
    permission: "programas.manage",
  });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const id = formData.get("id") as string | null;
    const titulo = (formData.get("titulo") as string)?.trim().slice(0, 200);
    const resumen = (formData.get("resumen") as string)?.trim().slice(0, 1000);
    const contenido =
      (formData.get("contenido") as string)?.trim().slice(0, 10000) || null;
    const fechaInput =
      (formData.get("fecha") as string)?.trim().slice(0, 50);
    const enlaceUrl =
      (formData.get("enlaceUrl") as string)?.trim().slice(0, 500) || null;
    const file = formData.get("imagen") as File | null;

    if (!titulo || !resumen) {
      return NextResponse.json(
        { error: "Título y resumen son requeridos" },
        { status: 400 },
      );
    }

    const fecha =
      fechaInput ||
      new Date().toLocaleDateString("es-VE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

    let rutaImagen: string | undefined = undefined;

    // Procesamiento seguro de archivo de imagen con validación de magic bytes y tamaño
    if (file && typeof file !== "string" && file.size > 0) {
      const uploadResult = await processAndSaveImage(file, "programas");
      if (!uploadResult.success || !uploadResult.publicUrl) {
        return NextResponse.json(
          {
            error:
              uploadResult.error || "Error al procesar la imagen del programa",
          },
          { status: 400 },
        );
      }
      rutaImagen = uploadResult.publicUrl;
    }

    let programa;

    if (id && Number(id) > 0) {
      // MODO EDICIÓN
      const idNum = Number(id);

      programa = await prisma.programa.update({
        where: { id: idNum },
        data: {
          titulo,
          resumen,
          contenido,
          fecha,
          enlaceUrl,
          ...(rutaImagen ? { imagenUrl: rutaImagen } : {}),
        },
      });

      await logAction({
        action: "UPDATE_PROGRAMA",
        module: "Programas",
        details: `Programa ID ${idNum} ("${titulo}") editado por ${auth.user.name}.`,
        userId: auth.user.id,
        userName: auth.user.name,
      });
    } else {
      // MODO CREACIÓN
      programa = await prisma.programa.create({
        data: {
          titulo,
          resumen,
          contenido,
          fecha,
          imagenUrl: rutaImagen || "/images/banner-institucional.jpg",
          enlaceUrl,
          activo: true,
        },
      });

      await logAction({
        action: "CREATE_PROGRAMA",
        module: "Programas",
        details: `Nuevo programa creado: "${titulo}" por ${auth.user.name}.`,
        userId: auth.user.id,
        userName: auth.user.name,
      });
    }

    revalidatePath("/");
    revalidatePath("/programas");
    notifyPortalChange("programas");
    return NextResponse.json({ success: true, programa });
  } catch (error: unknown) {
    console.error("Error crítico en POST /api/configuracion/programas:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error al procesar el programa en base de datos";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// 3. DELETE: Eliminar programa (Protegido)
export async function DELETE(request: Request) {
  // 1. Barrera de Seguridad
  const auth = await verifyApiAuth(request, {
    permission: "programas.manage",
  });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "ID de programa inválido o no proporcionado" },
        { status: 400 },
      );
    }

    const idNum = Number(id);

    const programa = await prisma.programa.findUnique({
      where: { id: idNum },
    });

    if (programa) {
      if (
        programa.imagenUrl &&
        programa.imagenUrl.startsWith("/uploads/programas/")
      ) {
        await safeDeleteUploadedFile(programa.imagenUrl, "programas");
      }

      await prisma.programa.delete({
        where: { id: idNum },
      });

      await logAction({
        action: "DELETE_PROGRAMA",
        module: "Programas",
        details: `Programa ID ${idNum} ("${programa.titulo}") eliminado por ${auth.user.name}.`,
        userId: auth.user.id,
        userName: auth.user.name,
      });
    }

    revalidatePath("/");
    revalidatePath("/programas");
    notifyPortalChange("programas");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error en DELETE /api/configuracion/programas:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error al eliminar el programa de la base de datos";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
