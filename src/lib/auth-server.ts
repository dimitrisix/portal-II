// Ubicación: src/lib/auth-server.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { jwtVerify, type JWTPayload } from "jose";
import prisma from "@/lib/prisma";

export interface SessionPayload extends JWTPayload {
  userId?: number | string;
  name?: string;
  cedula?: string;
  email?: string;
  roleName?: string;
  permissions?: string[];
  tokenVersion?: number;
}

export interface AuthenticatedUser {
  id: number;
  name: string;
  cedula: string;
  email: string;
  roleName: string;
  isAdmin: boolean;
  permissions: string[];
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 16) {
    throw new Error(
      "SEGURIDAD CRÍTICA: JWT_SECRET no está configurado o no es lo suficientemente seguro.",
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Extrae y valida criptográficamente el token JWT de la cookie 'session'.
 */
export async function getVerifiedSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    const secretKey = getJwtSecret();
    const { payload } = await jwtVerify<SessionPayload>(token, secretKey);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Validador para Server Actions (Mutaciones).
 * Valida la sesión activa, verifica en BD el usuario y sus permisos.
 */
export async function verifyServerActionAuth(
  requiredPermission?: string,
): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; error: string }> {
  const payload = await getVerifiedSession();

  if (!payload || !payload.userId) {
    return {
      ok: false,
      error: "Acceso no autorizado: Debe iniciar sesión para realizar esta operación.",
    };
  }

  const userId = Number(payload.userId);
  if (isNaN(userId)) {
    return { ok: false, error: "Identificador de sesión inválido." };
  }

  // Comprobación de seguridad en Base de Datos (Token Versioning y Existencia)
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: { permissions: true },
      },
    },
  });

  if (!dbUser) {
    return {
      ok: false,
      error: "Usuario no encontrado o dado de baja.",
    };
  }

  // Si el usuario tuvo su sesión invalidada (cambio de contraseña o reseteo de roles)
  if (
    typeof payload.tokenVersion === "number" &&
    dbUser.tokenVersion !== payload.tokenVersion
  ) {
    return {
      ok: false,
      error: "Su sesión ha expirado por cambios de seguridad. Inicie sesión de nuevo.",
    };
  }

  const roleName = (dbUser.role?.name || "EMPLEADO").toUpperCase().trim();
  const isAdmin = roleName === "ADMINISTRADOR" || roleName === "ADMIN";
  const permissions = dbUser.role?.permissions.map((p) => p.name) || [];

  if (requiredPermission && !isAdmin && !permissions.includes(requiredPermission)) {
    return {
      ok: false,
      error: `Acceso denegado: Se requiere el permiso "${requiredPermission}".`,
    };
  }

  return {
    ok: true,
    user: {
      id: dbUser.id,
      name: dbUser.name || "Usuario",
      cedula: dbUser.cedula || "",
      email: dbUser.email || "",
      roleName,
      isAdmin,
      permissions,
    },
  };
}

/**
 * Validador de seguridad para rutas de API (Route Handlers en /api/...).
 * Devuelve un NextResponse adecuado (401 o 403) si falla.
 */
export async function verifyApiAuth(
  request?: Request,
  options?: { requireAdmin?: boolean; permission?: string },
): Promise<
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: NextResponse }
> {
  let sessionToken: string | undefined;

  // 1. Extraer cookie desde el request o desde cookies()
  if (request) {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
    if (match) {
      sessionToken = decodeURIComponent(match[1]);
    }
  }

  if (!sessionToken) {
    const cookieStore = await cookies();
    sessionToken = cookieStore.get("session")?.value;
  }

  if (!sessionToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No autorizado: Sesión no iniciada" },
        { status: 401 },
      ),
    };
  }

  let payload: SessionPayload;
  try {
    const secretKey = getJwtSecret();
    const result = await jwtVerify<SessionPayload>(sessionToken, secretKey);
    payload = result.payload;
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Sesión inválida o expirada" },
        { status: 401 },
      ),
    };
  }

  const userId = Number(payload.userId);
  if (isNaN(userId)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Credenciales corruptas" },
        { status: 401 },
      ),
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: { permissions: true },
      },
    },
  });

  if (!dbUser) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Usuario inactivo o inexistente" },
        { status: 401 },
      ),
    };
  }

  if (
    typeof payload.tokenVersion === "number" &&
    dbUser.tokenVersion !== payload.tokenVersion
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Sesión revocada por cambio de credenciales" },
        { status: 401 },
      ),
    };
  }

  const roleName = (dbUser.role?.name || "EMPLEADO").toUpperCase().trim();
  const isAdmin = roleName === "ADMINISTRADOR" || roleName === "ADMIN";
  const permissions = dbUser.role?.permissions.map((p) => p.name) || [];

  if (options?.requireAdmin && !isAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acceso denegado: Requiere privilegios de administrador" },
        { status: 403 },
      ),
    };
  }

  if (
    options?.permission &&
    !isAdmin &&
    !permissions.includes(options.permission)
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Acceso denegado: Requiere el permiso "${options.permission}"` },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    user: {
      id: dbUser.id,
      name: dbUser.name || "Usuario",
      cedula: dbUser.cedula || "",
      email: dbUser.email || "",
      roleName,
      isAdmin,
      permissions,
    },
  };
}

/**
 * Validador para Server Components (Páginas protegidas del Dashboard).
 * Si la sesión es inválida, expiró o fue revocada en BD, redirige de inmediato a /login.
 * Si el usuario no cuenta con el permiso requerido y no es administrador, redirige a /dashboard.
 */
export async function verifyPageAuth(
  requiredPermission?: string,
): Promise<AuthenticatedUser> {
  const payload = await getVerifiedSession();

  if (!payload || !payload.userId) {
    redirect("/login");
  }

  const userId = Number(payload.userId);
  if (isNaN(userId)) {
    redirect("/api/auth/logout");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: { permissions: true },
      },
    },
  });

  if (!dbUser) {
    redirect("/api/auth/logout");
  }

  // Token versioning: si cambiaron credenciales o roles, expulsar sesión de inmediato
  if (
    typeof payload.tokenVersion === "number" &&
    dbUser.tokenVersion !== payload.tokenVersion
  ) {
    redirect("/api/auth/logout");
  }

  const roleName = (dbUser.role?.name || "EMPLEADO").toUpperCase().trim();
  const isAdmin = roleName === "ADMINISTRADOR" || roleName === "ADMIN";
  const permissions = dbUser.role?.permissions.map((p) => p.name) || [];

  if (requiredPermission && !isAdmin && !permissions.includes(requiredPermission)) {
    redirect("/dashboard");
  }

  return {
    id: dbUser.id,
    name: dbUser.name || "Usuario",
    cedula: dbUser.cedula || "",
    email: dbUser.email || "",
    roleName,
    isAdmin,
    permissions,
  };
}

