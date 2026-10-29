"use client";

import React, { useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import { Check, UploadCloud, Trash2, Image as ImageIcon } from "lucide-react";

export function HeroAdminModal() {
  const { slides, recargarSlides, notificarCambioHero } = useConfig();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubirImagen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setMensaje(null);

    const formData = new FormData();
    formData.append("imagen", selectedFile);

    try {
      const res = await fetch("/api/configuracion/hero", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir");

      await recargarSlides();
      notificarCambioHero();
      setMensaje("¡Imagen agregada al carrusel exitosamente!");
      setPreview(null);
      setSelectedFile(null);
    } catch {
      setMensaje("Ocurrió un error al subir la imagen");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar esta imagen del carrusel?"))
      return;

    try {
      const res = await fetch(`/api/configuracion/hero?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await recargarSlides();
        notificarCambioHero();
      }
    } catch (err) {
      console.error("Error al eliminar slide:", err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 w-full max-w-4xl text-left space-y-6">
      {/* 1. Formulario para subir nueva imagen */}
      <form
        onSubmit={handleSubirImagen}
        className="space-y-4 pb-6 border-b border-slate-200"
      >
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Agregar nueva imagen al carrusel
        </h2>

        {/* Vista previa antes de subir */}
        {preview && (
          <div className="relative h-44 w-full max-w-md bg-slate-50 border-2 border-dashed border-emerald-400 rounded-lg overflow-hidden flex items-center justify-center p-2">
            <img
              src={preview}
              alt="Previsualización"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
            Seleccionar archivo (JPG, PNG, WebP)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0c4078] file:text-white hover:file:bg-[#092e57] cursor-pointer border border-slate-200 rounded-md"
          />
        </div>

        {mensaje && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs font-medium text-emerald-700 flex items-center gap-1.5">
            <Check size={15} /> {mensaje}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedFile}
          className="flex items-center gap-2 bg-[#0c4078] hover:bg-[#092e57] text-white py-2.5 px-6 rounded-md text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
        >
          <UploadCloud size={16} />
          {loading ? "Subiendo..." : "Agregar Imagen"}
        </button>
      </form>

      {/* 2. Galería de imágenes activas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Imágenes en el Carrusel ({slides.length})
          </h2>
          <span className="text-xs text-slate-400">
            Rotación automática en el portal principal
          </span>
        </div>

        {slides.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs flex flex-col items-center gap-2">
            <ImageIcon size={32} />
            <span>No hay imágenes cargadas en el carrusel aún.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="group relative bg-slate-100 border border-slate-200 rounded-lg overflow-hidden h-36 flex items-center justify-center shadow-xs"
              >
                <img
                  src={slide.imagenUrl}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                  #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleEliminar(slide.id)}
                  title="Eliminar del carrusel"
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded transition shadow-sm cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
