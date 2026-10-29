// Ubicación: src/app/dashboard/auditoria/logger.ts
import prisma from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import { jwtVerify } from "jose";

type AuditParams = {
  action: string;
  module: string;
  details?: string;
  userId?: number | null;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
};

export async function logAction({
  action,
  module,
  details,
  userId: explicitUserId,
  userName: explicitUserName,
  ipAddress: explicitIp,
  userAgent: explicitUa,
}: AuditParams) {
  try {
    let resolvedUserId: number | null = explicitUserId ?? null;
    let resolvedUserName: string = explicitUserName ?? "Sistema / Anónimo";

    // Si no se proporcionaron explícitamente, intentamos extraer de la sesión
    if (!resolvedUserId) {
      try {
        const cookieStore = await cookies();
        const session = cookieStore.get("session")?.value;

        if (session && process.env.JWT_SECRET) {
          const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
          const { payload } = await jwtVerify(session, secretKey);
          resolvedUserId = (payload.userId as number) || null;
          resolvedUserName = (payload.name as string) || "Usuario";
        }
      } catch {
        // Sesión no disponible o inválida
      }
    }

    let ipAddress = explicitIp;
    let userAgent = explicitUa;

    if (!ipAddress || !userAgent) {
      try {
        const headersList = await headers();
        if (!ipAddress) {
          const forwardedFor = headersList.get("x-forwarded-for");
          ipAddress = forwardedFor
            ? forwardedFor.split(",")[0].trim()
            : headersList.get("x-real-ip") || "IP Desconocida";
        }
        if (!userAgent) {
          userAgent = headersList.get("user-agent") || "Navegador Desconocido";
        }
      } catch {
        ipAddress = ipAddress || "127.0.0.1";
        userAgent = userAgent || "Desconocido";
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: resolvedUserId,
        userName: resolvedUserName,
        action,
        module,
        details,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Error al registrar traza de auditoría:", error);
  }
}
