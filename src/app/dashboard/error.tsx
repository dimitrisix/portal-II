"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DASHBOARD ERROR]:", error);
  }, [error]);

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>

        <h2 className="text-lg font-bold text-slate-800">
          Error al cargar esta sección
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {error?.message ||
            "Ocurrió un error inesperado al procesar la solicitud en el panel de control."}
        </p>

        {error?.digest && (
          <p className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 break-all">
            Código: {error.digest}
          </p>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0c4078] hover:bg-[#092e57] rounded-md transition cursor-pointer"
          >
            <RefreshCw size={14} />
            Reintentar
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition cursor-pointer"
          >
            <LayoutDashboard size={14} />
            Inicio del Panel
          </Link>
        </div>
      </div>
    </div>
  );
}

