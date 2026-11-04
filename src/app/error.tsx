"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Root Error Boundary]:", error);
  }, [error]);

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
            Ocurrió una interrupción temporal al cargar este contenido. El sistema ha protegido la sesión.
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
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c4078] hover:bg-[#082a52] text-white text-sm font-semibold transition-all shadow-md cursor-pointer"
          >
            <RefreshCw size={16} />
            Reintentar carga
          </button>

          <Link
            href="/"
            onClick={() => window.location.href = "/"}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all border border-slate-300 cursor-pointer"
          >
            <Home size={16} />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
