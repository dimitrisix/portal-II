"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, ArrowRight, Calendar, Newspaper } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

export default function ProgramasPage() {
  const { programas, recargarProgramas } = useConfig();

  // Asegura la recarga inmediata al montar la página
  useEffect(() => {
    recargarProgramas();
  }, [recargarProgramas]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfd] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cabecera y botón de regreso */}
        <div className="pb-6 mb-8 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#0c4078] hover:text-[#092e57] mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
              Volver al portal principal
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-2 h-7 bg-[#e62020] inline-block rounded-full" />
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-[#0c4078]">
                Todos los Programas
              </h1>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full self-start sm:self-auto">
            {programas.length}{" "}
            {programas.length === 1 ? "publicación" : "publicaciones"}
          </span>
        </div>

        {/* Cuadrícula completa reactiva */}
        {programas.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
            <Newspaper size={36} className="text-slate-300" />
            <span>No hay programas registrados en el sistema.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programas.map((item) => {
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

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2 font-medium">
                        <Calendar size={13} />
                        <span>{item.fecha}</span>
                      </div>

                      <Link href={urlDetalle}>
                        <h2 className="font-bold text-base leading-snug uppercase text-slate-900 mb-2 hover:text-[#0c4078] transition-colors line-clamp-2">
                          {item.titulo}
                        </h2>
                      </Link>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {item.resumen}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-semibold text-[#0c4078]">
                        Leer más
                      </span>
                      <Link
                        href={urlDetalle}
                        className="text-[#e62020] hover:text-[#b81818] p-1 inline-flex items-center transition-transform group-hover:translate-x-1"
                        aria-label={`Leer más sobre ${item.titulo}`}
                      >
                        <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
