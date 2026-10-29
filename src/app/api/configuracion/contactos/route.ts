import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyApiAuth } from "@/lib/auth-server";
import { logAction } from "@/app/dashboard/auditoria/logger";
import { notifyPortalChange } from "@/lib/portal-sync";

export const dynamic = "force-dynamic";

interface ContactoRequestBody {
  id?: number | string;
  tipo?: string;
  titulo?: string;
  contenido?: string;
  orden?: number | string;
}

// GET: Listar todos los ítems ordenados (Público)
export async function GET() {
  try {
    const items = await prisma.contactoItem.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { id: "desc" }],
    });

    return NextResponse.json(items ?? [], {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: unknown) {
    console.error("Error en GET /api/configuracion/contactos:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST: Crear o Editar ítem (Protegido)
export async function POST(request: Request) {
  // 1. Barrera de Seguridad
  const auth = await verifyApiAuth(request, {
    permission: "contactos.manage",
  });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body: ContactoRequestBody = await request.json();
    const { id, tipo, titulo, contenido, orden } = body;

    const sanitizedTipo = (tipo || "DOCUMENTO").trim().toUpperCase().slice(0, 50);
    const sanitizedTitulo = titulo?.trim().slice(0, 200);
    const sanitizedContenido = contenido?.trim().slice(0, 5000);
    const sanitizedOrden = Math.max(0, Math.min(10000, Number(orden) || 0));

    if (!sanitizedTipo || !sanitizedTitulo || !sanitizedContenido) {
      return NextResponse.json(
        {
          error:
            "La categoría (tipo), el título y la información son obligatorios",
        },
        { status: 400 },
      );
    }

    let item;
    if (id && Number(id) > 0) {
      const itemId = Number(id);
      item = await prisma.contactoItem.update({
        where: { id: itemId },
        data: {
          tipo: sanitizedTipo,
          titulo: sanitizedTitulo,
          contenido: sanitizedContenido,
          orden: sanitizedOrden,
        },
      });

      await logAction({
        action: "UPDATE_CONTACTO",
        module: "Contactos",
        details: `Item de contacto ID ${itemId} ("${sanitizedTitulo}") editado por ${auth.user.name}.`,
        userId: auth.user.id,
        userName: auth.user.name,
      });
    } else {
      item = await prisma.contactoItem.create({
        data: {
          tipo: sanitizedTipo,
          titulo: sanitizedTitulo,
          contenido: sanitizedContenido,
          orden: sanitizedOrden,
          activo: true,
        },
      });

      await logAction({
        action: "CREATE_CONTACTO",
        module: "Contactos",
        details: `Nuevo ítem de contacto creado: "${sanitizedTitulo}" por ${auth.user.name}.`,
        userId: auth.user.id,
        userName: auth.user.name,
      });
    }

    revalidatePath("/");
    revalidatePath("/contactos");
    if (id) {
      revalidatePath(`/contactos/${id}`);
    }
    notifyPortalChange("contactos");
    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    console.error("Error en POST /api/configuracion/contactos:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al procesar el ítem";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Eliminar ítem (Protegido)
export async function DELETE(request: Request) {
  // 1. Barrera de Seguridad
  const auth = await verifyApiAuth(request, {
    permission: "contactos.manage",
  });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const itemId = Number(id);

    const item = await prisma.contactoItem.findUnique({
      where: { id: itemId },
    });

    if (item) {
      await prisma.contactoItem.delete({
        where: { id: itemId },
      });

      await logAction({
        action: "DELETE_CONTACTO",
        module: "Contactos",
        details: `Ítem de contacto ID ${itemId} ("${item.titulo}") eliminado por ${auth.user.name}.`,
        userId: auth.user.id,
        userName: auth.user.name,
      });
    }

    revalidatePath("/");
    revalidatePath("/contactos");
    revalidatePath(`/contactos/${id}`);
    notifyPortalChange("contactos");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error en DELETE /api/configuracion/contactos:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al eliminar";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
