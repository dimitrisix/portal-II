"use client";

import React, { useEffect, useState } from "react";
import { useConfig } from "@/context/ConfigContext";

export function BannerLateral() {
  const { bannerLateral, recargarBannerLateral } = useConfig();

  const [mounted, setMounted] = useState(false);
  const [errorCarga, setErrorCarga] = useState(false);
  const [prevUrl, setPrevUrl] = useState<string | undefined>(undefined);

  // Efecto asíncrono para hidratación
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Efecto para cargar los datos
  useEffect(() => {
    if (mounted) {
      recargarBannerLateral();
    }
  }, [mounted, recargarBannerLateral]);

  // Resetear el error de carga
  if (bannerLateral?.imagenUrl !== prevUrl) {
    setPrevUrl(bannerLateral?.imagenUrl);
    setErrorCarga(false);
  }

  // Si no está listo, o la BD dice oculto, o hubo error de carga, no mostramos nada
  if (!mounted || !bannerLateral?.visible || !bannerLateral?.imagenUrl || errorCarga) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute bottom-0 right-0 z-0 flex justify-end items-end max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[420px] w-full"
    >
      <img
        src={bannerLateral.imagenUrl}
        alt={bannerLateral.altTexto || "Ilustración Institucional"}
        onError={() => {
          console.error("Fallo de red al cargar la imagen lateral");
          setErrorCarga(true);
        }}
        // Se agregó 'block', 'object-right-bottom' y un leve translate para forzar el anclaje perfecto
        className="block w-full h-auto object-contain object-right-bottom opacity-50 transition-opacity duration-300 translate-y-[1px]"
        loading="eager"
      />
    </div>
  );
}

export default BannerLateral;
