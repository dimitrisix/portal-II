"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { logAction } from "./auditoria/logger";

export async function logout() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (sessionToken && process.env.JWT_SECRET) {
    try {
      const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(sessionToken, secretKey);
      await logAction({
        action: "LOGOUT",
        module: "Autenticación",
        details: `Cierre de sesión de usuario: ${payload.name || payload.userId}`,
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
  redirect("/login");
}

// Throttle de ping de actividad para no saturar la base de datos (mínimo 60s entre actualizaciones por usuario)
const pingCache = new Map<number, number>();

export async function pingActive() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session || !process.env.JWT_SECRET) return;

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(session, secretKey);

    const userId = Number(payload.userId);
    if (isNaN(userId)) return;

    const now = Date.now();
    const lastPing = pingCache.get(userId) || 0;
    if (now - lastPing < 60 * 1000) {
      // Menos de 60 segundos desde la última actualización, omitir
      return;
    }

    pingCache.set(userId, now);

    await prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() },
    });
  } catch {
    // Si el token es inválido, simplemente ignoramos el ping
  }
}
