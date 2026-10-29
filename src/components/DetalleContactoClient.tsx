"use client";

import React from "react";
import { useConfig } from "@/context/ConfigContext";
import { ContactoItemData } from "@/types";
import { Calendar } from "lucide-react";
import { renderTextWithLinks } from "@/lib/renderTextWithLinks";

interface DetalleContactoClientProps {
  initialContacto: ContactoItemData;
}

export function DetalleContactoClient({
  initialContacto,
}: DetalleContactoClientProps) {
  const { contactosItems } = useConfig();

  // Si existe en el estado global reactivo, usamos la versión actualizada en tiempo real
  const item =
    contactosItems.find((c) => c.id === initialContacto.id) || initialContacto;

  const fechaFormateada = item.creadoAt
    ? new Intl.DateTimeFormat("es-VE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(item.creadoAt))
    : "Reciente";

  return (
    <article className="bg-white border border-slate-200 rounded-lg shadow-xs p-6 sm:p-10">
      <div className="flex flex-wrap items-center gap-3 pb-4 mb-4 border-b border-slate-100">
        <span className="px-3 py-1 bg-blue-50 text-[#0c4078] text-xs font-extrabold uppercase rounded tracking-wider">
          {item.tipo}
        </span>

        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Calendar size={13} />
          {fechaFormateada}
        </span>
      </div>

      <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase text-[#0c4078] leading-tight mb-6">
        {item.titulo}
      </h1>

      <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line border-t border-slate-100 pt-6">
        {renderTextWithLinks(item.contenido)}
      </div>
    </article>
  );
}

export default DetalleContactoClient;
