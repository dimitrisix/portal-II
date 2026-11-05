"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { useConfig } from "@/context/ConfigContext";

const emptySubscribe = () => () => {};

export function Footer() {
  const { footerConfig, recargarFooterConfig } = useConfig();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [currentSrc, setCurrentSrc] = useState<string>(
    footerConfig?.imagenUrl || "/images/cintillo-footer.png",
  );
  const [isFailed, setIsFailed] = useState(false);

  useEffect(() => {
    recargarFooterConfig();
  }, [recargarFooterConfig]);

  useEffect(() => {
    setCurrentSrc(footerConfig?.imagenUrl || "/images/cintillo-footer.png");
    setIsFailed(false);
  }, [footerConfig?.imagenUrl]);

  if (!mounted || footerConfig?.visible === false) {
    return null;
  }

  const handleError = () => {
    if (currentSrc !== "/images/cintillo-footer.png") {
      setCurrentSrc("/images/cintillo-footer.png");
    } else {
      setIsFailed(true);
    }
  };

  return (
    <footer className="w-full select-none relative z-10 shrink-0 mt-8 p-0 m-0 border-t border-slate-200/90 bg-white overflow-hidden">
      {/* Contenedor exterior centrado con padding vertical adaptable */}
      <div className="w-full flex items-center justify-center py-2 sm:py-3 px-2 sm:px-4">
        {/* Ancho máximo de 1400px sin desbordamiento horizontal */}
        <div className="w-full max-w-[1400px] min-h-[56px] sm:min-h-[64px] md:h-20 flex items-center justify-center">
          {!isFailed ? (
            <img
              key={currentSrc}
              src={currentSrc}
              alt={
                footerConfig?.altTexto ||
                "Cintillo Institucional FUNDAPROAL - MINPPAL"
              }
              /* En móvil preserva proporción (object-contain); en pantallas grandes llena el ancho (md:object-fill) */
              className="w-full h-12 sm:h-14 md:h-full object-contain md:object-fill block transition-opacity duration-300"
              loading="lazy"
              onError={handleError}
            />
          ) : (
            <div className="w-full py-3 flex items-center justify-center text-center">
              <p className="text-xs sm:text-sm text-slate-400 font-medium italic">
                No hay pie de página definido
              </p>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
