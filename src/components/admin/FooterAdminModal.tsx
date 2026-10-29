"use client";

import React, { useState, useRef } from "react";
import { useConfig } from "@/context/ConfigContext";
import { FooterConfigData } from "@/types";
import {
  UploadCloud,
  Check,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";

interface FooterAdminFormProps {
  initialConfig: FooterConfigData | null;
  onSaved: () => Promise<void>;
  notificarCambio: () => void;
}

function FooterAdminForm({
  initialConfig,
  onSaved,
  notificarCambio,
}: FooterAdminFormProps) {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string>(
    initialConfig?.imagenUrl || "",
  );
  const [visible, setVisible] = useState(
    initialConfig ? initialConfig.visible !== false : true,
  );

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      let finalImageUrl = initialConfig?.imagenUrl || "";

      // 1. Si seleccionó un archivo nuevo desde el equipo, subirlo
      if (archivoSeleccionado) {
        const formData = new FormData();
        formData.append("file", archivoSeleccionado);

        const uploadRes = await fetch("/api/configuracion/footer/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok)
          throw new Error(uploadData.error || "Error al subir imagen");
        finalImageUrl = uploadData.footer.imagenUrl;
      }

      // 2. Guardar configuración completa en base de datos
      const resConfig = await fetch("/api/configuracion/footer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagenUrl: finalImageUrl,
          direccion: initialConfig?.direccion,
          rif: initialConfig?.rif,
          textoCopyright: initialConfig?.textoCopyright,
          visible,
        }),
      });

      const configData = await resConfig.json();
      if (!resConfig.ok)
        throw new Error(configData.error || "Error al guardar");

      await onSaved();
      notificarCambio();

      setArchivoSeleccionado(null);
      setPreviewUrl(finalImageUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMensaje("¡Pie de página actualizado y sincronizado en vivo!");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "No se pudo actualizar";
      setMensaje(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 w-full max-w-3xl text-left space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp, image/svg+xml"
          className="hidden"
        />

        {/* Zona de Cintillo / Imagen */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            Cintillo Institucional del Pie de Página
          </label>

          {previewUrl && !archivoSeleccionado ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:max-w-md h-20 bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-center overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Cintillo actual"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-[#0c4078] bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition cursor-pointer shrink-0"
              >
                <RefreshCw size={14} />
                Cambiar cintillo
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 hover:border-[#0c4078] bg-slate-50/60 hover:bg-blue-50/20 rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500">
                <UploadCloud size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Haz clic para seleccionar el cintillo o arrástralo aquí
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Formatos recomendados: PNG transparente o SVG panorámico
                </p>
              </div>

              {archivoSeleccionado && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-[#0c4078] text-xs font-semibold rounded-full mt-2">
                  <ImageIcon size={14} /> Cintillo preparado:{" "}
                  {archivoSeleccionado.name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Visibilidad */}
        <div>
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
                ? "Pie de página VISIBLE en el portal"
                : "Pie de página OCULTO"}
            </span>
          </button>
        </div>

        {mensaje && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <Check size={16} /> {mensaje}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 rounded-md text-sm font-bold text-white bg-[#0c4078] hover:bg-[#092e57] transition disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Save size={16} />
          {loading ? "Guardando..." : "Guardar y Publicar Pie de Página"}
        </button>
      </form>
    </div>
  );
}

export function FooterAdminModal() {
  const { footerConfig, recargarFooterConfig, notificarCambioFooter } =
    useConfig();

  const configKey = footerConfig
    ? `${footerConfig.imagenUrl || ""}-${footerConfig.visible}`
    : "pending";

  return (
    <FooterAdminForm
      key={configKey}
      initialConfig={footerConfig}
      onSaved={recargarFooterConfig}
      notificarCambio={notificarCambioFooter}
    />
  );
}

export default FooterAdminModal;
