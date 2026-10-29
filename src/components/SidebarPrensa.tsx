"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Video, Calendar } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import { obtenerEmbedUrl, esInstagram } from "@/lib/videoUtils";

export function SidebarPrensa() {
  const { videosPrensa, recargarVideosPrensa } = useConfig();

  useEffect(() => {
    recargarVideosPrensa();
  }, [recargarVideosPrensa]);

  const videoPrincipal = videosPrensa[0]; // El más reciente
  const tieneMasDeUno = videosPrensa.length > 1;
  const embedUrl = videoPrincipal
    ? obtenerEmbedUrl(videoPrincipal.videoUrl)
    : "";
  const isIg = videoPrincipal ? esInstagram(videoPrincipal.videoUrl) : false;

  return (
    <aside className="w-full text-left">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#e62020] inline-block rounded-full" />
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#0c4078]">
            Prensa Institucional
          </h2>
        </div>
      </div>

      {/* Contenido */}
      {!videoPrincipal ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-md text-slate-400 text-xs">
          No hay videos de prensa disponibles actualmente.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden flex flex-col">
          {/* Iframe adaptable (16:9 para YouTube, vertical para Reels de Instagram) */}
          <div
            className={`relative w-full ${
              isIg ? "aspect-[9/13] max-h-[500px]" : "aspect-video"
            } bg-black overflow-hidden`}
          >
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={videoPrincipal.titulo}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                scrolling="no"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                Enlace de video no válido
              </div>
            )}
          </div>

          <div className="p-4 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2 font-medium">
                <Calendar size={13} />
                <span>{videoPrincipal.fecha}</span>
              </div>
              <h3 className="font-bold text-sm uppercase text-slate-900 leading-snug mb-2">
                {videoPrincipal.titulo}
              </h3>
              {videoPrincipal.descripcion && (
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {videoPrincipal.descripcion}
                </p>
              )}
            </div>

            {tieneMasDeUno && (
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-center">
                <Link
                  href="/prensa"
                  className="group inline-flex items-center gap-2 text-xs font-semibold text-[#0c4078] hover:text-[#e62020] transition-colors py-1 cursor-pointer"
                >
                  <Video size={14} />
                  <span>
                    Ver todos los videos de prensa ({videosPrensa.length})
                  </span>
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

export default SidebarPrensa;
