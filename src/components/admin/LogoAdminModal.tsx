"use client";

import React, { useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import { Check, Image as ImageIcon, UploadCloud } from "lucide-react";

export function LogoAdminModal() {
  const { logo, actualizarLogo, recargarLogo } = useConfig();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setMensaje(null);

    const formData = new FormData();
    formData.append("logo", selectedFile);

    try {
      const res = await fetch("/api/configuracion/logo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al guardar");

      const data = await res.json();
      actualizarLogo(data.logo);
      setMensaje("¡Logo actualizado con éxito!");
      await recargarLogo();

      setPreview(null);
      setSelectedFile(null);
    } catch {
      setMensaje("Ocurrió un error al subir el logo");
    } finally {
      setLoading(false);
    }
  };

  const imagenActual = preview || logo.url;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 w-full max-w-lg text-left">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Recuadro de Vista Previa con la imagen centrada */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
            Vista previa{" "}
            {preview && (
              <span className="text-emerald-600 font-bold">
                (Nuevo archivo seleccionado)
              </span>
            )}
          </label>

          <div className="h-28 w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center p-4">
            {imagenActual ? (
              <img
                src={imagenActual}
                alt="Vista previa del logo"
                className="max-h-20 w-auto max-w-full object-contain filter drop-shadow-sm"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-1 text-xs">
                <ImageIcon size={24} />
                <span>Sin imagen cargada</span>
              </div>
            )}
          </div>
        </div>

        {/* Selector de Archivo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
            Seleccionar archivo (PNG, SVG, JPG)
          </label>
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            onChange={handleFileChange}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0c4078] file:text-white hover:file:bg-[#092e57] file:cursor-pointer cursor-pointer border border-slate-200 rounded-md"
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
          className="flex items-center justify-center gap-2 bg-[#0c4078] hover:bg-[#092e57] text-white py-2.5 px-6 rounded-md text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <UploadCloud size={16} />
          {loading ? "Subiendo imagen..." : "Guardar y Publicar Logo"}
        </button>
      </form>
    </div>
  );
}
