"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, FileText, ChevronRight } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import { renderTextWithLinks } from "@/lib/renderTextWithLinks";

export default function TodosContactosPage() {
  const { contactosItems, recargarContactosItems } = useConfig();

  useEffect(() => {
    recargarContactosItems();
  }, [recargarContactosItems]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfd] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-left">
        {/* Cabecera y botón de retorno */}
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
                Todos los Contactos y Publicaciones
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Directorio completo de discursos, documentos oficiales, trípticos
              y revistas institucionales.
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full self-start sm:self-auto">
            {contactosItems.length}{" "}
            {contactosItems.length === 1 ? "registro" : "registros"} en total
          </span>
        </div>

        {/* Cuadrícula responsiva */}
        {contactosItems.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
            <FileText size={36} className="text-slate-300" />
            <span>
              No hay publicaciones disponibles en esta sección actualmente.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactosItems.map((item) => (
              <article
                key={item.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                <div>
                  {/* Encabezado sin el indicador #0 */}
                  <div className="flex items-center justify-start gap-2 mb-2">
                    <span className="text-xs font-bold text-[#0c4078] bg-blue-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
                      {item.tipo}
                    </span>
                  </div>

                  <Link href={`/contactos/${item.id}`} className="block">
                    <h2 className="text-sm font-bold uppercase text-slate-800 leading-snug group-hover:text-[#0c4078] transition-colors line-clamp-3 mb-2">
                      {item.titulo}
                    </h2>
                  </Link>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {renderTextWithLinks(item.contenido)}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0c4078]">
                    Ver información
                  </span>
                  <Link
                    href={`/contactos/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#e62020] hover:text-[#b81818] transition-transform group-hover:translate-x-1"
                  >
                    <span>Detalles</span>
                    <ChevronRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
