// Ubicación: src/app/dashboard/roles/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logAction } from "../auditoria/logger";
import { verifyServerActionAuth } from "@/lib/auth-server";

export interface RoleActionState {
  success?: boolean;
  error?: string;
}

export interface PermissionItem {
  id: number;
  name: string;
  description: string | null;
}

export interface RoleWithPermissions {
  id: number;
  name: string;
  description: string | null;
  permissions: PermissionItem[];
}

export async function createRole(
  prevState: RoleActionState | null,
  formData: FormData,
): Promise<RoleActionState> {
  // 1. Barrera de Seguridad
  const auth = await verifyServerActionAuth("roles.manage");
  if (!auth.ok) {
    return { error: auth.error };
  }

  const name = formData.get("name")?.toString()?.trim().toUpperCase().slice(0, 50);
  const description = formData.get("description")?.toString()?.trim().slice(0, 200);

  const permissionIds = formData
    .getAll("permissions")
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (!name) {
    return { error: "El nombre del rol es obligatorio." };
  }

  if (permissionIds.length === 0) {
    return { error: "Debes seleccionar al menos un permiso." };
  }

  try {
    await prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          connect: permissionIds.map((id) => ({ id })),
        },
      },
    });
    revalidatePath("/dashboard/roles");
    await logAction({
      action: "CREATE_ROLE",
      module: "Roles",
      details: `Se creó el rol "${name}" por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });
    return { success: true };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Ya existe un rol con este nombre." };
    }
    console.error("Error al crear rol:", error);
    return { error: "Ocurrió un error al crear el rol." };
  }
}

export async function updateRole(
  prevState: RoleActionState | null,
  formData: FormData,
): Promise<RoleActionState> {
  // 1. Barrera de Seguridad
  const auth = await verifyServerActionAuth("roles.manage");
  if (!auth.ok) {
    return { error: auth.error };
  }

  const idStr = formData.get("id")?.toString();
  const name = formData.get("name")?.toString()?.trim().toUpperCase().slice(0, 50);
  const description = formData.get("description")?.toString()?.trim().slice(0, 200);
  const permissionIds = formData
    .getAll("permissions")
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  const id = Number(idStr);
  if (!id || !Number.isInteger(id) || !name) {
    return { error: "El ID y el nombre del rol son obligatorios." };
  }

  if (permissionIds.length === 0) {
    return { error: "Debes seleccionar al menos un permiso." };
  }

  try {
    const existingRole = await prisma.role.findUnique({ where: { id } });
    if (!existingRole) {
      return { error: "El rol especificado no existe." };
    }

    // Proteger el rol de ADMINISTRADOR de ser renombrado
    if (existingRole.name === "ADMINISTRADOR" && name !== "ADMINISTRADOR") {
      return { error: "No está permitido cambiar el nombre del rol base ADMINISTRADOR." };
    }

    await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions: {
          set: permissionIds.map((permId) => ({ id: permId })),
        },
      },
    });
    revalidatePath("/dashboard/roles");
    await logAction({
      action: "UPDATE_ROLE",
      module: "Roles",
      details: `Se actualizó el rol "${name}" por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });
    return { success: true };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Ya existe otro rol con este nombre." };
    }
    return { error: "Error al actualizar el rol." };
  }
}

export async function deleteRole(id: number): Promise<RoleActionState> {
  // 1. Barrera de Seguridad
  const auth = await verifyServerActionAuth("roles.manage");
  if (!auth.ok) {
    return { error: auth.error };
  }

  const roleId = Number(id);
  if (!roleId || !Number.isInteger(roleId)) {
    return { error: "ID de rol inválido." };
  }

  try {
    const roleToDelete = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!roleToDelete) {
      return { error: "El rol no existe." };
    }

    // Protección estricta: nunca eliminar el rol ADMINISTRADOR
    if (
      roleToDelete.name === "ADMINISTRADOR" ||
      roleToDelete.name === "ADMIN"
    ) {
      return {
        error: "Operación prohibida: No se puede eliminar el rol de administración del sistema.",
      };
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    revalidatePath("/dashboard/roles");
    revalidatePath("/dashboard/users");
    await logAction({
      action: "DELETE_ROLE",
      module: "Roles",
      details: `Se eliminó el rol "${roleToDelete.name}" por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar rol:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        error:
          "No se puede eliminar este rol porque hay usuarios asignados a él.",
      };
    }

    return { error: "Ocurrió un error al eliminar el rol." };
  }
}

