"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyServerActionAuth } from "@/lib/auth-server";
import { logAction } from "./dashboard/auditoria/logger";
import { extraerYouTubeId } from "@/lib/videoUtils";
import { notifyPortalChange } from "@/lib/portal-sync";

// ----------------------------------------------------
// INTERFACES DE TIPADO TYPESCRIPT
// ----------------------------------------------------

export interface PrensaItemInput {
  id?: number;
  titulo: string;
  descripcion?: string | null;
  videoUrl: string;
  fecha?: string;
  activo?: boolean;
  orden?: number;
}

export interface ProgramaItemInput {
  id?: number;
  titulo: string;
  resumen: string;
  contenido?: string | null;
  fecha: string;
  imagenUrl: string;
  enlaceUrl?: string | null;
  activo?: boolean;
  orden?: number;
}

export interface ContactoItemInput {
  id?: number;
  tipo: string;
  titulo: string;
  contenido: string;
  activo?: boolean;
  orden?: number;
}

// ----------------------------------------------------
// ACCIONES PARA PRENSA / VIDEOS (Modelo: PrensaVideo)
// ----------------------------------------------------

export async function getPrensa() {
  try {
    const list = await prisma.prensaVideo.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });

    return list.map((item) => ({
      id: item.id,
      titulo: item.titulo,
      descripcion: item.descripcion || "",
      videoUrl: item.videoUrl,
      fecha: item.fecha || "Reciente",
      activo: item.activo,
      orden: item.orden,
      creadoAt: item.creadoAt?.toISOString() || new Date().toISOString(),
      actualizadoAt:
        item.actualizadoAt?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error en getPrensa:", error);
    return [];
  }
}

export async function syncPrensaList(prensaList: PrensaItemInput[]) {
  // 1. Barrera de Seguridad Criptográfica y Roles
  const auth = await verifyServerActionAuth("prensa.manage");
  if (!auth.ok) {
    await logAction({
      action: "UNAUTHORIZED_ACTION_ATTEMPT",
      module: "Prensa",
      details: "Intento no autorizado de sincronizar catálogo de videos de prensa.",
    }).catch(() => {});
    throw new Error(auth.error);
  }

  try {
    // 2. Validación y sanitización estricta de datos de entrada
    const sanitizedList = (prensaList || []).map((item, index) => {
      const titulo = (item.titulo || "").trim().slice(0, 200);
      const descripcion = item.descripcion
        ? item.descripcion.trim().slice(0, 1000)
        : null;
      const videoUrl = (item.videoUrl || "").trim();

      // Verificar que el video sea un formato admitido (YouTube / Instagram)
      if (videoUrl && !extraerYouTubeId(videoUrl)) {
        throw new Error(
          `La URL del video "${videoUrl.slice(0, 30)}..." no es válida. Use enlaces de YouTube o Instagram.`,
        );
      }

      return {
        titulo: titulo || "Sin título",
        descripcion,
        videoUrl,
        fecha: (item.fecha || "Reciente").trim().slice(0, 50),
        activo: item.activo ?? true,
        orden: index,
      };
    });

    const ops: Array<
      | ReturnType<typeof prisma.prensaVideo.deleteMany>
      | ReturnType<typeof prisma.prensaVideo.createMany>
    > = [prisma.prensaVideo.deleteMany()];

    if (sanitizedList.length > 0) {
      ops.push(
        prisma.prensaVideo.createMany({
          data: sanitizedList,
        }),
      );
    }

    await prisma.$transaction(ops);

    revalidatePath("/");
    revalidatePath("/prensa");
    revalidatePath("/dashboard/prensa");
    notifyPortalChange("prensa");

    await logAction({
      action: "SYNC_PRENSA",
      module: "Prensa",
      details: `Se sincronizaron ${sanitizedList.length} videos de prensa por el usuario ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    return { success: true };
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error
        ? error.message
        : "Error al sincronizar videos de prensa";
    console.error("Error en syncPrensaList:", error);
    throw new Error(errMessage);
  }
}

// ----------------------------------------------------
// ACCIONES PARA PROGRAMAS (Modelo: Programa)
// ----------------------------------------------------

export async function getProgramas() {
  try {
    const list = await prisma.programa.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });

    return list.map((item) => ({
      id: item.id,
      titulo: item.titulo,
      resumen: item.resumen,
      contenido: item.contenido || "",
      fecha: item.fecha || "Reciente",
      imagenUrl: item.imagenUrl,
      enlaceUrl: item.enlaceUrl || "",
      activo: item.activo,
      orden: item.orden,
      creadoAt: item.creadoAt?.toISOString() || new Date().toISOString(),
      actualizadoAt:
        item.actualizadoAt?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error en getProgramas:", error);
    return [];
  }
}

export async function syncProgramasList(programasList: ProgramaItemInput[]) {
  // 1. Barrera de Seguridad
  const auth = await verifyServerActionAuth("programas.manage");
  if (!auth.ok) {
    await logAction({
      action: "UNAUTHORIZED_ACTION_ATTEMPT",
      module: "Programas",
      details: "Intento no autorizado de sincronizar catálogo de programas.",
    }).catch(() => {});
    throw new Error(auth.error);
  }

  try {
    const sanitizedList = (programasList || []).map((item, index) => ({
      titulo: (item.titulo || "").trim().slice(0, 200),
      resumen: (item.resumen || "").trim().slice(0, 1000),
      contenido: item.contenido ? item.contenido.trim().slice(0, 10000) : null,
      fecha: (item.fecha || "Reciente").trim().slice(0, 50),
      imagenUrl: (item.imagenUrl || "/images/banner-institucional.jpg").trim(),
      enlaceUrl: item.enlaceUrl ? item.enlaceUrl.trim().slice(0, 500) : null,
      activo: item.activo ?? true,
      orden: index,
    }));

    const ops: Array<
      | ReturnType<typeof prisma.programa.deleteMany>
      | ReturnType<typeof prisma.programa.createMany>
    > = [prisma.programa.deleteMany()];

    if (sanitizedList.length > 0) {
      ops.push(
        prisma.programa.createMany({
          data: sanitizedList,
        }),
      );
    }

    await prisma.$transaction(ops);

    revalidatePath("/");
    revalidatePath("/programas");
    revalidatePath("/dashboard/programas");
    notifyPortalChange("programas");

    await logAction({
      action: "SYNC_PROGRAMAS",
      module: "Programas",
      details: `Se sincronizaron ${sanitizedList.length} programas por el usuario ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    return { success: true };
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error
        ? error.message
        : "Error al sincronizar programas";
    console.error("Error en syncProgramasList:", error);
    throw new Error(errMessage);
  }
}

// ----------------------------------------------------
// ACCIONES PARA CONTACTOS / DOCUMENTOS (Modelo: ContactoItem)
// ----------------------------------------------------

export async function getContactos() {
  try {
    const list = await prisma.contactoItem.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });

    return list.map((item) => ({
      id: item.id,
      tipo: item.tipo,
      titulo: item.titulo,
      contenido: item.contenido,
      activo: item.activo,
      orden: item.orden,
      creadoAt: item.creadoAt?.toISOString() || new Date().toISOString(),
      actualizadoAt:
        item.actualizadoAt?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error en getContactos:", error);
    return [];
  }
}

export async function syncContactosList(contactosList: ContactoItemInput[]) {
  // 1. Barrera de Seguridad
  const auth = await verifyServerActionAuth("contactos.manage");
  if (!auth.ok) {
    await logAction({
      action: "UNAUTHORIZED_ACTION_ATTEMPT",
      module: "Contactos",
      details: "Intento no autorizado de sincronizar contactos/publicaciones.",
    }).catch(() => {});
    throw new Error(auth.error);
  }

  try {
    const sanitizedList = (contactosList || []).map((item, index) => ({
      tipo: (item.tipo || "DOCUMENTO").trim().toUpperCase().slice(0, 50),
      titulo: (item.titulo || "").trim().slice(0, 200),
      contenido: (item.contenido || "").trim().slice(0, 5000),
      activo: item.activo ?? true,
      orden: index,
    }));

    const ops: Array<
      | ReturnType<typeof prisma.contactoItem.deleteMany>
      | ReturnType<typeof prisma.contactoItem.createMany>
    > = [prisma.contactoItem.deleteMany()];

    if (sanitizedList.length > 0) {
      ops.push(
        prisma.contactoItem.createMany({
          data: sanitizedList,
        }),
      );
    }

    await prisma.$transaction(ops);

    revalidatePath("/");
    revalidatePath("/contactos");
    revalidatePath("/dashboard/contactos");
    notifyPortalChange("contactos");

    await logAction({
      action: "SYNC_CONTACTOS",
      module: "Contactos",
      details: `Se sincronizaron ${sanitizedList.length} items de contacto por el usuario ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    return { success: true };
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error
        ? error.message
        : "Error al sincronizar contactos";
    console.error("Error en syncContactosList:", error);
    throw new Error(errMessage);
  }
}

// ----------------------------------------------------
// ACCIONES PARA CONFIGURACIÓN GLOBAL (Modelo: ConfiguracionPortal)
// ----------------------------------------------------

export async function getGlobalConfig(clave: string) {
  try {
    const config = await prisma.configuracionPortal.findUnique({
      where: { clave },
    });
    return config ? config.valor : null;
  } catch (error) {
    console.error(`Error en getGlobalConfig para clave "${clave}":`, error);
    return null;
  }
}

export async function updateGlobalConfig(clave: string, valor: string) {
  // 1. Barrera de Seguridad: Solo Administradores
  const auth = await verifyServerActionAuth();
  if (!auth.ok || !auth.user.isAdmin) {
    await logAction({
      action: "UNAUTHORIZED_ACTION_ATTEMPT",
      module: "Configuración",
      details: `Intento no autorizado de modificar la clave global: ${clave}.`,
    }).catch(() => {});
    throw new Error("Acceso denegado: Requiere privilegios de administrador.");
  }

  // 2. Allowlist estricta de claves permitidas
  const ALLOWED_CONFIG_KEYS = [
    "LOGO_PORTAL_URL",
    "APP_NAME",
    "HERO_TITLE",
    "FOOTER_TEXT",
  ];

  if (!ALLOWED_CONFIG_KEYS.includes(clave)) {
    throw new Error(`La clave de configuración "${clave}" no está permitida.`);
  }

  try {
    const sanitizedVal = valor.trim().slice(0, 1000);

    await prisma.configuracionPortal.upsert({
      where: { clave },
      update: { valor: sanitizedVal },
      create: { clave, valor: sanitizedVal },
    });

    revalidatePath("/", "layout");
    revalidatePath("/dashboard", "layout");
    notifyPortalChange("todos");

    await logAction({
      action: "UPDATE_GLOBAL_CONFIG",
      module: "Configuración",
      details: `Se actualizó la configuración "${clave}" por el usuario ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    return { success: true };
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error
        ? error.message
        : "Error al actualizar la configuración global";
    console.error(`Error en updateGlobalConfig para clave "${clave}":`, error);
    throw new Error(errMessage);
  }
}
