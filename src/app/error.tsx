"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    error?.message?.toLowerCase().includes("failed to load chunk") ||
    error?.message?.toLowerCase().includes("chunkloaderror") ||
    error?.name === "ChunkLoadError" ||
    (typeof error?.message === "string" &&
      /chunk.*failed|failed.*chunk/i.test(error.message));

  useEffect(() => {
    console.error("[Root Error Boundary]:", error);

    // Auto-recuperación transparente: si es un chunk desactualizado por nueva compilación,
    // recargar automáticamente con parámetro único para limpiar la caché de scripts
    if (isChunkError && typeof window !== "undefined") {
      const reloadKey = "fundaproal_chunk_reload";
      const count = parseInt(sessionStorage.getItem(reloadKey) || "0", 10);
      if (count < 2) {
        sessionStorage.setItem(reloadKey, String(count + 1));
        window.location.href =
          window.location.pathname + "?_t=" + Date.now();
      }
    }
  }, [error, isChunkError]);

  const handleRetry = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("fundaproal_chunk_reload");
      } catch {}
      window.location.href =
        window.location.pathname + "?_t=" + Date.now();
    } else {
      reset();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("fundaproal_chunk_reload");
      } catch {}
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/?_t=" + Date.now();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-10 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-inner">
          <AlertTriangle size={36} />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Portal Institucional FUNDAPROAL
          </h1>
          <p className="text-sm text-slate-600">
            {isChunkError
              ? "Se ha publicado una nueva versión del portal. Actualizando contenidos..."
              : "Ocurrió una interrupción temporal al cargar este contenido. El sistema ha protegido la sesión."}
          </p>
          {error?.message && (
            <div className="mt-4 p-3 bg-slate-100 rounded-lg text-xs font-mono text-slate-600 text-left overflow-x-auto max-h-32 border border-slate-200">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c4078] hover:bg-[#082a52] text-white text-sm font-semibold transition-all shadow-md cursor-pointer"
          >
            <RefreshCw size={16} />
            {isChunkError ? "Actualizar versión" : "Reintentar carga"}
          </button>

          <button
            type="button"
            onClick={handleGoHome}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all border border-slate-300 cursor-pointer"
          >
            <Home size={16} />
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

