"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

export function ProgramCards() {
  const { programas, recargarProgramas } = useConfig();

  useEffect(() => {
    recargarProgramas();
  }, [recargarProgramas]);

  // Solo se muestran los primeros 4 en la portada
  const programasVisibles = programas.slice(0, 4);
  const tieneMasDeCuatro = programas.length > 4;

  return (
    <div className="w-full text-left">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#e62020] inline-block rounded-full" />
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#0c4078]">
            Programas
          </h2>
        </div>
      </div>

      {/* Grid de Programas (Máximo 4) */}
      {programas.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-md text-slate-400 text-xs">
          No hay programas publicados actualmente.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programasVisibles.map((item) => {
              const urlDetalle = item.enlaceUrl || `/programas/${item.id}`;

              return (
                <article
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-md shadow-xs hover:shadow-md transition-shadow flex flex-col overflow-hidden group"
                >
                  <Link
                    href={urlDetalle}
                    className="h-48 w-full bg-slate-100 overflow-hidden relative block"
                  >
                    <img
                      src={item.imagenUrl}
                      alt={item.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2 font-medium">
                        <Calendar size={13} />
                        <span>{item.fecha}</span>
                      </div>

                      <Link href={urlDetalle}>
                        <h3 className="font-bold text-sm leading-snug uppercase text-slate-900 mb-2 hover:text-[#0c4078] transition-colors line-clamp-2">
                          {item.titulo}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {item.resumen}
                      </p>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Link
                        href={urlDetalle}
                        className="text-[#e62020] hover:text-[#b81818] p-1 inline-flex items-center transition-transform group-hover:translate-x-1"
                        aria-label={`Ver detalle de ${item.titulo}`}
                      >
                        <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Enlace elegante al final si existen más de 4 programas */}
          {tieneMasDeCuatro && (
            <div className="mt-8 flex justify-center">
              <Link
                href="/programas"
                className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#0c4078] text-[#0c4078] hover:bg-[#0c4078] hover:text-white text-sm font-semibold transition-all duration-200 shadow-xs hover:shadow-sm"
              >
                <span>Ver todos los programas</span>
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProgramCards;
