// Ubicación: src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { consumeRateLimit, sanitizeIpAddress } from "@/lib/rate-limiter";

// 1. Patrones de sondas y ataques de explotación conocidos (WAF Layer)
const SUSPICIOUS_PATHS_REGEX =
  /(?:\/\.env|\/\.git|\/\.svn|\/\.htaccess|\/\.htpasswd|\/wp-admin|\/wp-login|\/xmlrpc|\/phpmyadmin|\/cgi-bin|\/eval-stdin|\/pma|\/setup\.php|\/shell\.php|\.bak$|\.sql$|\.config$)/i;

// 2. Firmas de escáneres y herramientas de ataque automatizadas
const SUSPICIOUS_USER_AGENTS_REGEX =
  /(?:sqlmap|nikto|wpscan|masscan|acunetix|havij|zgrab|nmap|netsparker|dirbuster|gobuster)/i;

// 3. Catálogo de permisos por ruta protegida dentro del Dashboard (RBAC)
const DASHBOARD_PERMISSION_MAP: Record<string, string> = {
  "/dashboard/users": "users.manage",
  "/dashboard/roles": "roles.manage",
  "/dashboard/permisos": "permisos.manage",
  "/dashboard/auditoria": "auditoria.view",
  "/dashboard/identidad": "logo.manage",
  "/dashboard/hero": "hero.manage",
  "/dashboard/programas": "programas.manage",
  "/dashboard/prensa": "prensa.manage",
  "/dashboard/contactos": "contactos.manage",
  "/dashboard/mapa": "mapa.manage",
  "/dashboard/banner-lateral": "banner_lateral.manage",
  "/dashboard/footer": "pie_pagina.manage",
  "/dashboard/revista": "revista.manage",
};

