"use client";

import React, { useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import { PrensaVideoData } from "@/types";
import {
  extraerYouTubeId,
  obtenerEmbedUrl,
  obtenerThumbnailUrl,
  esInstagram,
  esYouTube,
} from "@/lib/videoUtils";
import {
  Video,
  Trash2,
  Edit2,
  XCircle,
  PlusCircle,
  Play,
  ExternalLink,
} from "lucide-react";

export function PrensaAdminModal() {
  const { videosPrensa, recargarVideosPrensa, notificarCambioPrensa } =
    useConfig();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [reproducirEnVivo, setReproducirEnVivo] = useState(false);

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const handleIniciarEdicion = (video: PrensaVideoData) => {
    setEditingId(video.id);
    setTitulo(video.titulo);
    setVideoUrl(video.videoUrl);
    setDescripcion(video.descripcion || "");
    setFecha(video.fecha);
    setReproducirEnVivo(false);
    setMensaje(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelarEdicion = () => {
    setEditingId(null);
    setTitulo("");
    setVideoUrl("");
    setDescripcion("");
    setFecha("");
    setReproducirEnVivo(false);
    setMensaje(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !videoUrl) return;

    setLoading(true);
    setMensaje(null);

    try {
      const res = await fetch("/api/configuracion/prensa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          titulo,
          videoUrl,
          descripcion,
          fecha,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar video");

      await recargarVideosPrensa();
      notificarCambioPrensa();

      setMensaje(
        editingId
          ? "¡Video actualizado con éxito!"
          : "¡Video agregado a prensa con éxito!",
      );
      handleCancelarEdicion();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "No se pudo guardar el video";
      setMensaje(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Deseas eliminar este video de la sección prensa?")) return;

    try {
      const res = await fetch(`/api/configuracion/prensa?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");

      if (editingId === id) handleCancelarEdicion();
      await recargarVideosPrensa();
      notificarCambioPrensa();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      alert(`Error al eliminar: ${errorMessage}`);
    }
  };

  const videoId = extraerYouTubeId(videoUrl);
  const thumbnailUrl = videoId ? obtenerThumbnailUrl(videoUrl) : "";
  const embedUrl = videoId ? obtenerEmbedUrl(videoUrl) : "";

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 w-full max-w-4xl text-left space-y-6">
      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 pb-6 border-b border-slate-200"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
            {editingId ? (
              <>
                <Edit2 size={16} className="text-amber-600" />
                <span>Editando Video #{editingId}</span>
              </>
            ) : (
              <>
                <PlusCircle size={16} className="text-[#0c4078]" />
                <span>Agregar Video de Prensa</span>
              </>
            )}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelarEdicion}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer"
            >
              <XCircle size={14} /> Cancelar edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Título del Video
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Reporte Especial de Abastecimiento..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-[#0c4078]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Fecha (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: 23 sep. 2026 (por defecto hoy)"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-[#0c4078]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Enlace del Video (YouTube o Instagram)
          </label>
          <input
            type="text"
            required
            placeholder="Ej: https://www.youtube.com/watch?v=... o https://www.youtube.com/shorts/... o https://www.instagram.com/reel/..."
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              setReproducirEnVivo(false);
            }}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-[#0c4078]"
          />
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500">Soporta:</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
              YouTube & Shorts
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-pink-50 text-pink-700 px-2 py-0.5 rounded border border-pink-200">
              Instagram Reels & Posts
            </span>
          </div>
        </div>

        {/* Vista previa protegida contra bloqueos */}
        {videoId && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase">
                  Vista previa del video detectado
                </label>
                {esYouTube(videoUrl) && (
                  <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
                    YouTube
                  </span>
                )}
                {esInstagram(videoUrl) && (
                  <span className="text-[10px] font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2 py-0.5 rounded-full">
                    Instagram Reel
                  </span>
                )}
              </div>
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#0c4078] hover:underline flex items-center gap-1"
              >
                Abrir Enlace Original <ExternalLink size={12} />
              </a>
            </div>

            <div
              className={`bg-slate-900 rounded-md overflow-hidden border border-slate-300 relative group ${
                esInstagram(videoUrl)
                  ? "w-full max-w-[280px] aspect-[9/13]"
                  : "w-full max-w-md aspect-video"
              }`}
            >
              {reproducirEnVivo ? (
                <iframe
                  src={`${embedUrl}${videoId?.startsWith("IG_") ? "" : "?autoplay=1"}`}
                  title="Reproductor Multimedia"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  scrolling="no"
                  allowFullScreen
                />
              ) : (
                <div
                  onClick={() => setReproducirEnVivo(true)}
                  className="w-full h-full cursor-pointer relative flex items-center justify-center bg-black"
                >
                  <img
                    src={thumbnailUrl}
                    alt="Miniatura de vista previa"
                    className={`w-full h-full opacity-90 group-hover:opacity-100 transition-opacity ${
                      videoId?.startsWith("IG_")
                        ? "object-contain bg-slate-950 p-6"
                        : "object-cover"
                    }`}
                    onError={(e) => {
                      if (!videoId?.startsWith("IG_")) {
                        (e.target as HTMLImageElement).src =
                          `https://img.youtube.com/vi/${videoId}/0.jpg`;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <Play size={24} className="ml-1 fill-white" />
                  </div>
                </div>
              )}
            </div>
            {!reproducirEnVivo && (
              <p className="text-[11px] text-slate-400">
                Haz clic en el botón de reproducción para probar el video antes
                de publicar.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Descripción o Resumen (Opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Breve reseña sobre el video..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-[#0c4078]"
          />
        </div>

        {mensaje && (
          <div
            className={`p-2.5 rounded-md border text-sm ${
              mensaje.startsWith("Error:")
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {mensaje}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancelarEdicion}
            disabled={loading}
            className="px-4 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={loading || !titulo || !videoUrl}
            className="px-4 py-2 rounded-md bg-[#0c4078] text-white text-sm font-medium hover:bg-[#0a325d] disabled:opacity-60"
          >
            {loading
              ? "Guardando..."
              : editingId
                ? "Guardar cambios"
                : "Agregar video"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
            <Video size={16} className="text-[#0c4078]" />
            Videos registrados
          </h3>
          <span className="text-xs text-slate-500">
            {videosPrensa.length}{" "}
            {videosPrensa.length === 1 ? "video" : "videos"}
          </span>
        </div>

        {videosPrensa.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Aún no hay videos de prensa cargados.
          </div>
        ) : (
          <div className="space-y-3">
            {videosPrensa.map((video) => {
              const videoPreviewId = extraerYouTubeId(video.videoUrl);
              const previewThumb = videoPreviewId
                ? obtenerThumbnailUrl(video.videoUrl)
                : "";

              return (
                <div
                  key={video.id}
                  className="flex flex-col md:flex-row gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="w-full md:w-44 h-24 rounded-md overflow-hidden border border-slate-200 bg-slate-200 shrink-0">
                    {previewThumb ? (
                      <img
                        src={previewThumb}
                        alt={video.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <Play size={20} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-700 truncate">
                          {video.titulo}
                        </h4>
                        {video.fecha && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            {video.fecha}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleIniciarEdicion(video)}
                          className="p-2 rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(video.id)}
                          className="p-2 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {video.descripcion && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                        {video.descripcion}
                      </p>
                    )}

                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-[11px] text-[#0c4078] hover:underline"
                    >
                      Ver enlace <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
