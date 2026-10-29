"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Download,
  ExternalLink,
  BookOpen,
  Maximize2,
  Minimize2,
  FileText,
} from "lucide-react";

interface RevistaReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivoUrl: string;
  titulo: string;
  subtitulo?: string | null;
  nombreArchivo?: string | null;
}

export function RevistaReaderModal({
  isOpen,
  onClose,
  archivoUrl,
  titulo,
  subtitulo,
  nombreArchivo,
}: RevistaReaderModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cerrar modal con la tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Bloquear scroll de la página principal mientras el visor está abierto
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !archivoUrl) return null;

  // Usar el endpoint de streaming optimizado por HTTP Range requests si el archivo está guardado en el servidor
  const streamUrl =
    archivoUrl.startsWith("/uploads/")
      ? `/api/revista/pdf?file=${encodeURIComponent(archivoUrl)}`
      : archivoUrl;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 md:p-6 transition-all duration-300 animate-in fade-in"
    >
      <div className="relative w-full max-w-7xl h-[94vh] bg-slate-900 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Cabecera del Visor */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-950 border-b border-slate-800 text-white select-none">
          {/* Título e información */}
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-9 h-9 rounded-xl bg-[#0c4078] text-white flex items-center justify-center shrink-0 shadow-sm border border-blue-400/30">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate leading-tight">
                {titulo || "Revista Institucional"}
              </h3>
              {subtitulo && (
                <p className="text-xs text-blue-300 truncate mt-0.5 font-medium">
                  {subtitulo}
                </p>
              )}
            </div>
          </div>

          {/* Botones de acción de la barra superior */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Abrir en pestaña nueva */}
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-700"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink size={15} />
              <span className="hidden md:inline">Nueva Pestaña</span>
            </a>

            {/* Descargar PDF */}
            <a
              href={streamUrl}
              download={nombreArchivo || "revista-institucional.pdf"}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-[#0c4078] hover:bg-[#0f4f94] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm border border-blue-400/40"
              title="Descargar archivo PDF"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Descargar PDF</span>
            </a>

            {/* Pantalla Completa */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Cerrar Visor */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer ml-1 border border-red-500/50"
              title="Cerrar visor (Esc)"
              aria-label="Cerrar visor"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Cuerpo del Visor de Revista PDF con soporte dual Object/Iframe y Range Streaming */}
        <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden">
          <object
            data={`${streamUrl}#toolbar=1&navpanes=1&view=FitH`}
            type="application/pdf"
            className="w-full h-full border-0 bg-slate-800"
          >
            <iframe
              src={`${streamUrl}#toolbar=1&navpanes=1&view=FitH`}
              className="w-full h-full border-0 bg-slate-800"
              title={titulo || "Visor de Revista PDF"}
            />
          </object>
        </div>

        {/* Barra inferior de accesibilidad y ayuda para móviles */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 text-center flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-blue-400" />
            <span>Documento Oficial PDF • Transmisión optimizada por fragmentos (Streaming)</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-slate-500">
              Presione [Esc] para cerrar
            </span>
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline font-medium"
            >
              ¿Problemas para visualizar? Clic aquí para abrir directamente
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RevistaReaderModal;