// 4. Métodos HTTP legítimos permitidos
const ALLOWED_HTTP_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalizedPath = pathname.toLowerCase();

  // Exclusión temprana para assets estáticos públicos y recursos de transferencia masiva
  if (
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/api/revista/pdf") ||
    pathname.startsWith("/api/configuracion/revista") ||
    pathname === "/favicon.png" ||
    pathname === "/favicon.ico" ||
    pathname === "/logo.png"
  ) {
    return NextResponse.next();
  }

  // ==========================================
  // ESCUDO 1: FILTRADO DE MÉTODOS HTTP DANGEROUS / UNEXPECTED
  // ==========================================
  if (!ALLOWED_HTTP_METHODS.has(request.method)) {
    return new NextResponse("Método HTTP no permitido.", { status: 405 });
  }

  // ==========================================
  // ESCUDO 2: DETECCIÓN Y BLOQUEO DE ESCÁNERES Y SONDAS (WAF)
  // ==========================================
  // Bloquear path traversal
  if (pathname.includes("..") || pathname.includes("%2e%2e") || pathname.includes("%2E%2E")) {
    return new NextResponse("Acceso bloqueado: Solicitud inválida.", {
      status: 403,
    });
  }

  // Bloquear rutas de sondas típicas (.env, wp-login, etc.)
  if (SUSPICIOUS_PATHS_REGEX.test(normalizedPath)) {
    return new NextResponse("Acceso restringido por políticas de seguridad.", {
      status: 403,
    });
  }

  // Bloquear User-Agents de escaneo malicioso
  const userAgent = request.headers.get("user-agent") || "";
  if (SUSPICIOUS_USER_AGENTS_REGEX.test(userAgent)) {
    return new NextResponse("Acceso bloqueado: Agente no autorizado.", {
      status: 403,
    });
  }

  // ==========================================
  // ESCUDO 3: CONTROL DE TASA (RATE LIMITING) A NIVEL DE GATEWAY
  // ==========================================
  const rawIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
  const clientIp = sanitizeIpAddress(rawIp);

  // A. Rate limit estricto para autenticación y login (30 req / minuto por IP)
  const isAuthAttempt =
    normalizedPath === "/login" ||
    normalizedPath === "/dashboard/login" ||
    normalizedPath.startsWith("/api/auth/");

  if (isAuthAttempt) {
    const rateStatus = consumeRateLimit(`gw_auth_${clientIp}`, 30, 60 * 1000);
    if (!rateStatus.allowed) {
      return NextResponse.json(
        {
          error:
            "Demasiadas solicitudes de autenticación. Acceso bloqueado temporalmente por seguridad.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "Content-Type": "application/json",
          },
        },
      );
    }
  }

  // B. Rate limit general para endpoints de la API (120 req / minuto por IP, excepto visor de PDF de revista para streaming continuo)
  if (normalizedPath.startsWith("/api/") && !normalizedPath.startsWith("/api/revista/pdf")) {
    const rateStatus = consumeRateLimit(`gw_api_${clientIp}`, 120, 60 * 1000);
    if (!rateStatus.allowed) {
      return NextResponse.json(
        {
          error:
            "Límite de solicitudes de API excedido. Por favor, espere un momento.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "Content-Type": "application/json",
          },
        },
      );
    }
  }

  // Inyectar la ruta actual en encabezados internos para Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Redirección segura anti-Host Header Injection y anti-Open Redirect
  const createRedirectUrl = (path: string) => {
    const rawHost =
      request.headers.get("x-forwarded-host") || request.headers.get("host");
    const host = rawHost ? rawHost.split(",")[0].trim() : null;
    const rawProto =
      request.headers.get("x-forwarded-proto") ||
      (request.nextUrl.protocol
        ? request.nextUrl.protocol.replace(":", "")
        : "http");
    const proto = rawProto.split(",")[0].trim();

    if (host) {
      return new URL(path, `${proto}://${host}`);
    }

    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    return url;
  };

  const session = request.cookies.get("session")?.value;

  // ==========================================
  // ESCUDO 4: RUTAS PÚBLICAS DE AUTENTICACIÓN
  // ==========================================
  const isAuthRoute =
    pathname === "/dashboard/login" ||
    pathname.startsWith("/dashboard/login/") ||
    pathname === "/login";

  if (isAuthRoute) {
    if (
      request.nextUrl.searchParams.has("motivo") ||
      request.nextUrl.searchParams.has("logout") ||
      request.nextUrl.searchParams.has("reset")
    ) {
      const response = NextResponse.next({
        request: { headers: requestHeaders },
      });
      response.cookies.set("session", "", { path: "/", maxAge: 0 });
      response.cookies.delete("session");
      return response;
    }

    if (session) {
      try {
        if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET no configurado");
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(session, secretKey);
        return NextResponse.redirect(createRedirectUrl("/dashboard"));
      } catch {
        const response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        response.cookies.delete("session");
        return response;
      }
    }
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // ==========================================
  // ESCUDO 5: PROTECCIÓN DE RUTAS DE ADMINISTRACIÓN DIRECTA (/admin/...)
  // ==========================================
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(createRedirectUrl("/login"));
    }

    try {
      if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET no configurado");
      const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(session, secretKey);
      const userRole =
        (payload.roleName as string)?.toUpperCase().trim() || "EMPLEADO";

      if (userRole !== "ADMINISTRADOR" && userRole !== "ADMIN") {
        return NextResponse.redirect(createRedirectUrl("/dashboard"));
      }
    } catch {
      const response = NextResponse.redirect(createRedirectUrl("/login"));
      response.cookies.delete("session");
      return response;
    }
  }

  // ==========================================
  // ESCUDO 6: PROTECCIÓN DE RUTAS DEL DASHBOARD (/dashboard/...)
  // ==========================================
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(createRedirectUrl("/login"));
    }

    try {
      if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET no configurado");
      const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(session, secretKey);
      const userRole =
        (payload.roleName as string)?.toUpperCase().trim() || "EMPLEADO";
      const isAdmin = userRole === "ADMINISTRADOR" || userRole === "ADMIN";
      const userPermissions = Array.isArray(payload.permissions)
        ? (payload.permissions as string[])
        : [];

      // Control Granular de Permisos RBAC
      if (!isAdmin) {
        for (const [routePrefix, requiredPerm] of Object.entries(
          DASHBOARD_PERMISSION_MAP,
        )) {
          if (
            normalizedPath === routePrefix ||
            normalizedPath.startsWith(`${routePrefix}/`)
          ) {
            if (!userPermissions.includes(requiredPerm)) {
              return NextResponse.redirect(createRedirectUrl("/dashboard"));
            }
            break;
          }
        }
      }

      const response = NextResponse.next({
        request: { headers: requestHeaders },
      });

      // Cabeceras estrictas anti-almacenamiento en caché y anti-indexación del Dashboard
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

      return response;
    } catch (proxyError) {
      console.error("[PROXY DASHBOARD CATCH ERROR]:", proxyError);
      const response = NextResponse.redirect(createRedirectUrl("/login"));
      response.cookies.delete("session");
      return response;
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.png|favicon.ico|images/|icons/|logo.png|api/configuracion/revista|api/revista/pdf).*)",
  ],
};
