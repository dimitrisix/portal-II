"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  HeroSlideData,
  ProgramaData,
  PrensaVideoData,
  ContactoItemData,
  BannerLateralData,
  FooterConfigData,
  RevistaConfigData,
} from "@/types";

interface LogoConfig {
  url: string;
}

export interface PortalInitialData {
  logo?: { url: string };
  slides?: HeroSlideData[];
  programas?: ProgramaData[];
  videosPrensa?: PrensaVideoData[];
  contactosItems?: ContactoItemData[];
  bannerLateral?: BannerLateralData;
  footerConfig?: FooterConfigData;
  revista?: RevistaConfigData;
  revistas?: RevistaConfigData[];
}

interface ConfigContextType {
  // 1. Logo
  logo: LogoConfig;
  actualizarLogo: (nuevoLogo: Partial<LogoConfig>) => void;
  recargarLogo: () => Promise<void>;

  // 2. Hero Slides
  slides: HeroSlideData[];
  recargarSlides: () => Promise<void>;
  notificarCambioHero: () => void;

  // 3. Programas
  programas: ProgramaData[];
  recargarProgramas: (forzar?: boolean) => Promise<ProgramaData[] | undefined>;
  actualizarProgramas: (nuevos: ProgramaData[]) => void;
  notificarCambioProgramas: (nuevos?: ProgramaData[]) => void;

  // 4. Prensa / Videos
  videosPrensa: PrensaVideoData[];
  recargarVideosPrensa: () => Promise<void>;
  notificarCambioPrensa: () => void;

  // 5. Contactos
  contactosItems: ContactoItemData[];
  recargarContactosItems: () => Promise<void>;
  notificarCambioContactos: () => void;

  // 6. Ilustración Lateral
  bannerLateral: BannerLateralData;
  recargarBannerLateral: () => Promise<void>;
  notificarCambioBannerLateral: () => void;

  // 7. Pie de Página (Footer)
  footerConfig: FooterConfigData;
  recargarFooterConfig: () => Promise<void>;
  notificarCambioFooter: () => void;

