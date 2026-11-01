// Ubicación: next.config.ts
import type { NextConfig } from "next";

const securityHeaders = [
  // 1. Anti-Clickjacking: Permite embeber visores de documentos internos en iframe (SAMEORIGIN) bloqueando sitios externos
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // 2. Anti-MIME Sniffing: Obliga al navegador a respetar estrictamente los tipos MIME declarados
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // 3. Control de Referrer: Evita filtrar parámetros y rutas internas sensibles hacia dominios externos
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // 4. Privacidad y Hardware: Bloquea el acceso no autorizado a periféricos que el sistema no utiliza
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // 5. HSTS: Fuerza el uso exclusivo de conexiones seguras HTTPS durante 2 años
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // 6. Restricción de políticas de dominios cruzados
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
  // 7. Control de prefetch DNS seguro
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // 8. Desactivación de auditor XSS obsoleto según mejores prácticas OWASP (CSP toma el control)
  {
    key: "X-XSS-Protection",
    value: "0",
  },
  // 9. Aislamiento de contexto de navegación compatible con popups y redirecciones
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  // 10. Bloqueo de lectura cruzada de recursos no autorizados (CORP same-site para compatibilidad con subdominios institucionales)
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  // 11. Content Security Policy (CSP): Delimita las fuentes legítimas de recursos permitiendo visores PDF y subdominios institucionales
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self' https://*.fundaproal.gob.ve;
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.fundaproal.gob.ve https://www.youtube.com https://s.ytimg.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' data: https://fonts.gstatic.com;
      img-src 'self' data: blob: https://*.fundaproal.gob.ve https://*.tile.openstreetmap.org https://img.youtube.com https://i.ytimg.com https://upload.wikimedia.org;
      frame-src 'self' blob: data: https://www.youtube.com https://www.youtube-nocookie.com https://www.instagram.com;
      connect-src 'self' blob: data: https://*.fundaproal.gob.ve https://www.youtube.com;
      frame-ancestors 'self' https://*.fundaproal.gob.ve;
      form-action 'self' https://*.fundaproal.gob.ve;
      base-uri 'self';
      object-src 'self' blob: data:;
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];

// Cabeceras estrictas para evitar que el navegador guarde pantallas del dashboard en memoria (bfcache)
const noCacheHeaders = [
  {
    key: "Cache-Control",
    value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  },
  {
    key: "Pragma",
    value: "no-cache",
  },
  {
    key: "Expires",
    value: "0",
  },
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  },
];

// Cabeceras de aislamiento para la carpeta de uploads (permite visualización de PDFs e imágenes sin ejecución de scripts)
const uploadSecurityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self' blob: data:; style-src 'unsafe-inline'; img-src 'self' data: blob:; object-src 'self' blob: data:; frame-ancestors 'self';",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Accept-Ranges",
    value: "bytes",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  },
];

// Cabeceras de protección para endpoints de API
const apiSecurityHeaders = [
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  },
  {
    key: "Cache-Control",
    value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  },
];

const nextConfig: NextConfig = {
  // Deshabilitar cabecera informativa de Next.js para mitigar fingerprinting de servidor
  poweredByHeader: false,

  // Ocultar source maps en producción para impedir ingeniería inversa y clonación de código
  productionBrowserSourceMaps: false,

  // Genera el empaquetado optimizado e independiente para producción en Linux (crea .next/standalone/server.js)
  output: "standalone",

  // IPs y orígenes permitidos en desarrollo
  allowedDevOrigins: [
    "192.168.0.11",
    "localhost:3000",
    "10.65.101.57",
    "10.48.1.230",
    "10.48.8.246",
    "10.48.8.13",
    "10.216.72.57",
    "10.101.48.57",
  ],

  // Límite de tamaño para operaciones de carga masiva (permite archivos de hasta 1GB sin truncamiento en el proxy/middleware)
  experimental: {
    proxyClientMaxBodySize: "1gb",
    serverActions: {
      bodySizeLimit: "600mb",
    },
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/dashboard/:path*",
        headers: noCacheHeaders,
      },
      {
        source: "/admin/:path*",
        headers: noCacheHeaders,
      },
      {
        source: "/api/:path*",
        headers: apiSecurityHeaders,
      },
      {
        source: "/uploads/:path*",
        headers: uploadSecurityHeaders,
      },
    ];
  },
};

export default nextConfig;
