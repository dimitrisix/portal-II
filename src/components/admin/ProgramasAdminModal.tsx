"use client";

import React, { useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import { ProgramaData } from "@/types";
import {
  Check,
  UploadCloud,
  Trash2,
  Edit2,
  XCircle,
  PlusCircle,
  Newspaper,
} from "lucide-react";

export function ProgramasAdminModal() {
  const {
    programas,
    recargarProgramas,
    actualizarProgramas,
    notificarCambioProgramas,
  } = useConfig();

  // ID del programa en edición (null = modo creación)
  const [editingId, setEditingId] = useState<number | null>(null);

  const [titulo, setTitulo] = useState("");
  const [resumen, setResumen] = useState("");
  const [contenido, setContenido] = useState("");
  const [fecha, setFecha] = useState("");
  const [enlaceUrl, setEnlaceUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Iniciar edición de un programa existente
  const handleIniciarEdicion = (prog: ProgramaData) => {
    setEditingId(prog.id);
    setTitulo(prog.titulo);
    setResumen(prog.resumen);
    setContenido(prog.contenido || "");
    setFecha(prog.fecha);
    setEnlaceUrl(prog.enlaceUrl || "");
    setPreview(prog.imagenUrl);
    setSelectedFile(null);
    setMensaje(null);

    // Desplazamiento suave al formulario
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancelar edición y limpiar formulario
  const handleCancelarEdicion = () => {
    setEditingId(null);
    setTitulo("");
    setResumen("");
    setContenido("");
    setFecha("");
    setEnlaceUrl("");
    setPreview(null);
    setSelectedFile(null);
    setMensaje(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !resumen) return;

    setLoading(true);
    setMensaje(null);

    const formData = new FormData();
    if (editingId) {
      formData.append("id", editingId.toString());
    }
    formData.append("titulo", titulo);
    formData.append("resumen", resumen);
    formData.append("contenido", contenido);
    formData.append("fecha", fecha);
    formData.append("enlaceUrl", enlaceUrl);
    if (selectedFile) {
      formData.append("imagen", selectedFile);
    }

    try {
      const res = await fetch("/api/configuracion/programas", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar en el servidor");
      }

      const progGuardado: ProgramaData = data.programa;
      let listaActualizada: ProgramaData[] = [];

      if (editingId) {
        listaActualizada = programas.map((p) =>
          p.id === progGuardado.id ? { ...p, ...progGuardado } : p,
        );
      } else {
        listaActualizada = [progGuardado, ...programas];
      }

      // 1. Actualizar estado local inmediatamente
      actualizarProgramas(listaActualizada);

      // 2. Notificar inmediatamente a las demás pestañas y componentes
      notificarCambioProgramas(listaActualizada);

      // 3. Forzar revalidación con el servidor en segundo plano
      void recargarProgramas(true);

      setMensaje(
        editingId
          ? "¡Programa editado y actualizado con éxito!"
          : "¡Programa publicado con éxito!",
      );
      handleCancelarEdicion();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "No se pudo guardar el programa";
      setMensaje(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Deseas eliminar este programa?")) return;

    try {
      const res = await fetch(`/api/configuracion/programas?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar");
      }

      if (editingId === id) handleCancelarEdicion();
      const listaActualizada = programas.filter((p) => p.id !== id);
      actualizarProgramas(listaActualizada);
      notificarCambioProgramas(listaActualizada);
      void recargarProgramas(true);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error desconocido al eliminar";
      alert(`Error al eliminar: ${errorMsg}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 w-full max-w-4xl text-left space-y-6">
      {/* Formulario (Creación / Edición) */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 pb-6 border-b border-slate-200"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
            {editingId ? (
              <>
                <Edit2 size={16} className="text-amber-600" />
                <span>Editando Programa #{editingId}</span>
              </>
            ) : (
              <>
                <PlusCircle size={16} className="text-[#0c4078]" />
                <span>Crear Nuevo Programa / Noticia</span>
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
              Título
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Jornada de abastecimiento alimentario..."
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
              placeholder="Ej: 21 ene. 2026 (por defecto hoy)"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-[#0c4078]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Resumen / Bajada (Tarjeta Principal)
          </label>
          <textarea
            required
            rows={2}
            placeholder="Breve texto descriptivo para la tarjeta del portal..."
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-[#0c4078]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase">
              Contenido Completo de la Noticia / Programa (Opcional)
            </label>
            <span className="text-[11px] text-slate-400">
              Soporta enlaces automáticos (https://...) y [Texto](url)
            </span>
          </div>
          <textarea
            rows={6}
            placeholder="Escribe aquí los párrafos y la información detallada que se verá al abrir la noticia. Puedes incluir enlaces como https://ejemplo.com o [Visitar sitio](https://ejemplo.com)..."
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-[#0c4078]"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Cualquier link o dirección web en el texto se convertirá automáticamente en un enlace interactivo al publicarse.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {editingId
                ? "Reemplazar Imagen (Opcional)"
                : "Imagen (JPG, PNG, WebP)"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0c4078] file:text-white hover:file:bg-[#092e57] cursor-pointer border border-slate-200 rounded-md"
            />
            {preview && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-20 w-32 bg-slate-100 rounded border overflow-hidden">
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-[11px] text-slate-400">
                  {selectedFile
                    ? "(Nueva imagen seleccionada)"
                    : "(Imagen actual guardada)"}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Enlace Externo Opcional (Si no se desea la vista interna)
            </label>
            <input
              type="text"
              placeholder="Ej: https://... (dejar vacío para usar la vista detallada)"
              value={enlaceUrl}
              onChange={(e) => setEnlaceUrl(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-[#0c4078]"
            />
          </div>
        </div>

        {mensaje && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs font-medium text-emerald-700 flex items-center gap-1.5">
            <Check size={15} /> {mensaje}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !titulo || !resumen}
            className={`flex items-center gap-2 py-2.5 px-6 rounded-md text-sm font-semibold text-white transition disabled:opacity-50 cursor-pointer ${
              editingId
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-[#0c4078] hover:bg-[#092e57]"
            }`}
          >
            <UploadCloud size={16} />
            {loading
              ? "Guardando..."
              : editingId
                ? "Actualizar Cambios"
                : "Publicar Programa"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelarEdicion}
              className="py-2.5 px-4 rounded-md text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Lista de Programas Publicados */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
          Programas Publicados ({programas.length})
        </h2>

        {programas.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs flex flex-col items-center gap-2">
            <Newspaper size={32} />
            <span>No hay programas registrados aún.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {programas.map((prog) => {
              const estaEnEdicion = editingId === prog.id;

              return (
                <div
                  key={prog.id}
                  className={`p-3.5 flex items-center justify-between gap-4 transition ${
                    estaEnEdicion
                      ? "bg-amber-50/70 border-l-4 border-amber-500"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prog.imagenUrl}
                      alt={prog.titulo}
                      className="w-14 h-14 object-cover rounded-sm shrink-0 border"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 font-medium">
                        {prog.fecha}
                      </p>
                      <h4 className="text-sm font-bold text-slate-800 truncate uppercase">
                        {prog.titulo}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {prog.resumen}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleIniciarEdicion(prog)}
                      title="Editar programa"
                      className="text-amber-600 hover:text-amber-800 p-2 rounded hover:bg-amber-100/60 transition cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEliminar(prog.id)}
                      title="Eliminar programa"
                      className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
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
