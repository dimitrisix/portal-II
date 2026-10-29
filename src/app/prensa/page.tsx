"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Video, Calendar, ExternalLink } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import { obtenerEmbedUrl, esInstagram } from "@/lib/videoUtils";

export default function PrensaPage() {
  const { videosPrensa, recargarVideosPrensa } = useConfig();

  useEffect(() => {
    recargarVideosPrensa();
  }, [recargarVideosPrensa]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfd] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left">
        <div className="pb-6 mb-8 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#0c4078] hover:text-[#092e57] mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
              Volver al inicio
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-2 h-7 bg-[#e62020] inline-block rounded-full" />
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-[#0c4078]">
                Galería de Prensa y Videos
              </h1>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full self-start sm:self-auto">
            {videosPrensa.length}{" "}
            {videosPrensa.length === 1 ? "video" : "videos"} en total
          </span>
        </div>

        {videosPrensa.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
            <Video size={36} className="text-slate-300" />
            <span>No hay videos cargados actualmente.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videosPrensa.map((video) => {
              const embed = obtenerEmbedUrl(video.videoUrl);
              const isIg = esInstagram(video.videoUrl);

              return (
                <article
                  key={video.id}
                  className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden flex flex-col"
                >
                  <div
                    className={`relative w-full ${
                      isIg ? "aspect-[9/13] max-h-[520px]" : "aspect-video"
                    } bg-black overflow-hidden`}
                  >
                    {embed ? (
                      <iframe
                        src={embed}
                        title={video.titulo}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        scrolling="no"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                        Video no disponible
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2 font-medium">
                        <Calendar size={13} />
                        <span>{video.fecha}</span>
                      </div>
                      <h2 className="font-bold text-sm uppercase text-slate-900 leading-snug mb-2">
                        {video.titulo}
                      </h2>
                      {video.descripcion && (
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {video.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[#0c4078] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        {isIg ? "Ver en Instagram" : "Ver en YouTube"}
                        <ExternalLink size={12} />
                      </a>
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
