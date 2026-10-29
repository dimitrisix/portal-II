"use client";

import React, { useState, useEffect, useRef } from "react";
import { useConfig } from "@/context/ConfigContext";
import {
  UploadCloud,
  Check,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";

export function BannerLateralAdminModal() {
  const { bannerLateral, recargarBannerLateral, notificarCambioBannerLateral } =
    useConfig();

  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [visible, setVisible] = useState(true);

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar estado inicial de forma asíncrona para evitar errores de linter
  useEffect(() => {
    if (bannerLateral) {
      const timer = setTimeout(() => {
        setPreviewUrl(bannerLateral.imagenUrl || "");
        setVisible(bannerLateral.visible !== false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [bannerLateral]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoSeleccionado(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMensaje(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setArchivoSeleccionado(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMensaje(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      const formData = new FormData();

      // Adjuntamos el archivo (si el usuario seleccionó uno nuevo)
      if (archivoSeleccionado) {
        formData.append("file", archivoSeleccionado);
      } else if (!bannerLateral?.imagenUrl) {
        throw new Error("Debes seleccionar una imagen para el banner.");
      }

      // Adjuntamos el estado de visibilidad al mismo formulario
      formData.append("visible", visible ? "true" : "false");

      // Enviamos TODO en una sola petición al endpoint
      const response = await fetch("/api/configuracion/banner-lateral", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error || "Error al actualizar el banner lateral",
        );
      }

      // Notificar recarga reactiva inmediata
      await recargarBannerLateral();
      notificarCambioBannerLateral();

      // Limpiar UI tras el guardado exitoso
      setArchivoSeleccionado(null);
      setPreviewUrl(responseData.banner.imagenUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setMensaje("¡Imagen actualizada y sincronizada en vivo con éxito!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "No se pudo guardar la imagen";
      setMensaje(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 w-full max-w-2xl text-left space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input de archivo oculto */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp, image/svg+xml"
          className="hidden"
        />

        {/* Zona de Selección o Cambio de Imagen */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            Ilustración Lateral
          </label>

          {previewUrl && !archivoSeleccionado ? (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                  <img
                    // ¡AQUÍ ESTÁ LA CORRECCIÓN! Eliminamos el Date.now()
                    src={previewUrl}
                    alt="Ilustración actual"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                    Imagen Activa
                  </span>
                  <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px] sm:max-w-xs">
                    {previewUrl}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-[#0c4078] bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition cursor-pointer shrink-0"
              >
                <RefreshCw size={14} />
                Cambiar imagen
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 hover:border-[#0c4078] bg-slate-50/60 hover:bg-blue-50/20 rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-[#0c4078] transition-colors">
                <UploadCloud size={28} />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-[#0c4078]">
                  {archivoSeleccionado
                    ? "Haz clic aquí si deseas elegir otro archivo"
                    : "Haz clic para seleccionar una imagen de tu equipo"}
                </p>
                <p className="text-xs text-slate-400">
                  Formatos recomendados: PNG con fondo transparente, WEBP o SVG
                </p>
              </div>

              {archivoSeleccionado && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-[#0c4078] text-xs font-semibold rounded-full mt-2">
                  <ImageIcon size={14} />
                  <span>Seleccionada: {archivoSeleccionado.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Previsualización del archivo nuevo antes de guardar */}
        {archivoSeleccionado && previewUrl && (
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg flex items-center gap-4">
            <img
              src={previewUrl}
              alt="Nueva vista previa"
              className="w-16 h-16 object-contain bg-white rounded border border-amber-200 p-1"
            />
            <div>
              <p className="text-xs font-bold text-amber-800">
                Nueva imagen lista para aplicar
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Haz clic en &quot;Guardar y Publicar Cambio&quot; para
                reemplazar la imagen anterior.
              </p>
            </div>
          </div>
        )}

        {/* Interruptor de Visibilidad */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold border transition cursor-pointer ${
              visible
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-slate-100 text-slate-500 border-slate-300"
            }`}
          >
            {visible ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>
              {visible
                ? "Ilustración VISIBLE en la portada"
                : "Ilustración OCULTA en la portada"}
            </span>
          </button>
        </div>

        {mensaje && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <Check size={16} /> {mensaje}
          </div>
        )}

        {/* Botón de Guardado */}
        <button
          type="submit"
          disabled={
            loading ||
            (!archivoSeleccionado && visible === bannerLateral?.visible)
          }
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 rounded-md text-sm font-bold text-white bg-[#0c4078] hover:bg-[#092e57] transition disabled:opacity-40 cursor-pointer shadow-xs"
        >
          <Save size={16} />
          {loading ? "Reemplazando..." : "Guardar y Publicar Cambio"}
        </button>
      </form>
    </div>
  );
}

export default BannerLateralAdminModal;
