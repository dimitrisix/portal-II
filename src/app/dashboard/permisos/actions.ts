// Ubicación: src/app/dashboard/permisos/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logAction } from "../auditoria/logger";
import { verifyServerActionAuth } from "@/lib/auth-server";

export interface PermissionActionState {
  success?: boolean;
  error?: string;
}

export async function createPermission(
  prevState: PermissionActionState | null,
  formData: FormData,
): Promise<PermissionActionState> {
  // 1. Barrera de Seguridad
  const auth = await verifyServerActionAuth("permisos.manage");
  if (!auth.ok) {
    return { error: auth.error };
  }

  const name = formData.get("name")?.toString()?.trim().toLowerCase().slice(0, 50);
  const description = formData.get("description")?.toString()?.trim().slice(0, 200);

  if (!name) {
    return { error: "El nombre del permiso es obligatorio." };
  }

  // Validación de formato seguro
  if (!/^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(name)) {
    return {
      error: 'El permiso debe tener el formato "recurso.accion" con letras minúsculas (Ej: reportes.crear).',
    };
  }

  try {
    await prisma.permission.create({
      data: {
        name,
        description,
      },
    });

    revalidatePath("/dashboard/permisos");
    revalidatePath("/dashboard/roles");
    await logAction({
      action: "CREATE_PERMISSION",
      module: "Permisos",
      details: `Se creó el permiso "${name}" por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });
    return { success: true };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Este permiso ya existe en el sistema." };
    }
    return { error: "Error al crear el permiso." };
  }
}

export async function deletePermission(
  id: number,
): Promise<PermissionActionState> {
  // 1. Barrera de Seguridad
  const auth = await verifyServerActionAuth("permisos.manage");
  if (!auth.ok) {
    return { error: auth.error };
  }

  const permId = Number(id);
  if (!permId || !Number.isInteger(permId)) {
    return { error: "Identificador de permiso inválido." };
  }

  try {
    const permToDelete = await prisma.permission.findUnique({
      where: { id: permId },
    });

    if (!permToDelete) {
      return { error: "El permiso no existe." };
    }

    // Proteger permisos críticos del núcleo del sistema
    const CRITICAL_PERMISSIONS = [
      "users.manage",
      "roles.manage",
      "permisos.manage",
      "auditoria.view",
    ];

    if (CRITICAL_PERMISSIONS.includes(permToDelete.name)) {
      return {
        error: "Operación rechazada: No se pueden eliminar los permisos esenciales del sistema.",
      };
    }

    await prisma.permission.delete({
      where: { id: permId },
    });

    revalidatePath("/dashboard/permisos");
    revalidatePath("/dashboard/roles");
    await logAction({
      action: "DELETE_PERMISSION",
      module: "Permisos",
      details: `Se eliminó el permiso "${permToDelete.name}" por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar permiso:", error);
    return { error: "No se pudo eliminar el permiso." };
  }
}
