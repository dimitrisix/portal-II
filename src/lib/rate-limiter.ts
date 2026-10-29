// Ubicación: src/lib/rate-limiter.ts

interface RateRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateRecord>();
const MAX_STORE_KEYS = 10000; // Mitigación contra ataques de agotamiento de memoria (Memory Exhaustion DoS)

// Limpieza periódica de registros vencidos cada 3 minutos
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 3 * 60 * 1000);
}

/**
 * Sanitiza y valida formato de dirección IP para evitar inyección en claves de almacenamiento.
 */
export function sanitizeIpAddress(ip: string | null | undefined): string {
  if (!ip) return "127.0.0.1";
  const clean = ip.trim();
  // Validar formato IPv4 o IPv6 básico
  if (
    /^(\d{1,3}\.){3}\d{1,3}$/.test(clean) ||
    /^[a-fA-F0-9:]+$/.test(clean)
  ) {
    return clean;
  }
  return "127.0.0.1";
}

/**
 * Verifica si una clave (IP, usuario, etc.) ha superado el límite de intentos.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
): { limited: boolean; remainingMs: number; currentAttempts: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    return {
      limited: false,
      remainingMs: 0,
      currentAttempts: 0,
    };
  }

  if (record.count >= maxAttempts) {
    return {
      limited: true,
      remainingMs: Math.max(0, record.resetTime - now),
      currentAttempts: record.count,
    };
  }

  return {
    limited: false,
    remainingMs: Math.max(0, record.resetTime - now),
    currentAttempts: record.count,
  };
}

/**
 * Incrementa el contador de intentos fallidos.
 */
export function recordRateLimitHit(
  key: string,
  windowMs: number = 5 * 60 * 1000,
): number {
  const now = Date.now();

  // Si el almacén supera el límite de seguridad, purga llaves antiguas
  if (rateLimitStore.size >= MAX_STORE_KEYS) {
    for (const [k, r] of rateLimitStore.entries()) {
      if (now > r.resetTime) rateLimitStore.delete(k);
    }
    // Si aún está lleno, eliminar las primeras 1000 llaves más antiguas
    if (rateLimitStore.size >= MAX_STORE_KEYS) {
      let count = 0;
      for (const k of rateLimitStore.keys()) {
        rateLimitStore.delete(k);
        count++;
        if (count >= 1000) break;
      }
    }
  }

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return 1;
  }

  record.count += 1;
  return record.count;
}

/**
 * Consume una cuota de peticiones inmediatamente (Token bucket / fixed window).
 * Utilizado para proteger endpoints contra ataques de inundación / DoS.
 */
export function consumeRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetMs: windowMs,
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, record.resetTime - now),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetMs: Math.max(0, record.resetTime - now),
  };
}

/**
 * Restablece el contador al tener un intento exitoso.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
