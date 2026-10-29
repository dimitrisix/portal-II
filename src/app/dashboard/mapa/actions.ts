// Ubicación: src/app/dashboard/mapa/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyServerActionAuth } from "@/lib/auth-server";
import { logAction } from "../auditoria/logger";

/**
 * Valida y guarda (crea o actualiza) una sede institucional en el mapa.
 * Protegido criptográficamente con RBAC ("mapa.manage") y registro de auditoría.
 */
export async function guardarSede(formData: FormData) {
  // 1. Barrera de Seguridad Criptográfica y Roles
  const auth = await verifyServerActionAuth("mapa.manage");
  if (!auth.ok) {
    await logAction({
      action: "UNAUTHORIZED_ACTION_ATTEMPT",
      module: "Mapa",
      details: "Intento no autorizado de registrar o editar sedes en el mapa.",
    }).catch(() => {});
    throw new Error(auth.error);
  }

  let exitoso = false;

  try {
    const id = formData.get("id") as string | null;
    const nombre = (formData.get("nombre") as string)?.trim().slice(0, 150);
    const direccion = (formData.get("direccion") as string)?.trim().slice(0, 500) || null;

    // Normalizar comas a puntos en coordenadas
    const latStr = ((formData.get("lat") as string) || "").replace(",", ".").trim();
    const lngStr = ((formData.get("lng") as string) || "").replace(",", ".").trim();

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    // Validación estricta de coordenadas geográficas válidas
    if (!nombre || isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error("Datos de ubicación o coordenadas geográficas inválidas.");
    }

    if (id && Number(id) > 0) {
      // ACTUALIZAR SEDE
      const idNum = parseInt(id);
      await prisma.sedeMapa.update({
        where: { id: idNum },
        data: { nombre, direccion, lat, lng },
      });

      await logAction({
        action: "UPDATE_SEDE_MAPA",
        module: "Mapa",
        details: `Sede ID ${idNum} ("${nombre}") modificada por ${auth.user.name}. Coords: (${lat}, ${lng})`,
        userId: auth.user.id,
        userName: auth.user.name,
      });
    } else {
      // CREAR SEDE
      const nuevaSede = await prisma.sedeMapa.create({
        data: { nombre, direccion, lat, lng, activo: true },
      });

      await logAction({
        action: "CREATE_SEDE_MAPA",
        module: "Mapa",
        details: `Nueva sede ID ${nuevaSede.id} ("${nombre}") registrada por ${auth.user.name}.`,
        userId: auth.user.id,
        userName: auth.user.name,
      });
    }

    exitoso = true;
  } catch (error) {
    console.error("Error al guardar sede en base de datos:", error);
    throw error;
  }

  if (exitoso) {
    revalidatePath("/dashboard/mapa");
    revalidatePath("/");
    revalidatePath("/api/sedes");
    redirect("/dashboard/mapa");
  }
}

/**
 * Elimina una sede institucional del mapa.
 * Protegido criptográficamente con RBAC ("mapa.manage") y registro de auditoría.
 */
export async function eliminarSede(formData: FormData) {
  // 1. Barrera de Seguridad
  const auth = await verifyServerActionAuth("mapa.manage");
  if (!auth.ok) {
    await logAction({
      action: "UNAUTHORIZED_ACTION_ATTEMPT",
      module: "Mapa",
      details: "Intento no autorizado de eliminar una sede del mapa.",
    }).catch(() => {});
    throw new Error(auth.error);
  }

  try {
    const idRaw = formData.get("id") as string;
    const id = parseInt(idRaw);

    if (isNaN(id) || id <= 0) {
      throw new Error("Identificador de sede inválido.");
    }

    const sede = await prisma.sedeMapa.findUnique({ where: { id } });

    await prisma.sedeMapa.delete({ where: { id } });

    await logAction({
      action: "DELETE_SEDE_MAPA",
      module: "Mapa",
      details: `Sede ID ${id} ("${sede?.nombre || 'Desconocida'}") eliminada por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    revalidatePath("/dashboard/mapa");
    revalidatePath("/");
    revalidatePath("/api/sedes");
  } catch (error) {
    console.error("Error al eliminar sede:", error);
    throw error;
  }
}
