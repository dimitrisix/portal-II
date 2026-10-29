// Ubicación: src/app/dashboard/layout.tsx
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, type JWTPayload } from "jose";
import prisma from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Configuración de título e icono de la pestaña para el Dashboard
export const metadata: Metadata = {
  title: {
    default: "Dashboard | PORTAL",
    template: "%s | PORTAL",
  },
  description: "Sistema de Control de Asistencia de Fundaproal",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

interface SessionPayload extends JWTPayload {
  userId?: string | number;
  cedula?: string;
  name?: string;
  roleName?: string;
  permissions?: string[];
  tokenVersion?: number;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Detectar si la petición es para una ruta pública de autenticación
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  const isAuthRoute =
    pathname === "/dashboard/login" ||
    pathname.startsWith("/dashboard/login/") ||
    pathname === "/login";

  // Si es ruta de autenticación, renderizar la vista sin exigir sesión
  if (isAuthRoute) {
    return (
      <DashboardClient userName="" roleName="" permissions={[]}>
        {children}
      </DashboardClient>
    );
  }

  // 2. Para el resto de rutas de dashboard, exigir sesión válida
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    redirect("/login");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET no está configurado en las variables de entorno.");
    redirect("/login");
  }

  let payload: SessionPayload;

  try {
    const secretKey = new TextEncoder().encode(jwtSecret);
    const verificationResult = await jwtVerify<SessionPayload>(
      sessionToken,
      secretKey,
    );
    payload = verificationResult.payload;
  } catch (error) {
    console.error("Error verificando sesión JWT:", error);
    redirect("/api/auth/logout");
  }

  if (!payload.userId) {
    redirect("/api/auth/logout");
  }

  const numericUserId = Number(payload.userId);
  if (isNaN(numericUserId)) {
    redirect("/api/auth/logout");
  }

  let userName = (payload.name as string) || "Usuario";
  let roleName = (payload.roleName as string) || "EMPLEADO";
  let userPermissions: string[] = Array.isArray(payload.permissions)
    ? (payload.permissions as string[])
    : [];

  const user = await prisma.user.findUnique({
    where: { id: numericUserId },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/api/auth/logout");
  }

  // Si existe campo isActive en el usuario, validar que esté activo
  const userRecord = user as unknown as Record<string, unknown>;
  if (typeof userRecord.isActive === "boolean" && !userRecord.isActive) {
    redirect("/api/auth/logout");
  }

  // Validación de invalidación de sesión si cambió la versión del token
  if (
    typeof payload.tokenVersion === "number" &&
    user.tokenVersion !== payload.tokenVersion
  ) {
    redirect("/api/auth/logout");
  }

  // Sincronizar datos frescos desde la base de datos
  if (user.name) {
    userName = user.name;
  }

  if (user.role?.name) {
    roleName = user.role.name;
  }

  if (user.role?.permissions) {
    userPermissions = user.role.permissions.map((p) => p.name);
  }

  return (
    <DashboardClient
      userName={userName}
      roleName={roleName}
      permissions={userPermissions}
    >
      {children}
    </DashboardClient>
  );
}
