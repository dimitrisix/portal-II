"use client";

import React from "react";
import { useConfig } from "@/context/ConfigContext";
import { ProgramaData } from "@/types";
import { Calendar, ExternalLink } from "lucide-react";
import { renderTextWithLinks } from "@/lib/renderTextWithLinks";

export function DetalleProgramaClient({
  initialPrograma,
}: {
  initialPrograma: ProgramaData;
}) {
  const { programas } = useConfig();

  // Si existe en el estado global reactivo, usamos la versión actualizada en tiempo real
  const programa =
    programas.find((p) => p.id === initialPrograma.id) || initialPrograma;

  return (
    <article className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
        <Calendar size={14} />
        <span>{programa.fecha}</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0c4078] uppercase leading-tight mb-6">
        {programa.titulo}
      </h1>

      <div className="w-full h-[280px] sm:h-[420px] rounded-md overflow-hidden mb-6 bg-slate-100 border border-slate-200">
        <img
          src={programa.imagenUrl}
          alt={programa.titulo}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4 bg-slate-50 border-l-4 border-[#e62020] rounded-r text-sm sm:text-base text-slate-700 italic font-medium mb-6 leading-relaxed">
        {renderTextWithLinks(programa.resumen)}
      </div>

      <div className="text-slate-800 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
        {renderTextWithLinks(
          programa.contenido ? programa.contenido : programa.resumen,
        )}
      </div>

      {programa.enlaceUrl && (
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-slate-500 font-medium">
            Enlace relacionado a esta publicación:
          </span>
          <a
            href={
              programa.enlaceUrl.startsWith("http")
                ? programa.enlaceUrl
                : `https://${programa.enlaceUrl}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0c4078] hover:bg-[#092e57] text-white text-xs sm:text-sm font-bold transition shadow-xs hover:shadow-md cursor-pointer"
          >
            <span>Visitar sitio web oficial</span>
            <ExternalLink size={15} />
          </a>
        </div>
      )}
    </article>
  );
}

export default DetalleProgramaClient;
