import { EventEmitter } from "events";

export type PortalModule =
  | "hero"
  | "programas"
  | "prensa"
  | "contactos"
  | "banner-lateral"
  | "footer"
  | "logo"
  | "revista"
  | "todos";

// Singleton en globalThis para persistir la suscripción de eventos ante HMR en desarrollo
const globalForPortalSync = globalThis as unknown as {
  portalSyncEmitter?: EventEmitter;
  portalModuleVersions?: Record<PortalModule, number>;
};

export const portalSyncEmitter =
  globalForPortalSync.portalSyncEmitter ?? new EventEmitter();
portalSyncEmitter.setMaxListeners(500);

export const portalModuleVersions: Record<PortalModule, number> =
  globalForPortalSync.portalModuleVersions ?? {
    hero: Date.now(),
    programas: Date.now(),
    prensa: Date.now(),
    contactos: Date.now(),
    "banner-lateral": Date.now(),
    footer: Date.now(),
    logo: Date.now(),
    revista: Date.now(),
    todos: Date.now(),
  };

// Siempre persistir en globalThis para que todos los route handlers compartan el mismo emisor en producción y desarrollo
globalForPortalSync.portalSyncEmitter = portalSyncEmitter;
globalForPortalSync.portalModuleVersions = portalModuleVersions;

/**
 * Notifica a todos los clientes conectados en tiempo real que un módulo del portal ha sido actualizado.
 */
export function notifyPortalChange(modulo: PortalModule) {
  const timestamp = Date.now();
  portalModuleVersions[modulo] = timestamp;
  portalModuleVersions.todos = timestamp;

  portalSyncEmitter.emit("change", {
    modulo,
    timestamp,
    versions: { ...portalModuleVersions },
  });
}

/**
 * Devuelve el mapa actual de versiones de cada módulo del portal.
 */
export function getPortalVersions(): Record<PortalModule, number> {
  return { ...portalModuleVersions };
}
