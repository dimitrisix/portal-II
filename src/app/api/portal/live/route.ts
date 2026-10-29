import { NextRequest } from "next/server";
import {
  portalSyncEmitter,
  getPortalVersions,
  PortalModule,
} from "@/lib/portal-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let isClosed = false;

  let heartbeatTimer: NodeJS.Timeout | null = null;
  let onChange: ((data: {
    modulo: PortalModule;
    timestamp: number;
    versions: Record<PortalModule, number>;
  }) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Enviar estado de inicialización con las versiones actuales
      try {
        const initialPayload = JSON.stringify({
          type: "init",
          timestamp: Date.now(),
          versions: getPortalVersions(),
        });
        controller.enqueue(encoder.encode(`data: ${initialPayload}\n\n`));
      } catch {
        // En caso de que se cancele la conexión de inmediato
      }

      // 2. Escuchador de cambios en vivo
      onChange = (data: {
        modulo: PortalModule;
        timestamp: number;
        versions: Record<PortalModule, number>;
      }) => {
        if (isClosed) return;
        try {
          const payload = JSON.stringify({
            type: "update",
            modulo: data.modulo,
            timestamp: data.timestamp,
            versions: data.versions,
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // Ignorar si el stream ya cerró
        }
      };

      portalSyncEmitter.on("change", onChange);

      // 3. Keep-alive para evitar desconexiones por inactividad en proxies / navegadores
      heartbeatTimer = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, 20000);

      // 4. Limpieza al cerrarse la conexión
      request.signal.addEventListener("abort", () => {
        isClosed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (onChange) portalSyncEmitter.off("change", onChange);
        try {
          controller.close();
        } catch {
          // No-op
        }
      });
    },
    cancel() {
      isClosed = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (onChange) portalSyncEmitter.off("change", onChange);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
