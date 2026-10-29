// Ubicación: src/app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { logAction } from "@/app/dashboard/auditoria/logger";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (sessionToken && process.env.JWT_SECRET) {
      try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(sessionToken, secretKey);
        await logAction({
          action: "LOGOUT",
          module: "Autenticación",
          details: `Cierre de sesión por solicitud o inactividad: ${payload.name || payload.userId}`,
          userId: Number(payload.userId) || null,
          userName: (payload.name as string) || "Usuario",
        }).catch(() => {});
      } catch {
        // Token inválido o expirado
      }
    }

    cookieStore.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    cookieStore.delete("session");

    // Preservar el dominio o IP con el que el usuario inició sesión
    const rawHost =
      request.headers.get("x-forwarded-host") || request.headers.get("host");
    const host = rawHost ? rawHost.split(",")[0].trim() : null;
    const rawProto =
      request.headers.get("x-forwarded-proto") ||
      (request.nextUrl.protocol ? request.nextUrl.protocol.replace(":", "") : "http");
    const proto = rawProto.split(",")[0].trim();

    const motivo = request.nextUrl.searchParams.get("motivo");
    const search = motivo ? `?motivo=${encodeURIComponent(motivo)}` : "";

    const redirectUrl = host
      ? new URL(`/login${search}`, `${proto}://${host}`)
      : (() => {
          const url = request.nextUrl.clone();
          url.pathname = "/login";
          url.search = search;
          return url;
        })();

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.delete("session");
    return response;
  } catch (error) {
    console.error("[LOGOUT GET ERROR]:", error);
    const rawHost =
      request.headers.get("x-forwarded-host") || request.headers.get("host");
    const host = rawHost ? rawHost.split(",")[0].trim() : null;
    const rawProto =
      request.headers.get("x-forwarded-proto") ||
      (request.nextUrl.protocol ? request.nextUrl.protocol.replace(":", "") : "http");
    const proto = rawProto.split(",")[0].trim();

    const fallbackUrl = host
      ? new URL("/login", `${proto}://${host}`)
      : (() => {
          const fallback = request.nextUrl.clone();
          fallback.pathname = "/login";
          fallback.search = "";
          return fallback;
        })();

    const fallbackResponse = NextResponse.redirect(fallbackUrl);
    fallbackResponse.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    fallbackResponse.cookies.delete("session");
    return fallbackResponse;
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (sessionToken && process.env.JWT_SECRET) {
      try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(sessionToken, secretKey);
        await logAction({
          action: "LOGOUT",
          module: "Autenticación",
          details: `Cierre de sesión explícito vía POST: ${payload.name || payload.userId}`,
          userId: Number(payload.userId) || null,
          userName: (payload.name as string) || "Usuario",
        }).catch(() => {});
      } catch {
        // Ignorar
      }
    }

    cookieStore.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    cookieStore.delete("session");

    return NextResponse.json(
      { success: true, message: "Sesión finalizada correctamente" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[LOGOUT POST ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al cerrar sesión" },
      { status: 500 },
    );
  }
}
