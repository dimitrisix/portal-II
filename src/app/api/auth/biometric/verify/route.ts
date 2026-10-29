// src/app/api/auth/biometric/verify/route.ts
import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { SignJWT } from "jose";
import { logAction } from "@/app/dashboard/auditoria/logger";
import {
  checkRateLimit,
  recordRateLimitHit,
  resetRateLimit,
  sanitizeIpAddress,
} from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    // 1. Control de Fuerza Bruta por IP
    const forwarded = request.headers.get("x-forwarded-for");
    const rawIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const clientIp = sanitizeIpAddress(rawIp);
    const rateKey = `bio_ver_${clientIp}`;

    const rateStatus = checkRateLimit(rateKey, 5);
    if (rateStatus.limited) {
      return NextResponse.json(
        {
          success: false,
          error: "Demasiados intentos de verificación. Intente de nuevo más tarde.",
        },
        { status: 429 },
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.trim().length < 16) {
      throw new Error("JWT_SECRET no configurado con la seguridad requerida");
    }
    const secretKey = new TextEncoder().encode(jwtSecret);

    const url = new URL(request.url);
    const rpID = url.hostname || "localhost";
    const expectedOrigin = url.origin;

    const body = await request.json();
    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get("currentChallenge")?.value;

    // Destrucción inmediata del challenge para mitigar ataques de repetición (Replay Attacks)
    cookieStore.delete("currentChallenge");

    if (!expectedChallenge) {
      return NextResponse.json(
        {
          success: false,
          error: "El reto biométrico expiró o es inválido. Inténtelo de nuevo.",
        },
        { status: 400 },
      );
    }

    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: "Identificador de credencial faltante." },
        { status: 400 },
      );
    }

    // 1. Buscamos al usuario en la BD que coincida con esta credencial biométrica
    const user = await prisma.user.findUnique({
      where: { credentialId: body.id },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    if (!user || !user.credentialId || !user.credentialPublicKey) {
      recordRateLimitHit(rateKey);
      return NextResponse.json(
        {
          success: false,
          error: "Credencial biométrica no registrada en el sistema.",
        },
        { status: 400 },
      );
    }

    // 2. Verificamos la autenticación biométrica usando la llave pública guardada
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: user.credentialId,
        publicKey: Buffer.from(user.credentialPublicKey),
        counter: Number(user.counter),
        transports: ["internal"],
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      recordRateLimitHit(rateKey);
      await logAction({
        action: "BIOMETRIC_LOGIN_FAILED",
        module: "Autenticación",
        details: `Verificación biométrica fallida para el usuario ID ${user.id} (${user.name}).`,
        userId: user.id,
        userName: user.name || "Usuario",
      }).catch(() => {});

      return NextResponse.json(
        { success: false, error: "Falló la verificación de la llave biométrica." },
        { status: 400 },
      );
    }

    // Restablecer contador de rate limit tras verificación exitosa
    resetRateLimit(rateKey);

    // 3. Éxito: actualizamos contador de seguridad contra replay attacks
    await prisma.user.update({
      where: { id: user.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        lastActive: new Date(),
      },
    });

    // 4. Generamos el token JWT estandarizado de sesión
    const userRole = (user.role?.name || "EMPLEADO").toUpperCase().trim();
    const userPermissions =
      user.role?.permissions.map((p) => p.name) || [];

    const SESSION_EXPIRATION_SECONDS = 30 * 60; // 30 minutos

    const token = await new SignJWT({
      userId: user.id,
      cedula: user.cedula || "",
      name: user.name || "Funcionario",
      roleName: userRole,
      permissions: userPermissions,
      tokenVersion: user.tokenVersion ?? 1,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30m")
      .sign(secretKey);

    // 5. Establecemos la cookie 'session' (estándar del sistema)
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_EXPIRATION_SECONDS,
      path: "/",
    });

    // Limpiamos la cookie temporal del challenge
    cookieStore.delete("currentChallenge");

    await logAction({
      action: "BIOMETRIC_LOGIN_SUCCESS",
      module: "Autenticación",
      details: `Inicio de sesión biométrico exitoso para: ${user.name || user.email} con rol ${userRole}.`,
      userId: user.id,
      userName: user.name || "Usuario",
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error en la verificación biométrica:", error);
    return NextResponse.json(
      { success: false, error: "Error interno durante la verificación." },
      { status: 500 },
    );
  }
}
