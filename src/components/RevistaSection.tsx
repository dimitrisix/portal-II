"use client";

import React, { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { RevistaReaderModal } from "@/components/RevistaReaderModal";
import { RevistaConfigData } from "@/types";
import {
  BookOpen,
  Download,
  ExternalLink,
  Calendar,
  FileText,
  Eye,
  CheckCircle,
  Layers,
  Sparkles,
} from "lucide-react";

export function RevistaSection() {
  const { revista, revistas, recargarRevista } = useConfig();
  const [mounted, setMounted] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [revistaActivaId, setRevistaActivaId] = useState<number | null>(null);
  const [readerRevista, setReaderRevista] = useState<RevistaConfigData | null>(null);

  // Hidratación segura para sincronizar estado del cliente
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Recarga en vivo al montar
  useEffect(() => {
    if (mounted) {
      recargarRevista();
    }
  }, [mounted, recargarRevista]);

  // Lista de revistas activas que tengan archivo PDF asociado
  const listaActivas: RevistaConfigData[] = (
    Array.isArray(revistas) && revistas.length > 0
      ? revistas
      : revista
      ? [revista]
      : []
  ).filter((r) => r.habilitado && Boolean(r.archivoUrl));

  // =========================================================================
  // CONDICIÓN CRÍTICA DE VISIBILIDAD:
  // Si no hay ninguna revista habilitada con archivo PDF cargado,
  // devolvemos STRICTAMENTE 'null' para que la página principal se conserve
  // exactamente en su estado original sin dejar márgenes, espacios ni marcas.
  // =========================================================================
  if (!mounted || listaActivas.length === 0) {
    return null;
  }

  // Revista actualmente destacada en el visor principal
  const revistaDestacada: RevistaConfigData =
    listaActivas.find((r) => r.id === revistaActivaId) || listaActivas[0];

  const titulo = revistaDestacada.titulo || "Revista Institucional";
  const subtitulo = revistaDestacada.subtitulo || "Edición Digital";
  const descripcion =
    revistaDestacada.descripcion ||
    "Te invitamos a explorar nuestra edición institucional. Descubre artículos exclusivos, proyectos destacados y el compromiso continuo con las comunidades.";
  const fecha = revistaDestacada.fecha || "";
  const tamano = revistaDestacada.tamanoArchivo || "";
  const pdfStreamUrl = `/api/revista/pdf?file=${encodeURIComponent(
    revistaDestacada.archivoUrl || "",
  )}`;

  const abrirLector = (rev: RevistaConfigData) => {
    setReaderRevista(rev);
    setIsReaderOpen(true);
  };

  return (
    <>
      <section
        aria-label="Revista Institucional"
        className="w-full mb-10 md:mb-14 relative select-none animate-in fade-in duration-500"
      >
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#082444] via-[#0c4078] to-[#0a3563] text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-blue-400/20">
          {/* Elementos decorativos de fondo sutiles */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-[#e62020]/15 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />

          {/* =======================================================
              BLOQUE PRINCIPAL: EDICIÓN DESTACADA
              ======================================================= */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* COLUMNA 1: PORTADA 3D DE LA REVISTA DESTACADA */}
            <div className="lg:col-span-4 flex justify-center">
              <div
                onClick={() => abrirLector(revistaDestacada)}
                className="group relative cursor-pointer perspective-1000"
                title="Haz clic para abrir el visor de esta edición"
              >
                {/* Portada en relieve 3D estilo libro/revista */}
                <div className="relative w-[210px] sm:w-[240px] md:w-[260px] aspect-[1/1.42] rounded-xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2 group-hover:shadow-blue-900/60 border border-white/20 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col justify-between">
                  {revistaDestacada.portadaUrl ? (
                    <img
                      src={revistaDestacada.portadaUrl}
                      alt={`Portada de ${titulo}`}
                      className="w-full h-full object-cover block"
                    />
                  ) : pdfStreamUrl ? (
                    /* Portada generada a partir de la primera hoja del archivo PDF */
                    <div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center">
                      {/* Fondo institucional mientras se carga el fragmento de la primera página */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white/60 bg-gradient-to-br from-[#0c4078] to-[#082a52] pointer-events-none select-none">
                        <BookOpen size={30} className="text-blue-300 animate-pulse mb-2" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white line-clamp-2">
                          {titulo}
                        </span>
                        <span className="text-[10px] text-blue-200 mt-1">Cargando portada...</span>
                      </div>

                      {/* Visor de la primera página del documento PDF sin barras ni controles */}
                      <object
                        data={`${pdfStreamUrl}#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                        type="application/pdf"
                        className="relative z-5 w-full h-full border-0 pointer-events-none select-none object-cover"
                      >
                        <iframe
                          src={`${pdfStreamUrl}#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                          className="relative z-5 w-full h-full border-0 pointer-events-none select-none"
                          title={`Primera hoja (Portada) de ${titulo}`}
                        />
                      </object>

                      {/* Lomo de la revista (Efecto de sombra y relieve 3D sobre la primera hoja) */}
                      <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/60 via-black/25 to-transparent pointer-events-none z-10" />

                      {/* Borde sutil del libro */}
                      <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none z-10" />
                    </div>
                  ) : (
                    /* Portada institucional de respaldo */
                    <div className="w-full h-full p-5 flex flex-col justify-between bg-gradient-to-br from-[#0c4078] via-[#082a52] to-[#04152a] text-white relative overflow-hidden">
                      <div className="relative z-10 space-y-1">
                        <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#e62020] text-[10px] font-black uppercase tracking-wider shadow-xs">
                          FUNDAPROAL
                        </div>
                        <p className="text-[11px] text-blue-200 uppercase tracking-widest font-semibold">
                          Órgano Divulgativo
                        </p>
                      </div>

                      <div className="relative z-10 my-auto text-center space-y-2 py-4">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
                          <BookOpen size={24} className="text-white" />
                        </div>
                        <h4 className="text-lg font-black tracking-tight text-white leading-tight uppercase line-clamp-2">
                          {titulo}
                        </h4>
                      </div>

                      <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between text-[10px] text-slate-300">
                        <span className="font-semibold uppercase tracking-wider">
                          Edición Digital
                        </span>
                        {fecha && <span>{fecha}</span>}
                      </div>

                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
                    </div>
                  )}

                  {/* Capa brillante de hover con botón 'Abrir Revista' */}
                  <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white z-20">
                    <div className="w-12 h-12 rounded-full bg-[#e62020] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Eye size={22} className="text-white" />
                    </div>
                    <span className="text-xs font-black tracking-wider uppercase bg-black/70 px-3.5 py-1.5 rounded-full border border-white/30">
                      Abrir Revista
                    </span>
                  </div>
                </div>

                {/* Sombra de apoyo bajo el libro */}
                <div className="w-4/5 h-4 mx-auto mt-2 bg-black/40 rounded-full blur-md group-hover:w-full group-hover:blur-lg transition-all duration-500" />
              </div>
            </div>

            {/* COLUMNA 2: INFORMACIÓN EDITORIAL Y BOTONES DE ACCIÓN */}
            <div className="lg:col-span-8 space-y-5 text-left">
              {/* Badges superiores de categoría y edición */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-extrabold uppercase tracking-wide">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  Revista Digital
                </span>

                {subtitulo && (
                  <span className="px-3 py-1 rounded-full bg-white/10 text-blue-100 border border-white/15 text-xs font-semibold">
                    {subtitulo}
                  </span>
                )}

                {fecha && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs">
                    <Calendar size={12} className="text-blue-300" />
                    {fecha}
                  </span>
                )}

                {listaActivas.length > 1 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                    <Sparkles size={11} />
                    Edición Activa
                  </span>
                )}
              </div>

              {/* Título de la Revista */}
              <div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  {titulo}
                </h3>
                <p className="text-sm sm:text-base text-blue-200/90 font-medium mt-1">
                  Publicación institucional oficial en formato digital
                </p>
              </div>

              {/* Resumen / Sinopsis Editorial */}
              <div className="text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-2xl bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="whitespace-pre-line">{descripcion}</p>
              </div>

              {/* Chips de características */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5 bg-blue-950/40 px-3 py-1 rounded-lg border border-blue-400/20">
                  <CheckCircle size={13} className="text-emerald-400" />
                  Lectura interactiva en línea
                </span>
                <span className="inline-flex items-center gap-1.5 bg-blue-950/40 px-3 py-1 rounded-lg border border-blue-400/20">
                  <FileText size={13} className="text-blue-400" />
                  Descarga gratuita en PDF
                </span>
                {tamano && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-950/40 px-3 py-1 rounded-lg border border-blue-400/20 text-slate-300">
                    {tamano}
                  </span>
                )}
              </div>

              {/* Botonera de Acciones Principales */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* 1. Botón Primario: Leer Revista en Línea */}
                <button
                  type="button"
                  onClick={() => abrirLector(revistaDestacada)}
                  className="px-6 py-3.5 rounded-xl bg-[#e62020] hover:bg-[#c91818] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg hover:shadow-red-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <BookOpen size={18} />
                  <span>Leer Revista en Línea</span>
                </button>

                {/* 2. Botón Secundario: Descargar PDF */}
                <a
                  href={pdfStreamUrl}
                  download={
                    revistaDestacada.nombreArchivo || "revista-institucional.pdf"
                  }
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Descargar archivo PDF"
                >
                  <Download size={17} />
                  <span>Descargar PDF</span>
                </a>

                {/* 3. Botón Terciario: Abrir en pestaña nueva */}
                <a
                  href={pdfStreamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Abrir en pestaña nueva del navegador"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* =======================================================
              BLOQUE MULTI-REVISTA: CATÁLOGO DE EDICIONES DISPONIBLES
              Se activa únicamente si existen 2 o más revistas cargadas
              ======================================================= */}
          {listaActivas.length > 1 && (
            <div className="relative z-10 mt-10 pt-8 border-t border-white/15">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-300">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white leading-tight">
                      Ediciones Disponibles
                    </h4>
                    <p className="text-xs text-blue-200/80">
                      Explora o abre directamente cualquiera de nuestras publicaciones institucionales
                    </p>
                  </div>
                </div>

                <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-blue-900/60 border border-blue-400/30 text-xs font-semibold text-blue-200">
                  {listaActivas.length} Publicaciones
                </span>
              </div>

              {/* Carrusel / Parrilla horizontal responsiva con scroll táctil */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {listaActivas.map((edicion) => {
                  const esActiva = edicion.id === revistaDestacada.id;
                  const streamItemUrl = `/api/revista/pdf?file=${encodeURIComponent(
                    edicion.archivoUrl || "",
                  )}`;

                  return (
                    <div
                      key={edicion.id}
                      onClick={() => {
                        if (edicion.id) setRevistaActivaId(edicion.id);
                      }}
                      className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                        esActiva
                          ? "bg-white/15 border-blue-400 ring-2 ring-blue-400/50 shadow-lg scale-[1.02]"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      }`}
                      title={`Clic para destacar "${edicion.titulo}"`}
                    >
                      {/* Portada Miniatura 3D */}
                      <div className="relative w-full aspect-[1/1.42] rounded-xl overflow-hidden shadow-md mb-3 bg-slate-900 border border-white/15">
                        {edicion.portadaUrl ? (
                          <img
                            src={edicion.portadaUrl}
                            alt={`Portada de ${edicion.titulo}`}
                            className="w-full h-full object-cover block group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center">
                            <object
                              data={`${streamItemUrl}#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                              type="application/pdf"
                              className="w-full h-full border-0 pointer-events-none select-none"
                            >
                              <iframe
                                src={`${streamItemUrl}#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full h-full border-0 pointer-events-none select-none"
                                title={`Portada de ${edicion.titulo}`}
                              />
                            </object>
                            <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
                          </div>
                        )}

                        {/* Indicador de Activa */}
                        {esActiva && (
                          <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md bg-[#e62020] text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                            En Pantalla
                          </div>
                        )}

                        {/* Capa de Hover para abrir lector */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 z-20 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirLector(edicion);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#e62020] hover:bg-[#c91818] text-white text-[11px] font-bold flex items-center gap-1 shadow-md transition-colors cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>Leer</span>
                          </button>
                        </div>
                      </div>

                      {/* Información de la Edición */}
                      <div className="space-y-1 text-left min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                          {edicion.titulo}
                        </h5>
                        {edicion.subtitulo && (
                          <p className="text-[11px] text-blue-300 truncate">
                            {edicion.subtitulo}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-white/10 mt-2">
                          <span className="truncate">{edicion.fecha || "Edición"}</span>
                          {edicion.tamanoArchivo && (
                            <span className="shrink-0">{edicion.tamanoArchivo}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal Visor Interactivo en Alta Definición */}
      {readerRevista && (
        <RevistaReaderModal
          isOpen={isReaderOpen}
          onClose={() => {
            setIsReaderOpen(false);
            setReaderRevista(null);
          }}
          archivoUrl={`/api/revista/pdf?file=${encodeURIComponent(
            readerRevista.archivoUrl || "",
          )}`}
          titulo={readerRevista.titulo || "Revista Institucional"}
          subtitulo={readerRevista.subtitulo}
          nombreArchivo={readerRevista.nombreArchivo}
        />
      )}
    </>
  );
}

export default RevistaSection;
