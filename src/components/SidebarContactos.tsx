"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useConfig } from "@/context/ConfigContext";
import { ArrowRight, ChevronRight } from "lucide-react";

export function SidebarContactos() {
  const { contactosItems, recargarContactosItems } = useConfig();

  useEffect(() => {
    recargarContactosItems();
  }, [recargarContactosItems]);

  const itemsVisibles = contactosItems.slice(0, 3);
  const tieneMasDeTres = contactosItems.length > 3;

  return (
    <aside className="w-full text-left bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs hover:shadow-sm transition-shadow">
      {/* Encabezado Institucional */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-5 bg-[#e62020] inline-block rounded-full" />
          <h2 className="text-base font-extrabold uppercase tracking-wider text-[#0c4078]">
            CONTACTOS
          </h2>
        </div>
      </div>

      {/* Lista de hasta 3 ítems */}
      {contactosItems.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 italic text-center">
          No hay publicaciones disponibles actualmente.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {itemsVisibles.map((item) => (
            <article key={item.id} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={`/contactos/${item.id}`}
                className="group block select-none focus:outline-hidden"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-bold tracking-wider text-[#0c4078] uppercase group-hover:text-[#e62020] transition-colors">
                    {item.tipo}
                  </span>
                  <ChevronRight
                    size={13}
                    className="text-slate-300 group-hover:text-[#0c4078] group-hover:translate-x-0.5 transition-all"
                  />
                </div>

                <p className="text-xs sm:text-[13px] font-semibold text-slate-800 leading-snug uppercase group-hover:text-[#0c4078] transition-colors mt-0.5 line-clamp-2">
                  {item.titulo}
                </p>
              </Link>
            </article>
          ))}
        </div>
      )}

      {/* Enlace elegante al final del último contacto */}
      {tieneMasDeTres && (
        <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-end">
          <Link
            href="/contactos"
            className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#0c4078] hover:text-[#e62020] tracking-wide uppercase transition-colors"
          >
            <span>Ver todos los contactos</span>
            <span className="text-[11px] text-slate-400 font-medium lowercase group-hover:text-[#e62020]">
              ({contactosItems.length})
            </span>
            <ArrowRight
              size={13}
              className="text-[#e62020] group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      )}
    </aside>
  );
}

export default SidebarContactos;