  // 8. Revista Digital
  revista: RevistaConfigData;
  revistas: RevistaConfigData[];
  recargarRevista: () => Promise<void>;
  actualizarRevistas: (nuevas: RevistaConfigData[]) => void;
  notificarCambioRevista: (nuevas?: RevistaConfigData[]) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: PortalInitialData | null;
}) {
  // Estados inicializados inmediatamente con datos del servidor para evitar parpadeos
  const [logo, setLogo] = useState<LogoConfig>(
    initialData?.logo || { url: "" },
  );
  const [slides, setSlides] = useState<HeroSlideData[]>(
    initialData?.slides || [],
  );
  const [programas, setProgramas] = useState<ProgramaData[]>(
    initialData?.programas || [],
  );
  const [videosPrensa, setVideosPrensa] = useState<PrensaVideoData[]>(
    initialData?.videosPrensa || [],
  );
  const [contactosItems, setContactosItems] = useState<ContactoItemData[]>(
    initialData?.contactosItems || [],
  );
  const [bannerLateral, setBannerLateral] = useState<BannerLateralData>(
    initialData?.bannerLateral || {
      imagenUrl: "/images/silueta-madre.png",
      altTexto: "Ilustración Institucional",
      visible: true,
    },
  );
  const [footerConfig, setFooterConfig] = useState<FooterConfigData>(
    initialData?.footerConfig || {
      imagenUrl: "/images/cintillo-footer.png",
      altTexto: "Cintillo Institucional",
      direccion:
        "Av. Andrés Bello, Edificio Las Fundaciones, Caracas - Venezuela",
      rif: "G-20002451-8",
      textoCopyright:
        "Fundación Propatria 2000 / FUNDAPROAL. Todos los derechos reservados.",
      visible: true,
    },
  );
  const [revista, setRevista] = useState<RevistaConfigData>(
    initialData?.revista || {
      id: 1,
      titulo: "Revista Institucional",
      subtitulo: "Edición Digital",
      descripcion: "",
      fecha: "",
      archivoUrl: "",
      nombreArchivo: "",
      tamanoArchivo: "",
      portadaUrl: "",
      orden: 0,
      habilitado: false,
    },
  );
  const [revistas, setRevistas] = useState<RevistaConfigData[]>(
    initialData?.revistas || (initialData?.revista ? [initialData.revista] : []),
  );

  // Semáforos para evitar peticiones redundantes simultáneas
  const cargandoRef = useRef<{ [key: string]: boolean }>({});
  // Referencia persistente de BroadcastChannel para transmisiones en vivo inter-pestañas
  const canalRef = useRef<BroadcastChannel | null>(null);
  // Promesa activa para deduplicar recargas de programas en vuelo
  const promesaProgramasRef = useRef<Promise<ProgramaData[] | undefined> | null>(null);
  // Versiones conocidas del servidor para sincronización inteligente en tiempo real
  const knownVersionsRef = useRef<Record<string, number>>({});

  // 1. Recargar Logo
  const recargarLogo = useCallback(async () => {
    if (cargandoRef.current["logo"]) return;
    cargandoRef.current["logo"] = true;
    try {
      const res = await fetch(`/api/configuracion/logo?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          setLogo({ url: `${data.url.split("?")[0]}?t=${Date.now()}` });
        }
      }
    } catch {
      // Ignorar errores transitorios de red
    } finally {
      cargandoRef.current["logo"] = false;
    }
  }, []);

  // 2. Recargar Slides
  const recargarSlides = useCallback(async () => {
    if (cargandoRef.current["slides"]) return;
    cargandoRef.current["slides"] = true;
    try {
      const res = await fetch(`/api/configuracion/hero?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSlides(data);
      }
    } catch {
      // Ignorar errores transitorios
    } finally {
      cargandoRef.current["slides"] = false;
    }
  }, []);

  // 3. Recargar Programas
  const recargarProgramas = useCallback(
    async (forzar = false): Promise<ProgramaData[] | undefined> => {
      if (!forzar && promesaProgramasRef.current) {
        return promesaProgramasRef.current;
      }

      const ejecutar = async (): Promise<ProgramaData[] | undefined> => {
        try {
          const res = await fetch(
            `/api/configuracion/programas?t=${Date.now()}`,
            {
              cache: "no-store",
            },
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setProgramas(data);
              return data;
            }
          }
        } catch {
          // Ignorar errores transitorios
        } finally {
          promesaProgramasRef.current = null;
        }
        return undefined;
      };

      const promesa = ejecutar();
      promesaProgramasRef.current = promesa;
      return promesa;
    },
    [],
  );

  // 4. Recargar Prensa
  const recargarVideosPrensa = useCallback(async () => {
    if (cargandoRef.current["prensa"]) return;
    cargandoRef.current["prensa"] = true;
    try {
      const res = await fetch(`/api/configuracion/prensa?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setVideosPrensa(data);
      }
    } catch {
      // Ignorar errores transitorios
    } finally {
      cargandoRef.current["prensa"] = false;
    }
  }, []);

  // 5. Recargar Contactos
  const recargarContactosItems = useCallback(async () => {
    if (cargandoRef.current["contactos"]) return;
    cargandoRef.current["contactos"] = true;
    try {
      const res = await fetch(`/api/configuracion/contactos?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setContactosItems(data);
      }
    } catch {
      // Ignorar errores transitorios
    } finally {
      cargandoRef.current["contactos"] = false;
    }
  }, []);

  // 6. Recargar Banner Lateral
  const recargarBannerLateral = useCallback(async () => {
    if (cargandoRef.current["bannerLateral"]) return;
    cargandoRef.current["bannerLateral"] = true;
    try {
      const res = await fetch(
        `/api/configuracion/banner-lateral?t=${Date.now()}`,
        {
          cache: "no-store",
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.imagenUrl) setBannerLateral(data);
      }
    } catch {
      // Ignorar errores transitorios
    } finally {
      cargandoRef.current["bannerLateral"] = false;
    }
  }, []);

  // 7. Recargar Footer
  const recargarFooterConfig = useCallback(async () => {
    if (cargandoRef.current["footer"]) return;
    cargandoRef.current["footer"] = true;
    try {
      const res = await fetch(`/api/configuracion/footer?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.imagenUrl) setFooterConfig(data);
      }
    } catch {
      // Ignorar errores transitorios
    } finally {
      cargandoRef.current["footer"] = false;
    }
  }, []);

  // 8. Recargar Revista
  const recargarRevista = useCallback(async () => {
    if (cargandoRef.current["revista"]) return;
    cargandoRef.current["revista"] = true;
    try {
      const res = await fetch(`/api/configuracion/revista?all=true&t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (Array.isArray(data.revistas)) {
            setRevistas(data.revistas);
          }
          if (typeof data.habilitado === "boolean") {
            setRevista(data);
          } else if (Array.isArray(data.revistas) && data.revistas.length > 0) {
            setRevista(data.revistas[0]);
          }
        }
      }
    } catch {
      // Ignorar errores transitorios
    } finally {
      cargandoRef.current["revista"] = false;
    }
  }, []);

  // Helper para emitir mensajes por BroadcastChannel sin cerrarlo prematuramente
  const emitirBroadcast = useCallback((mensaje: string | object) => {
    if (typeof window === "undefined") return;
    try {
      if (canalRef.current) {
        canalRef.current.postMessage(mensaje);
      } else if ("BroadcastChannel" in window) {
        const c = new BroadcastChannel("canal_portal_general");
        c.postMessage(mensaje);
        setTimeout(() => c.close(), 2000);
      }
    } catch (e) {
      console.warn("Error emitiendo por BroadcastChannel:", e);
    }
  }, []);

  // Notificadores en vivo (BroadcastChannel + LocalStorage + CustomEvents)
  const notificarCambioHero = useCallback(() => {
    recargarSlides();
    emitirBroadcast("hero_actualizado");
    if (typeof window !== "undefined") {
      localStorage.setItem("hero_version", Date.now().toString());
    }
  }, [recargarSlides, emitirBroadcast]);

  // Actualizar programas directamente en memoria
  const actualizarProgramas = useCallback((nuevos: ProgramaData[]) => {
    if (Array.isArray(nuevos)) {
      setProgramas(nuevos);
    }
  }, []);

  // Notificar cambio de programas en vivo a todas las pestañas y vistas
  const notificarCambioProgramas = useCallback(
    (nuevosProgramas?: ProgramaData[]) => {
      // 1. Si vienen datos ya cargados, actualizar estado local de inmediato
      if (nuevosProgramas && Array.isArray(nuevosProgramas)) {
        setProgramas(nuevosProgramas);
      } else {
        void recargarProgramas(true);
      }

      if (typeof window !== "undefined") {
        const payload = {
          tipo: "programas_actualizados",
          data: nuevosProgramas,
          timestamp: Date.now(),
        };

        // 2. BroadcastChannel para otras pestañas/ventanas
        emitirBroadcast(payload);

        // 3. CustomEvent para la misma pestaña y componentes locales
        window.dispatchEvent(
          new CustomEvent("portal_programas_actualizados", {
            detail: nuevosProgramas,
          }),
        );

        // 4. LocalStorage como fallback inter-pestañas
        try {
          localStorage.setItem("programas_version", Date.now().toString());
        } catch {}
      }
    },
    [recargarProgramas, emitirBroadcast],
  );

  const notificarCambioPrensa = useCallback(() => {
    recargarVideosPrensa();
    emitirBroadcast("prensa_actualizada");
    if (typeof window !== "undefined") {
      localStorage.setItem("prensa_version", Date.now().toString());
    }
  }, [recargarVideosPrensa, emitirBroadcast]);

  const notificarCambioContactos = useCallback(() => {
    recargarContactosItems();
    emitirBroadcast("contactos_actualizados");
    if (typeof window !== "undefined") {
      localStorage.setItem("contactos_version", Date.now().toString());
    }
  }, [recargarContactosItems, emitirBroadcast]);

  const notificarCambioBannerLateral = useCallback(() => {
    recargarBannerLateral();
    emitirBroadcast("banner_lateral_actualizado");
    if (typeof window !== "undefined") {
      localStorage.setItem("banner_lateral_version", Date.now().toString());
    }
  }, [recargarBannerLateral, emitirBroadcast]);

  const notificarCambioFooter = useCallback(() => {
    recargarFooterConfig();
    emitirBroadcast("footer_actualizado");
    if (typeof window !== "undefined") {
      localStorage.setItem("footer_version", Date.now().toString());
    }
  }, [recargarFooterConfig, emitirBroadcast]);

  const actualizarRevistas = useCallback((nuevas: RevistaConfigData[]) => {
    if (Array.isArray(nuevas)) {
      setRevistas(nuevas);
      if (nuevas.length > 0) setRevista(nuevas[0]);
    }
  }, []);

  const notificarCambioRevista = useCallback(
    (nuevas?: RevistaConfigData[]) => {
      if (nuevas && Array.isArray(nuevas)) {
        setRevistas(nuevas);
        if (nuevas.length > 0) setRevista(nuevas[0]);
      } else {
        void recargarRevista();
      }
      emitirBroadcast("revista_actualizada");
      if (typeof window !== "undefined") {
        localStorage.setItem("revista_version", Date.now().toString());
        window.dispatchEvent(
          new CustomEvent("portal_update_revista", { detail: nuevas }),
        );
      }
    },
    [recargarRevista, emitirBroadcast],
  );

  const actualizarLogo = useCallback((nuevoLogo: Partial<LogoConfig>) => {
    if (nuevoLogo.url) {
      setLogo({ url: `${nuevoLogo.url.split("?")[0]}?t=${Date.now()}` });
      emitirBroadcast("logo_actualizado");
      if (typeof window !== "undefined") {
        localStorage.setItem("logo_version", Date.now().toString());
      }
    }
  }, [emitirBroadcast]);

  const recargarTodo = useCallback(async () => {
    await Promise.allSettled([
      recargarLogo(),
      recargarSlides(),
      recargarProgramas(),
      recargarVideosPrensa(),
      recargarContactosItems(),
      recargarBannerLateral(),
      recargarFooterConfig(),
      recargarRevista(),
    ]);
  }, [
    recargarLogo,
    recargarSlides,
    recargarProgramas,
    recargarVideosPrensa,
    recargarContactosItems,
    recargarBannerLateral,
    recargarFooterConfig,
    recargarRevista,
  ]);

  // Helper para recargar un módulo específico por su nombre
  const recargarModuloPorNombre = useCallback(
    (modulo: string) => {
      switch (modulo) {
        case "hero":
          void recargarSlides();
          break;
        case "programas":
          void recargarProgramas(true);
          break;
        case "prensa":
          void recargarVideosPrensa();
          break;
        case "contactos":
          void recargarContactosItems();
          break;
        case "banner-lateral":
          void recargarBannerLateral();
          break;
        case "footer":
          void recargarFooterConfig();
          break;
        case "revista":
          void recargarRevista();
          break;
        case "logo":
          void recargarLogo();
          break;
        case "todos":
          void recargarTodo();
          break;
        default:
          void recargarTodo();
      }
    },
    [
      recargarSlides,
      recargarProgramas,
      recargarVideosPrensa,
      recargarContactosItems,
      recargarBannerLateral,
      recargarFooterConfig,
      recargarRevista,
      recargarLogo,
      recargarTodo,
    ],
  );

  // Sincronización inteligente consultando versiones del servidor (compara timestamps)
  const sincronizarVersionesServidor = useCallback(
    async (forzarTodo = false) => {
      try {
        const res = await fetch(`/api/portal/version?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const serverVersions: Record<string, number> = data?.versions || {};

        const prev = knownVersionsRef.current;
        const esPrimeraVez = Object.keys(prev).length === 0;

        if (esPrimeraVez) {
          knownVersionsRef.current = { ...serverVersions };
          if (forzarTodo) {
            void recargarTodo();
          }
          return;
        }

        if (serverVersions.hero && serverVersions.hero !== prev.hero) {
          void recargarSlides();
        }
        if (serverVersions.programas && serverVersions.programas !== prev.programas) {
          void recargarProgramas(true);
        }
        if (serverVersions.prensa && serverVersions.prensa !== prev.prensa) {
          void recargarVideosPrensa();
        }
        if (serverVersions.contactos && serverVersions.contactos !== prev.contactos) {
          void recargarContactosItems();
        }
        if (
          serverVersions["banner-lateral"] &&
          serverVersions["banner-lateral"] !== prev["banner-lateral"]
        ) {
          void recargarBannerLateral();
        }
        if (serverVersions.footer && serverVersions.footer !== prev.footer) {
          void recargarFooterConfig();
        }
        if (serverVersions.revista && serverVersions.revista !== prev.revista) {
          void recargarRevista();
        }
        if (serverVersions.logo && serverVersions.logo !== prev.logo) {
          void recargarLogo();
        }

        knownVersionsRef.current = { ...serverVersions };
      } catch {
        // Silencioso
      }
    },
    [
      recargarSlides,
      recargarProgramas,
      recargarVideosPrensa,
      recargarContactosItems,
      recargarBannerLateral,
      recargarFooterConfig,
      recargarRevista,
      recargarLogo,
      recargarTodo,
    ],
  );

  useEffect(() => {
    // Si la página vino sin datos iniciales SSR, efectúa la carga
    let loadTimer: NodeJS.Timeout | null = null;
    if (!initialData) {
      loadTimer = setTimeout(() => {
        void recargarTodo();
      }, 0);
    }

    // 1. Inicializar conexión SSE (Server-Sent Events) para transmisiones EN VIVO
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let desmontado = false;

    const iniciarSSE = () => {
      if (typeof window === "undefined" || !("EventSource" in window) || desmontado) {
        return;
      }

      try {
        eventSource = new EventSource("/api/portal/live");

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "init") {
              const serverVersions = (data.versions as Record<string, number>) || {};
              const prev = knownVersionsRef.current;
              if (prev && Object.keys(prev).length > 0) {
                if (serverVersions.hero && serverVersions.hero !== prev.hero) void recargarSlides();
                if (serverVersions.programas && serverVersions.programas !== prev.programas) void recargarProgramas(true);
                if (serverVersions.prensa && serverVersions.prensa !== prev.prensa) void recargarVideosPrensa();
                if (serverVersions.contactos && serverVersions.contactos !== prev.contactos) void recargarContactosItems();
                if (serverVersions["banner-lateral"] && serverVersions["banner-lateral"] !== prev["banner-lateral"]) void recargarBannerLateral();
                if (serverVersions.footer && serverVersions.footer !== prev.footer) void recargarFooterConfig();
                if (serverVersions.revista && serverVersions.revista !== prev.revista) void recargarRevista();
                if (serverVersions.logo && serverVersions.logo !== prev.logo) void recargarLogo();
              }
              knownVersionsRef.current = { ...serverVersions };
            } else if (data.type === "update") {
              if (data.versions) {
                knownVersionsRef.current = { ...data.versions };
              }
              recargarModuloPorNombre(data.modulo);
            }
          } catch {
            // Ignorar errores de parseo
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!desmontado && !reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              iniciarSSE();
              void sincronizarVersionesServidor();
            }, 3000);
          }
        };
      } catch {
        // En caso de que el navegador falle al instanciar EventSource
      }
    };

    iniciarSSE();

    // 2. Inicializar canal persistente para comunicación inter-pestañas
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const canal = new BroadcastChannel("canal_portal_general");
      canalRef.current = canal;
      canal.onmessage = (event) => {
        const tipo =
          typeof event.data === "string" ? event.data : event.data?.tipo;
        const payload =
          typeof event.data === "object" ? event.data?.data : null;

        if (tipo === "logo_actualizado") recargarLogo();
        if (tipo === "hero_actualizado") recargarSlides();
        if (tipo === "programas_actualizados") {
          if (Array.isArray(payload)) {
            setProgramas(payload);
          } else {
            void recargarProgramas(true);
          }
        }
        if (tipo === "prensa_actualizada") recargarVideosPrensa();
        if (tipo === "contactos_actualizados") recargarContactosItems();
        if (tipo === "banner_lateral_actualizado") recargarBannerLateral();
        if (tipo === "footer_actualizado") recargarFooterConfig();
        if (tipo === "revista_actualizada") recargarRevista();
      };
    }

    // 3. Escucha eventos de localStorage (inter-pestañas en el mismo navegador)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "logo_version") recargarLogo();
      if (e.key === "hero_version") recargarSlides();
      if (e.key === "programas_version") recargarProgramas(true);
      if (e.key === "prensa_version") recargarVideosPrensa();
      if (e.key === "contactos_version") recargarContactosItems();
      if (e.key === "banner_lateral_version") recargarBannerLateral();
      if (e.key === "footer_version") recargarFooterConfig();
      if (e.key === "revista_version") recargarRevista();
    };
    window.addEventListener("storage", handleStorage);

    // 4. Escucha eventos CustomEvent dentro de la misma ventana
    const handleCustomProgramas = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (Array.isArray(customEvt.detail)) {
        setProgramas(customEvt.detail);
      } else {
        void recargarProgramas(true);
      }
    };
    window.addEventListener(
      "portal_programas_actualizados",
      handleCustomProgramas,
    );

    // 5. Revalidación inteligente cuando la pestaña vuelve a tener foco o visibilidad
    const handleRevisarVisibilidad = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        void sincronizarVersionesServidor();
      }
    };
    window.addEventListener("focus", handleRevisarVisibilidad);
    document.addEventListener("visibilitychange", handleRevisarVisibilidad);

    // 6. Polling inteligente de respaldo cada 10 segundos para verificar si hubo cambios
    const intervalId = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        void sincronizarVersionesServidor();
      }
    }, 10000);

    return () => {
      desmontado = true;
      if (loadTimer) {
        clearTimeout(loadTimer);
        loadTimer = null;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (canalRef.current) {
        canalRef.current.close();
        canalRef.current = null;
      }
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        "portal_programas_actualizados",
        handleCustomProgramas,
      );
      window.removeEventListener("focus", handleRevisarVisibilidad);
      document.removeEventListener(
        "visibilitychange",
        handleRevisarVisibilidad,
      );
      clearInterval(intervalId);
    };
  }, [
    initialData,
    recargarTodo,
    recargarLogo,
    recargarSlides,
    recargarProgramas,
    recargarVideosPrensa,
    recargarContactosItems,
    recargarBannerLateral,
    recargarFooterConfig,
    recargarRevista,
    recargarModuloPorNombre,
    sincronizarVersionesServidor,
  ]);

  return (
    <ConfigContext.Provider
      value={{
        logo,
        actualizarLogo,
        recargarLogo,
        slides,
        recargarSlides,
        notificarCambioHero,
        programas,
        recargarProgramas,
        actualizarProgramas,
        notificarCambioProgramas,
        videosPrensa,
        recargarVideosPrensa,
        notificarCambioPrensa,
        contactosItems,
        recargarContactosItems,
        notificarCambioContactos,
        bannerLateral,
        recargarBannerLateral,
        notificarCambioBannerLateral,
        footerConfig,
        recargarFooterConfig,
        notificarCambioFooter,
        revista,
        revistas,
        recargarRevista,
        actualizarRevistas,
        notificarCambioRevista,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig debe usarse dentro de un ConfigProvider");
  }
  return context;
};
