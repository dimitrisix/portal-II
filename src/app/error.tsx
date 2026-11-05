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
    error?.name === "ChunkLoadError";

  useEffect(() => {
    console.error("[Root Error Boundary]:", error);

    // Auto-recuperación transparente: si es un chunk obsoleto por despliegue de nueva versión,
    // recargar automáticamente la página una sola vez para obtener el nuevo manifiesto de assets.
    if (isChunkError && typeof window !== "undefined") {
      const reloadKey = "fundaproal_chunk_reload_" + (error.message || "");
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "true");
        window.location.reload();
      }
    }
  }, [error, isChunkError]);

  const handleRetry = () => {
    if (isChunkError && typeof window !== "undefined") {
      window.location.reload();
    } else {
      reset();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
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

