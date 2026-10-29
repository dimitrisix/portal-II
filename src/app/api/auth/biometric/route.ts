// src/app/api/auth/biometric/route.ts
import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { consumeRateLimit, sanitizeIpAddress } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    // 1. Control de Fuerza Bruta y Rate Limiting por IP
    const forwarded = request.headers.get("x-forwarded-for");
    const rawIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const clientIp = sanitizeIpAddress(rawIp);

    const rateStatus = consumeRateLimit(`bio_chal_${clientIp}`, 10, 60 * 1000);
    if (!rateStatus.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes biométricas. Espere un momento." },
        { status: 429 },
      );
    }

    const url = new URL(request.url);
    const rpID = url.hostname || "localhost";

    // 2. Generamos las opciones de autenticación mediante simplewebauthn
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
    });

    // 3. Guardamos temporalmente el "challenge" en una cookie segura (dura 60 segundos)
    const cookieStore = await cookies();
    cookieStore.set("currentChallenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60,
      path: "/",
    });

    // 4. Devolvemos las opciones en formato JSON al navegador
    return NextResponse.json(options);
  } catch (error: unknown) {
    console.error("Error al generar el reto biométrico:", error);
    return NextResponse.json(
      { error: "Error interno al iniciar reto biométrico" },
      { status: 500 },
    );
  }
}
