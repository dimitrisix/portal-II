"use client";

import React, { useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import { ContactoItemData } from "@/types";
import {
  Check,
  PlusCircle,
  Edit2,
  Trash2,
  XCircle,
  FileText,
  AlignLeft,
} from "lucide-react";
import { renderTextWithLinks } from "@/lib/renderTextWithLinks";

export function ContactosAdminModal() {
  const { contactosItems, recargarContactosItems, notificarCambioContactos } =
    useConfig();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [tipo, setTipo] = useState("DISCURSO");
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [orden, setOrden] = useState(0);

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const handleIniciarEdicion = (item: ContactoItemData) => {
    setEditingId(item.id);
    setTipo(item.tipo);
    setTitulo(item.titulo);
    setContenido(item.contenido || "");
    setOrden(item.orden || 0);
    setMensaje(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelarEdicion = () => {
    setEditingId(null);
    setTipo("DISCURSO");
    setTitulo("");
    setContenido("");
    setOrden(0);
    setMensaje(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo || !titulo || !contenido) return;

    setLoading(true);
    setMensaje(null);

    try {
      const res = await fetch("/api/configuracion/contactos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          tipo,
          titulo,
          contenido,
          orden,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      await recargarContactosItems();
      notificarCambioContactos();

      setMensaje(
        editingId
          ? "¡Elemento actualizado con éxito!"
          : "¡Elemento agregado con éxito!",
      );
      handleCancelarEdicion();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "No se pudo guardar";
      setMensaje(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Deseas eliminar este elemento de contactos?")) return;

    try {
      const res = await fetch(`/api/configuracion/contactos?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");

      if (editingId === id) handleCancelarEdicion();
      await recargarContactosItems();
      notificarCambioContactos();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      alert(`Error al eliminar: ${errorMessage}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 w-full max-w-4xl text-left space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 pb-6 border-b border-slate-200"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
            {editingId ? (
              <>
                <Edit2 size={16} className="text-amber-600" />
                <span>Editando Elemento #{editingId}</span>
              </>
            ) : (
              <>
                <PlusCircle size={16} className="text-[#0c4078]" />
                <span>Agregar Registro a Sección Contactos</span>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Tipo / Categoría
            </label>
            <input
              type="text"
              required
              placeholder="DISCURSO, DOCUMENTO, TRÍPTICO..."
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-[#0c4078] uppercase"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Título Principal
            </label>
            <input
              type="text"
              required
              placeholder="Ej: INTERVENCIÓN DE VENEZUELA ANTE LA 60ª SESIÓN..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-[#0c4078] uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Posición / Orden
            </label>
            <input
              type="number"
              value={orden}
              onChange={(e) => setOrden(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-[#0c4078]"
            />
          </div>
        </div>

        {/* Campo de Información referente al título */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase flex items-center gap-1.5">
              <AlignLeft size={14} className="text-[#0c4078]" />
              Información referente al título
            </label>
            <span className="text-[11px] text-slate-400">
              Soporta enlaces automáticos (https://...) y [Texto](url)
            </span>
          </div>
          <textarea
            required
            rows={4}
            placeholder="Escriba aquí los detalles, texto informativo, acuerdos o puntos clave... Puede incluir enlaces directos como https://ejemplo.com o en formato [Visitar sitio](https://ejemplo.com)..."
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3.5 py-2.5 text-sm focus:outline-[#0c4078] leading-relaxed"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Cualquier link o dirección web colocado en el texto se convertirá automáticamente en un enlace interactivo al hacer clic.
          </p>
        </div>

        {mensaje && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs font-medium text-emerald-700 flex items-center gap-1.5">
            <Check size={15} /> {mensaje}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !tipo || !titulo || !contenido}
            className={`flex items-center gap-2 py-2.5 px-6 rounded-md text-sm font-semibold text-white transition disabled:opacity-50 cursor-pointer ${
              editingId
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-[#0c4078] hover:bg-[#092e57]"
            }`}
          >
            <FileText size={16} />
            {loading
              ? "Guardando..."
              : editingId
                ? "Actualizar Registro"
                : "Guardar Registro"}
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

      {/* Lista existente */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
          Elementos Registrados ({contactosItems.length})
        </h2>

        {contactosItems.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
            No hay registros creados aún.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {contactosItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 flex items-start justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#0c4078] uppercase">
                      {item.tipo}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded">
                      Orden: {item.orden ?? 0}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase mt-0.5">
                    {item.titulo}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {renderTextWithLinks(item.contenido)}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => handleIniciarEdicion(item)}
                    className="text-amber-600 hover:text-amber-800 p-2 rounded hover:bg-amber-50 cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminar(item.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContactosAdminModal;
