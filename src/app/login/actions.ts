// Ubicación: src/app/login/actions.ts
"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { cookies, headers } from "next/headers";
import { logAction } from "../dashboard/auditoria/logger";
import {
  checkRateLimit,
  recordRateLimitHit,
  resetRateLimit,
  sanitizeIpAddress,
} from "@/lib/rate-limiter";

export type LoginState = {
  error?: string;
  success?: boolean;
};

export async function processLogin(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // FILTRO 1: Detección de bots automatizados mediante Honeypot
  const honeypot = formData.get("system_check_token")?.toString();
  if (honeypot) {
    return { error: "Solicitud rechazada." };
  }

  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    return { error: "Por favor, ingresa usuario y contraseña." };
  }

  // Obtener IP del cliente para control de fuerza bruta
  let rawClientIp = "127.0.0.1";
  let userAgent = "Desconocido";
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    rawClientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1";
    userAgent = headersList.get("user-agent") || "Desconocido";
  } catch {
    // Continuar con valores por defecto
  }

  const clientIp = sanitizeIpAddress(rawClientIp);

  // FILTRO 2: Protección Anti-Fuerza Bruta DUAL
  // A. Control Global por IP: previene ataques de fuerza bruta distribuidos y escaneo de usuarios (máx 20 fallos en 10 min)
  const globalRateLimitKey = `login_ip_${clientIp}`;
  const globalRateStatus = checkRateLimit(globalRateLimitKey, 20);
  if (globalRateStatus.limited) {
    const minutosRestantes = Math.ceil(globalRateStatus.remainingMs / 60000);
    await logAction({
      action: "LOGIN_BLOCKED_IP_FLOOD",
      module: "Autenticación",
      details: `IP bloqueada por ataques masivos de fuerza bruta (${globalRateStatus.currentAttempts} fallos). IP: ${clientIp}`,
      ipAddress: clientIp,
      userAgent,
    }).catch(() => {});

    return {
      error: `Demasiados intentos fallidos desde su conexión. Acceso bloqueado temporalmente por seguridad. Intente en ${minutosRestantes} minuto(s).`,
    };
  }

  // B. Control Específico por Usuario + IP (máx 5 fallos en 5 min)
  const rateLimitKey = `login_${clientIp}_${username.toLowerCase()}`;
  const rateStatus = checkRateLimit(rateLimitKey, 5);

  if (rateStatus.limited) {
    const minutosRestantes = Math.ceil(rateStatus.remainingMs / 60000);
    await logAction({
      action: "LOGIN_BLOCKED_BRUTE_FORCE",
      module: "Autenticación",
      details: `Bloqueado por exceso de intentos (${rateStatus.currentAttempts}) para usuario: ${username}. IP: ${clientIp}`,
      ipAddress: clientIp,
      userAgent,
    }).catch(() => {});

    return {
      error: `Demasiados intentos de acceso fallidos. Por seguridad, su acceso ha sido bloqueado temporalmente. Intente en ${minutosRestantes} minuto(s).`,
    };
  }

  let loginExitoso = false;

  try {
    // FILTRO 3: Consultar la base de datos local usando la instancia centralizada
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username.toLowerCase() },
          { cedula: username },
        ],
      },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    // Dummy hash para mitigar ataques de temporización (timing attacks) si el usuario no existe
    const dummyHash =
      "$2b$10$wT0a7h2v6qV8y0ZpM1zLquN0v3d5o7i9k1m3p5r7t9v1x3z5b7d9f";

    if (!user || !user.password) {
      // Ejecutar un compare falso para mantener tiempo de respuesta constante
      await bcrypt.compare(password, dummyHash);
      recordRateLimitHit(rateLimitKey);
      recordRateLimitHit(globalRateLimitKey, 10 * 60 * 1000);

      await logAction({
        action: "LOGIN_FAILED",
        module: "Autenticación",
        details: `Intento de acceso fallido: Usuario o correo inexistente (${username}).`,
        ipAddress: clientIp,
        userAgent,
      }).catch(() => {});

      return { error: "Usuario o contraseña incorrectos." };
    }

    // FILTRO 4: Comparación criptográfica de contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      recordRateLimitHit(rateLimitKey);
      recordRateLimitHit(globalRateLimitKey, 10 * 60 * 1000);

      await logAction({
        action: "LOGIN_FAILED",
        module: "Autenticación",
        details: `Contraseña incorrecta para el usuario: ${username}.`,
        userId: user.id,
        userName: user.name || username,
        ipAddress: clientIp,
        userAgent,
      }).catch(() => {});

      return { error: "Usuario o contraseña incorrectos." };
    }

    // Autenticación correcta: restablecer contador de intentos para este usuario
    resetRateLimit(rateLimitKey);

    const nombreEmpleado = user.name || "Funcionario";

    // Asignación de rol de seguridad por defecto si no lo tuviera
    if (!user.roleId) {
      const rolEmpleado = await prisma.role.findUnique({
        where: { name: "EMPLEADO" },
      });
      if (rolEmpleado) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { roleId: rolEmpleado.id },
          include: {
            role: {
              include: { permissions: true },
            },
          },
        });
      }
    }

    // FILTRO 5: Generación del JWT de Sesión (30 Minutos + Token Versioning)
    const userPermissions =
      user.role?.permissions.map(
        (permission: { name: string }) => permission.name,
      ) || [];

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.trim().length < 16) {
      throw new Error(
        "JWT_SECRET no configurado con la longitud de seguridad requerida.",
      );
    }
    const secretKey = new TextEncoder().encode(jwtSecret);

    const SESSION_EXPIRATION_SECONDS = 30 * 60; // 30 minutos alineado con InactivityWatcher
    const JWT_EXPIRATION_STRING = "30m";

    const token = await new SignJWT({
      userId: user.id,
      cedula: user.cedula || "",
      name: nombreEmpleado,
      roleName: user.role?.name || "EMPLEADO",
      permissions: userPermissions,
      tokenVersion: user.tokenVersion ?? 1,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRATION_STRING)
      .sign(secretKey);

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRATION_SECONDS,
    });

    // Actualizar última actividad del usuario
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    // FILTRO 6: Registro en Auditoría
    await logAction({
      action: "LOGIN_SUCCESS",
      module: "Autenticación",
      details: `Inicio de sesión exitoso: ${nombreEmpleado} (${username}) con rol ${user.role?.name || "EMPLEADO"}.`,
      userId: user.id,
      userName: nombreEmpleado,
      ipAddress: clientIp,
      userAgent,
    }).catch(() => {});

    loginExitoso = true;
  } catch (error: unknown) {
    console.error("[LOGIN ERROR FATAL]:", error);
    return {
      error: "Error interno del servidor. Intente de nuevo más tarde.",
    };
  }

  if (loginExitoso) {
    return { success: true };
  }

  return {};
}
