// Ubicación: src/app/dashboard/users/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { logAction } from "../auditoria/logger";
import { verifyServerActionAuth } from "@/lib/auth-server";

export interface ActionState {
  success?: boolean;
  error?: string;
}

// ==========================================
// FUNCIÓN DE VALIDACIÓN DE CONTRASEÑA SEGURA
// ==========================================
function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe contener al menos una letra mayúscula.";
  }
  if (!/[a-z]/.test(password)) {
    return "La contraseña debe contener al menos una letra minúscula.";
  }
  if (!/[0-9]/.test(password)) {
    return "La contraseña debe contener al menos un número.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "La contraseña debe contener al menos un caracter especial (ej: @, #, $, !, etc.).";
  }
  return null;
}

export async function updateUser(
  prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  // 1. Barrera de Seguridad Criptográfica y Control de Acceso
  const auth = await verifyServerActionAuth("users.manage");
  if (!auth.ok) {
    return { error: auth.error };
  }

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString()?.trim().slice(0, 100);
  const cedula = formData.get("cedula")?.toString()?.trim().slice(0, 20) || null;
  const username = formData.get("username")?.toString()?.trim().slice(0, 50) || null;
  const email = formData.get("email")?.toString()?.trim().toLowerCase().slice(0, 100);
  const roleIdStr = formData.get("roleId")?.toString();
  const roleId = roleIdStr ? Number(roleIdStr) : null;

  if (!id || !name || !email) {
    return { error: "Todos los campos obligatorios deben ser completados." };
  }

  // Validación básica de formato de correo
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "El formato del correo electrónico no es válido." };
  }

  try {
    const userId = Number(id);
    if (!Number.isInteger(userId)) {
      return { error: "Identificador de usuario inválido." };
    }

    // Prevenir escalada de privilegios: si no es admin maestro, no puede asignar rol de administrador
    if (roleId) {
      const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
      if (
        (targetRole?.name === "ADMINISTRADOR" || targetRole?.name === "ADMIN") &&
        !auth.user.isAdmin
      ) {
        return { error: "Solo un administrador puede asignar roles administrativos." };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        cedula,
        username,
        email,
        roleId,
      },
    });

    revalidatePath("/dashboard/users");
    await logAction({
      action: "UPDATE_USER",
      module: "Usuarios",
      details: `Se actualizó el usuario ${name} (${email}) por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al actualizar:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "El correo electrónico, usuario o cédula ya están en uso por otro registro.",
      };
    }
    return {
      error: "Error al actualizar el usuario. Intenta de nuevo.",
    };
  }
}

export async function deleteUser(id: string | number): Promise<ActionState> {
  // 1. Barrera de Seguridad
  const auth = await verifyServerActionAuth("users.manage");
  if (!auth.ok) {
    return { error: auth.error };
  }

  try {
    const userId = Number(id);

    if (!Number.isInteger(userId)) {
      return { error: "El ID del usuario no es válido." };
    }

    // Anti-Autoeliminación: no permitir que el usuario activo se elimine a sí mismo
    if (userId === auth.user.id) {
      return { error: "Por seguridad, no puede eliminar su propia cuenta activa." };
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!userToDelete) {
      return { error: "El usuario a eliminar no existe." };
    }

    // Proteger al último administrador
    if (
      userToDelete.role?.name === "ADMINISTRADOR" ||
      userToDelete.role?.name === "ADMIN"
    ) {
      const adminCount = await prisma.user.count({
        where: {
          role: {
            name: { in: ["ADMINISTRADOR", "ADMIN"] },
          },
        },
      });

      if (adminCount <= 1) {
        return {
          error: "Operación rechazada: No se puede eliminar el único administrador del sistema.",
        };
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/dashboard/users");
    await logAction({
      action: "DELETE_USER",
      module: "Usuarios",
      details: `Se eliminó el usuario ${userToDelete.email || id} por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar:", error);
    return { error: "No se pudo eliminar el usuario. Intenta de nuevo." };
  }
}

export async function createUser(
  prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  // 1. Barrera de Seguridad
  const auth = await verifyServerActionAuth("users.manage");
  if (!auth.ok) {
    return { error: auth.error };
  }

  const name = formData.get("name")?.toString()?.trim().slice(0, 100) || "";
  const cedula = formData.get("cedula")?.toString()?.trim().slice(0, 20) || null;
  const username = formData.get("username")?.toString()?.trim().slice(0, 50) || null;
  const email = formData.get("email")?.toString()?.trim().toLowerCase().slice(0, 100) || "";
  const password = formData.get("password")?.toString() || "";
  const roleIdStr = formData.get("roleId")?.toString();
  const roleId = roleIdStr ? Number(roleIdStr) : null;

  if (!name || !email || !password || !cedula) {
    return {
      error: "Los campos Nombre, Cédula, Email y Contraseña son obligatorios.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "El formato del correo electrónico no es válido." };
  }

  // Prevenir escalada de privilegios
  if (roleId) {
    const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
    if (
      (targetRole?.name === "ADMINISTRADOR" || targetRole?.name === "ADMIN") &&
      !auth.user.isAdmin
    ) {
      return { error: "Solo un administrador puede asignar roles administrativos." };
    }
  }

  // Validación de seguridad estricta de contraseña
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return { error: passwordError };
  }

  try {
    const saltRounds = 12; // Aumentado a 12 rondas para mayor resistencia criptográfica
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await prisma.user.create({
      data: {
        name,
        cedula,
        username,
        email,
        password: hashedPassword,
        roleId: roleId ? Number(roleId) : null,
      },
    });

    revalidatePath("/dashboard/users");
    await logAction({
      action: "CREATE_USER",
      module: "Usuarios",
      details: `Se creó el usuario ${name} (${email}) por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });
    return { success: true };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;
      if (Array.isArray(target) && target.includes("cedula")) {
        return { error: "Esta cédula ya está registrada." };
      }
      return { error: "El correo electrónico, nombre de usuario o cédula ya están registrados." };
    }
    return { error: "Ocurrió un error al crear el usuario." };
  }
}

export async function resetPassword(
  prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  // 1. Barrera de Seguridad
  const auth = await verifyServerActionAuth("users.manage");
  if (!auth.ok) {
    return { error: auth.error };
  }

  const id = formData.get("id")?.toString();
  const newPassword = formData.get("newPassword")?.toString();

  if (!id || !newPassword) {
    return { error: "El ID y la nueva contraseña son obligatorios." };
  }

  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return { error: passwordError };
  }

  try {
    const userId = Number(id);
    if (!Number.isInteger(userId)) {
      return { error: "ID de usuario inválido." };
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizamos la contraseña e invalidamos cualquier sesión activa incrementando tokenVersion
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 }, // Invalidación inmediata de tokens antiguos
      },
      select: { email: true },
    });

    revalidatePath("/dashboard/users");
    await logAction({
      action: "RESET_PASSWORD",
      module: "Usuarios",
      details: `Se restableció la contraseña del usuario ${updatedUser?.email || id} e invalidaron sus sesiones por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    return { success: true };
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    return { error: "No se pudo cambiar la contraseña. Intenta de nuevo." };
  }
}
