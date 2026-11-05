"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { useConfig } from "@/context/ConfigContext";

const emptySubscribe = () => () => { };

export function Footer() {
  const { footerConfig, recargarFooterConfig } = useConfig();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [isFailed, setIsFailed] = useState(false);

  useEffect(() => {
    recargarFooterConfig();
  }, [recargarFooterConfig]);

  if (!mounted || footerConfig?.visible === false) {
    return null;
  }

  const rawUrl = footerConfig?.imagenUrl?.trim() || "";
  const isSample =
    !rawUrl ||
    rawUrl === "/images/cintillo-footer.png" ||
    rawUrl === "/cintillo.png" ||
    rawUrl === "/cintillo-fp.jpg" ||
    rawUrl === "/pie-pagina.png";

  const hasValidImage = Boolean(rawUrl && !isSample && !isFailed);

  return (
    <footer className="w-full select-none relative z-10 shrink-0 mt-8 p-0 m-0 border-t border-slate-200/90 bg-white overflow-hidden">
      {/* Contenedor exterior centrado con padding vertical adaptable */}
      <div className="w-full flex items-center justify-center py-4 px-4 sm:px-6">
        <div className="w-full max-w-[1400px] flex items-center justify-center">
          {hasValidImage ? (
            <img
              key={rawUrl}
              src={rawUrl}
              alt={
                footerConfig?.altTexto ||
                "Cintillo Institucional FUNDAPROAL - MINPPAL"
              }
              /* En móvil preserva proporción (object-contain); en pantallas grandes llena el ancho (md:object-fill) */
              className="w-full h-12 sm:h-14 md:h-20 object-contain md:object-fill block transition-opacity duration-300"
              loading="lazy"
              onError={() => setIsFailed(true)}
            />
          ) : (
            <div className="w-full py-2 flex flex-col items-center justify-center text-center space-y-1">
              <p className="text-xs sm:text-sm text-slate-700 font-semibold tracking-wide">
                {footerConfig?.textoCopyright ||
                  "Fundación Propatria 2000 / FUNDAPROAL. Todos los derechos reservados."}
              </p>
              {footerConfig?.direccion && (
                <p className="text-[11px] sm:text-xs text-slate-500">
                  {footerConfig.direccion}
                  {footerConfig?.rif ? ` • RIF: ${footerConfig.rif}` : ""}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
