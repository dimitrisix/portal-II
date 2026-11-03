import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { logAction } from "@/app/dashboard/auditoria/logger";
import {
  checkRateLimit,
  recordRateLimitHit,
  resetRateLimit,
  sanitizeIpAddress,
} from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let username = "";
    let password = "";
    let honeypot = "";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      username = (body.username || "").trim();
      password = body.password || "";
      honeypot = body.system_check_token || "";
    } else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await request.formData();
      username = ((formData.get("username") as string) || "").trim();
      password = (formData.get("password") as string) || "";
      honeypot = (formData.get("system_check_token") as string) || "";
    }

    if (honeypot) {
      return NextResponse.json(
        { error: "Solicitud rechazada." },
        { status: 400 },
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: "Por favor, ingresa usuario y contraseña." },
        { status: 400 },
      );
    }

    // IP y User-Agent
    const forwardedFor = request.headers.get("x-forwarded-for");
    const rawClientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Desconocido";
    const clientIp = sanitizeIpAddress(rawClientIp);

    // Rate limit IP
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

      return NextResponse.json(
        {
          error: `Demasiados intentos fallidos desde su conexión. Acceso bloqueado temporalmente por seguridad. Intente en ${minutosRestantes} minuto(s).`,
        },
        { status: 429 },
      );
    }

    // Rate limit Usuario
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

      return NextResponse.json(
        {
          error: `Demasiados intentos de acceso fallidos. Por seguridad, su acceso ha sido bloqueado temporalmente. Intente en ${minutosRestantes} minuto(s).`,
        },
        { status: 429 },
      );
    }

    // Buscar usuario en base de datos
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

    const dummyHash =
      "$2b$10$wT0a7h2v6qV8y0ZpM1zLquN0v3d5o7i9k1m3p5r7t9v1x3z5b7d9f";

    if (!user || !user.password) {
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

      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 },
      );
    }

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

      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 },
      );
    }

    resetRateLimit(rateLimitKey);
    const nombreEmpleado = user.name || "Funcionario";

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

    const userPermissions =
      user.role?.permissions.map(
        (permission: { name: string }) => permission.name,
      ) || [];

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.trim().length < 16) {
      console.error("[LOGIN ERROR]: JWT_SECRET no configurado adecuadamente");
      return NextResponse.json(
        {
          error:
            "Error de configuración del servidor. Falta JWT_SECRET en las variables de entorno.",
        },
        { status: 500 },
      );
    }

    const secretKey = new TextEncoder().encode(jwtSecret);
    const SESSION_EXPIRATION_SECONDS = 30 * 60; // 30 minutos
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

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    await logAction({
      action: "LOGIN_SUCCESS",
      module: "Autenticación",
      details: `Inicio de sesión exitoso: ${nombreEmpleado} (${username}) con rol ${user.role?.name || "EMPLEADO"}.`,
      userId: user.id,
      userName: nombreEmpleado,
      ipAddress: clientIp,
      userAgent,
    }).catch(() => {});

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: nombreEmpleado,
        role: user.role?.name || "EMPLEADO",
      },
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRATION_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("[API LOGIN ERROR FATAL]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar el inicio de sesión." },
      { status: 500 },
    );
  }
}
