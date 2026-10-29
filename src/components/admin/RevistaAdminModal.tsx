"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useConfig } from "@/context/ConfigContext";
import { RevistaReaderModal } from "@/components/RevistaReaderModal";
import { RevistaConfigData } from "@/types";
import {
  UploadCloud,
  FileText,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  BookOpen,
  Image as ImageIcon,
  Calendar,
  Layers,
  RefreshCw,
  Maximize2,
  PlusCircle,
  Edit2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Award,
} from "lucide-react";

export function RevistaAdminModal() {
  const {
    revistas,
    actualizarRevistas,
    notificarCambioRevista,
  } = useConfig();

  // Lista local de todas las revistas (incluidas inactivas)
  const [listaRevistas, setListaRevistas] = useState<RevistaConfigData[]>([]);
  const [loadingLista, setLoadingLista] = useState(false);

  // Modo formulario: null = Crear nueva edición; number = Editar edición existente
  const [editingId, setEditingId] = useState<number | null>(null);

  // Campos del formulario
  const [titulo, setTitulo] = useState("Revista Institucional");
  const [subtitulo, setSubtitulo] = useState("Edición Digital");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [orden, setOrden] = useState<number>(0);
  const [habilitado, setHabilitado] = useState(true);

  // Archivos seleccionados
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");
  const [nombreArchivo, setNombreArchivo] = useState<string>("");
  const [tamanoArchivo, setTamanoArchivo] = useState<string>("");

  const [archivoPortada, setArchivoPortada] = useState<File | null>(null);
  const [portadaPreviewUrl, setPortadaPreviewUrl] = useState<string>("");
  const [modoPortada, setModoPortada] = useState<"primera_pagina" | "personalizada">("primera_pagina");
  const [eliminarPortada, setEliminarPortada] = useState(false);

  // Estados de proceso y feedback
  const [loading, setLoading] = useState(false);
  const [loadingToggleId, setLoadingToggleId] = useState<number | null>(null);
  const [loadingReorder, setLoadingReorder] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState<number | null>(null);
  const [bytesSubidos, setBytesSubidos] = useState<number>(0);
  const [bytesTotales, setBytesTotales] = useState<number>(0);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Modal lector en pantalla completa para previsualizar cualquier edición
  const [readerEdicion, setReaderEdicion] = useState<RevistaConfigData | null>(null);
  const [isModalLectorAbierto, setIsModalLectorAbierto] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const portadaInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Cargar todas las ediciones desde el backend (incluyendo inactivas)
  const cargarTodasLasRevistas = useCallback(async () => {
    setLoadingLista(true);
    try {
      const res = await fetch(`/api/configuracion/revista?all=true&t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.revistas)) {
          setListaRevistas(data.revistas);
          actualizarRevistas(data.revistas);
        } else if (Array.isArray(data)) {
          setListaRevistas(data);
          actualizarRevistas(data);
        }
      }
    } catch {
      // Ignorar errores transitorios
    } finally {
      setLoadingLista(false);
    }
  }, [actualizarRevistas]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void cargarTodasLasRevistas();
    }, 0);
    return () => clearTimeout(timer);
  }, [cargarTodasLasRevistas]);

  // Sincronizar lista si cambia en el contexto global
  useEffect(() => {
    if (Array.isArray(revistas) && revistas.length > 0) {
      const timer = setTimeout(() => {
        setListaRevistas(revistas);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [revistas]);

  // Iniciar la edición de una revista específica
  const handleIniciarEdicion = (edicion: RevistaConfigData) => {
    if (!edicion.id) return;
    setEditingId(edicion.id);
    setTitulo(edicion.titulo || "Revista Institucional");
    setSubtitulo(edicion.subtitulo || "");
    setDescripcion(edicion.descripcion || "");
    setFecha(edicion.fecha || "");
    setOrden(edicion.orden ?? 0);
    setHabilitado(Boolean(edicion.habilitado));

    setArchivoPdf(null);
    setPdfPreviewUrl(edicion.archivoUrl || "");
    setNombreArchivo(edicion.nombreArchivo || "");
    setTamanoArchivo(edicion.tamanoArchivo || "");

    setArchivoPortada(null);
    setPortadaPreviewUrl(edicion.portadaUrl || "");
    setModoPortada(edicion.portadaUrl ? "personalizada" : "primera_pagina");
    setEliminarPortada(false);

    setMensajeError(null);
    setMensajeExito(`Cargada la edición "${edicion.titulo}" en el editor.`);

    // Desplazamiento suave al formulario
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Limpiar formulario y volver al modo crear
  const handleLimpiarFormulario = () => {
    setEditingId(null);
    setTitulo("Revista Institucional");
    setSubtitulo("Edición Digital");
    setDescripcion("");
    setFecha("");
    setOrden(listaRevistas.length);
    setHabilitado(true);

    setArchivoPdf(null);
    setPdfPreviewUrl("");
    setNombreArchivo("");
    setTamanoArchivo("");

    setArchivoPortada(null);
    setPortadaPreviewUrl("");
    setModoPortada("primera_pagina");
    setEliminarPortada(false);

    setMensajeError(null);
    setMensajeExito(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    if (portadaInputRef.current) portadaInputRef.current.value = "";
  };

  // Manejador de selección de archivo PDF
  const handlePdfChange = (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setMensajeError("El archivo seleccionado debe ser un documento PDF válido.");
      return;
    }

    if (file.size > 1024 * 1024 * 1024) {
      setMensajeError("El archivo PDF supera el límite máximo de 1 GB (1024 MB).");
      return;
    }

    setArchivoPdf(file);
    const objectUrl = URL.createObjectURL(file);
    setPdfPreviewUrl(objectUrl);
    setNombreArchivo(file.name);

    const formattedSize =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
    setTamanoArchivo(formattedSize);

    setMensajeError(null);
    setMensajeExito(
      `Documento PDF (${formattedSize}) cargado en memoria. Haz clic en 'Guardar Edición' para confirmar.`,
    );
  };

  // Manejador de selección de Portada
  const handlePortadaChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMensajeError("La portada debe ser un archivo de imagen válido (JPG, PNG o WEBP).");
      return;
    }

    setArchivoPortada(file);
    setPortadaPreviewUrl(URL.createObjectURL(file));
    setModoPortada("personalizada");
    setEliminarPortada(false);
    setMensajeError(null);
  };

  // Cambio rápido del interruptor Habilitar/Inhabilitar de cualquier edición
  const handleToggleHabilitadoRapido = async (edicion: RevistaConfigData) => {
    if (!edicion.id) return;
    const nuevoEstado = !edicion.habilitado;
    setLoadingToggleId(edicion.id);
    setMensajeError(null);
    setMensajeExito(null);

    try {
      const response = await fetch("/api/configuracion/revista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: edicion.id,
          habilitado: nuevoEstado,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar el estado de la edición");
      }

      const listaActualizada = listaRevistas.map((item) =>
        item.id === edicion.id ? { ...item, habilitado: nuevoEstado } : item,
      );
      setListaRevistas(listaActualizada);
      actualizarRevistas(listaActualizada);
      notificarCambioRevista(listaActualizada);

      setMensajeExito(
        nuevoEstado
          ? `Edición "${edicion.titulo}" HABILITADA en el portal.`
          : `Edición "${edicion.titulo}" INHABILITADA en el portal.`,
      );
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : "Error al cambiar estado");
    } finally {
      setLoadingToggleId(null);
    }
  };

  // Reordenar publicaciones (Subir / Bajar / Hacer Primera)
  const handleMoverEdicion = async (origenIndex: number, destinoIndex: number) => {
    if (
      origenIndex < 0 ||
      origenIndex >= listaRevistas.length ||
      destinoIndex < 0 ||
      destinoIndex >= listaRevistas.length ||
      origenIndex === destinoIndex
    ) {
      return;
    }

    setLoadingReorder(true);
    setMensajeError(null);

    const nuevaLista = [...listaRevistas];
    const [movida] = nuevaLista.splice(origenIndex, 1);
    nuevaLista.splice(destinoIndex, 0, movida);

    // Asignar orden numérico correlativo (0 = 1ª, 1 = 2ª, etc.)
    const itemsConOrden = nuevaLista.map((item, idx) => ({
      ...item,
      orden: idx,
    }));

    setListaRevistas(itemsConOrden);
    actualizarRevistas(itemsConOrden);

    try {
      const res = await fetch("/api/configuracion/revista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          items: itemsConOrden.map((it) => ({ id: it.id, orden: it.orden })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar el nuevo orden");
      }

      notificarCambioRevista(itemsConOrden);
      setMensajeExito(
        destinoIndex === 0
          ? `¡"${movida.titulo}" ahora es la 1ª Revista (Destacada Principal)!`
          : `"${movida.titulo}" movida a la posición #${destinoIndex + 1}.`,
      );
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : "Error al reordenar");
      await cargarTodasLasRevistas();
    } finally {
      setLoadingReorder(false);
    }
  };

  // Eliminar una edición
  const handleEliminarRevista = async (edicion: RevistaConfigData) => {
    if (!edicion.id) return;
    if (
      !confirm(
        `¿Confirmas que deseas eliminar la edición "${edicion.titulo}"? Esta acción borrará el archivo PDF del servidor.`,
      )
    ) {
      return;
    }

    setLoading(true);
    setMensajeError(null);
    setMensajeExito(null);

    try {
      const res = await fetch(`/api/configuracion/revista?id=${edicion.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar la edición");
      }

      const listaFiltrada = listaRevistas.filter((r) => r.id !== edicion.id);
      setListaRevistas(listaFiltrada);
      actualizarRevistas(listaFiltrada);
      notificarCambioRevista(listaFiltrada);

      if (editingId === edicion.id) {
        handleLimpiarFormulario();
      }

      setMensajeExito(`Edición "${edicion.titulo}" eliminada con éxito.`);
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : "Error al eliminar la revista");
    } finally {
      setLoading(false);
    }
  };

  // Guardar formulario completo con monitoreo XHR de subida para archivos pesados
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      setMensajeError("El título de la revista es obligatorio.");
      return;
    }

    if (!editingId && !archivoPdf) {
      setMensajeError("Debes adjuntar un archivo PDF para crear una nueva edición.");
      return;
    }

    setLoading(true);
    setProgresoSubida(archivoPdf ? 0 : null);
    setBytesSubidos(0);
    setBytesTotales(archivoPdf ? archivoPdf.size : 0);
    setMensajeExito(null);
    setMensajeError(null);

    try {
      const formData = new FormData();
      if (editingId) {
        formData.append("id", editingId.toString());
      }
      formData.append("titulo", titulo);
      formData.append("subtitulo", subtitulo);
      formData.append("descripcion", descripcion);
      formData.append("fecha", fecha);
      formData.append("orden", orden.toString());
      formData.append("habilitado", habilitado ? "true" : "false");

      if (archivoPdf) {
        formData.append("file", archivoPdf);
      }

      if (modoPortada === "primera_pagina") {
        formData.append("eliminarPortada", "true");
      } else {
        if (archivoPortada) {
          formData.append("portada", archivoPortada);
        }
        if (eliminarPortada) {
          formData.append("eliminarPortada", "true");
        }
      }

      // Transmisión asíncrona monitoreada con XHR
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/configuracion/revista");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgresoSubida(percentComplete);
            setBytesSubidos(event.loaded);
            setBytesTotales(event.total);
          }
        };

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const resJson = JSON.parse(xhr.responseText);
              reject(new Error(resJson.error || `Error ${xhr.status} al guardar`));
            } catch {
              reject(new Error(`Error del servidor (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => {
          reject(
            new Error("Error de red durante la transferencia del archivo. Comprueba la conexión."),
          );
        };

        xhr.send(formData);
      });

      await cargarTodasLasRevistas();
      notificarCambioRevista();

      setMensajeExito(
        editingId
          ? `¡Edición "${titulo}" actualizada con éxito!`
          : `¡Nueva edición "${titulo}" publicada con éxito!`,
      );

      handleLimpiarFormulario();
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : "Error inesperado al guardar");
    } finally {
      setLoading(false);
      setProgresoSubida(null);
    }
  };

  const activasCount = listaRevistas.filter((r) => r.habilitado).length;

  return (
    <div className="space-y-8 select-none">
      {/* 1. MASTER BANNER INFORMATIVO Y RESUMEN DE EDICIONES */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#082444] via-[#0c4078] to-[#0a3563] text-white border border-blue-400/20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e62020] text-[10px] font-black uppercase tracking-wider">
                Catálogo Digital
              </span>
              <span className="text-xs text-blue-200 font-semibold">
                Gestor Multi-Revista
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Revistas Institucionales en el Portal
            </h2>
            <p className="text-xs sm:text-sm text-blue-200/90 max-w-2xl">
              Administra todas las publicaciones y ediciones disponibles. Los visitantes podrán
              leer cada número en línea, descargarlo y hojear la biblioteca institucional.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleLimpiarFormulario}
              className="px-4 py-2.5 rounded-xl bg-[#e62020] hover:bg-[#c91818] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <PlusCircle size={16} />
              <span>Nueva Edición</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
              title="Abrir el portal público en una nueva pestaña"
            >
              <ExternalLink size={15} />
              <span>Ver Portal</span>
            </a>
          </div>
        </div>

        {/* Tarjetas de Métricas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-5 mt-5 border-t border-white/15">
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-blue-200 uppercase font-bold block">
              Total Ediciones
            </span>
            <span className="text-2xl font-black text-white">{listaRevistas.length}</span>
          </div>

          <div className="bg-emerald-500/20 rounded-xl p-3 border border-emerald-400/30">
            <span className="text-[11px] text-emerald-200 uppercase font-bold block">
              Activas en Portal
            </span>
            <span className="text-2xl font-black text-emerald-300">{activasCount}</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-300 uppercase font-bold block">
              Inactivas / Borrador
            </span>
            <span className="text-2xl font-black text-slate-200">
              {listaRevistas.length - activasCount}
            </span>
          </div>
        </div>
      </div>

      {/* Alertas de Notificación */}
      {mensajeExito && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeExito(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {mensajeError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-red-600 shrink-0" />
            <span>{mensajeError}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeError(null)}
            className="text-red-600 hover:text-red-800 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra de Progreso de Subida en Tiempo Real para archivos de 400MB+ */}
      {progresoSubida !== null && (
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-2">
              <RefreshCw size={15} className="animate-spin text-[#0c4078]" />
              {progresoSubida < 100
                ? "Subiendo archivo PDF al servidor..."
                : "Archivo recibido. Procesando y asegurando documento..."}
            </span>
            <span className="text-sm font-black text-[#0c4078]">{progresoSubida}%</span>
          </div>

          <div className="w-full bg-blue-200/80 rounded-full h-3.5 overflow-hidden">
            <div
              className="bg-[#0c4078] h-full rounded-full transition-all duration-150"
              style={{ width: `${progresoSubida}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-blue-700">
            <span>
              Transferido: {(bytesSubidos / (1024 * 1024)).toFixed(1)} MB de{" "}
              {(bytesTotales / (1024 * 1024)).toFixed(1)} MB
            </span>
            <span>Optimizado para archivos de hasta 1 GB</span>
          </div>
        </div>
      )}

      {/* 2. CATÁLOGO DE EDICIONES REGISTRADAS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0c4078]/10 text-[#0c4078] flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Ediciones Registradas ({listaRevistas.length})
              </h3>
              <p className="text-xs text-slate-500">
                Lista de revistas cargadas en el sistema con su estado de visibilidad
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cargarTodasLasRevistas}
            disabled={loadingLista}
            className="text-xs text-slate-600 hover:text-[#0c4078] font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={13} className={loadingLista ? "animate-spin" : ""} />
            <span>Refrescar</span>
          </button>
        </div>

        {listaRevistas.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <BookOpen size={40} className="mx-auto text-slate-300" />
            <p className="text-sm font-medium">No hay revistas registradas aún.</p>
            <p className="text-xs text-slate-500">
              Utiliza el formulario de abajo para cargar tu primera edición en PDF.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listaRevistas.map((ed, index) => {
              const streamUrl = `/api/revista/pdf?file=${encodeURIComponent(
                ed.archivoUrl || "",
              )}`;
              const esSiendoEditada = editingId === ed.id;

              return (
                <div
                  key={ed.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    esSiendoEditada
                      ? "border-[#0c4078] bg-blue-50/50 ring-2 ring-[#0c4078]/20 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  {/* BARRA SUPERIOR: ORDEN Y CONTROL DE POSICIÓN */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    {index === 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0c4078] text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                        <Award size={12} className="text-amber-300" />
                        <span>1ª • Destacada Principal</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                        <span>Posición #{index + 1}</span>
                      </span>
                    )}

                    {/* Botones para Mover Orden (Subir, Bajar, Hacer 1ª) */}
                    <div className="flex items-center gap-1">
                      {index > 0 && (
                        <button
                          type="button"
                          disabled={loadingReorder}
                          onClick={() => handleMoverEdicion(index, 0)}
                          className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold transition-colors cursor-pointer border border-amber-200"
                          title="Hacer esta edición la 1ª (Destacada Principal del portal)"
                        >
                          Hacer 1ª
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={index === 0 || loadingReorder}
                        onClick={() => handleMoverEdicion(index, index - 1)}
                        className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Subir posición (mostrar antes)"
                      >
                        <ArrowUp size={13} />
                      </button>

                      <button
                        type="button"
                        disabled={index === listaRevistas.length - 1 || loadingReorder}
                        onClick={() => handleMoverEdicion(index, index + 1)}
                        className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Bajar posición (mostrar después)"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {/* Miniatura Portada */}
                    <div className="w-16 h-22 rounded-lg bg-slate-900 border border-slate-300 shrink-0 overflow-hidden relative shadow-xs">
                      {ed.portadaUrl ? (
                        <img
                          src={ed.portadaUrl}
                          alt={ed.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : ed.archivoUrl ? (
                        <div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center">
                          <object
                            data={`${streamUrl}#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                            type="application/pdf"
                            className="w-full h-full border-0 pointer-events-none select-none"
                          >
                            <iframe
                              src={`${streamUrl}#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                              className="w-full h-full border-0 pointer-events-none select-none"
                              title={ed.titulo}
                            />
                          </object>
                          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <FileText size={20} />
                        </div>
                      )}
                    </div>

                    {/* Datos de la edición */}
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ed.habilitado
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {ed.habilitado ? "Visible en Portal" : "Oculta (Borrador)"}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-800 truncate" title={ed.titulo}>
                        {ed.titulo}
                      </h4>
                      {ed.subtitulo && (
                        <p className="text-xs text-slate-500 truncate">{ed.subtitulo}</p>
                      )}
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        {ed.fecha && <span>{ed.fecha}</span>}
                        {ed.tamanoArchivo && <span>• {ed.tamanoArchivo}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción rápida por edición */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
                    {/* Toggle rápido ON/OFF */}
                    <button
                      type="button"
                      disabled={loadingToggleId === ed.id}
                      onClick={() => handleToggleHabilitadoRapido(ed)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        ed.habilitado
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title={ed.habilitado ? "Ocultar en portal" : "Habilitar en portal"}
                    >
                      {loadingToggleId === ed.id ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : ed.habilitado ? (
                        <>
                          <Eye size={13} />
                          <span>Activa</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={13} />
                          <span>Inactiva</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Botón Previsualizar en lector */}
                      {ed.archivoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setReaderEdicion(ed);
                            setIsModalLectorAbierto(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0c4078] hover:bg-slate-100 cursor-pointer"
                          title="Abrir lector interactivo"
                        >
                          <BookOpen size={14} />
                        </button>
                      )}

                      {/* Botón Editar */}
                      <button
                        type="button"
                        onClick={() => handleIniciarEdicion(ed)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0c4078] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Cargar en el editor"
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </button>

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => handleEliminarRevista(ed)}
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-colors"
                        title="Eliminar esta revista"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. FORMULARIO PRINCIPAL: CREAR O EDITAR EDICIÓN */}
      <div ref={formRef} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Cabecera del Editor */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                editingId ? "bg-amber-100 text-amber-800" : "bg-[#0c4078] text-white"
              }`}
            >
              {editingId ? <Edit2 size={20} /> : <PlusCircle size={20} />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                {editingId
                  ? `Editando Edición: "${titulo}"`
                  : "Crear y Publicar Nueva Edición"}
              </h3>
              <p className="text-xs text-slate-500">
                {editingId
                  ? "Modifica los datos o sustituye los archivos de esta edición específica."
                  : "Carga un nuevo documento PDF para agregarlo al catálogo del portal."}
              </p>
            </div>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={handleLimpiarFormulario}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
            >
              <XCircle size={15} />
              <span>Cancelar Edición (Crear Nueva)</span>
            </button>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* COLUMNA IZQUIERDA: ARCHIVO PDF (7 columnas) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText size={17} className="text-[#0c4078]" />
                  <span className="text-sm font-bold text-slate-800">
                    Archivo Documento (PDF)
                  </span>
                </div>

                {pdfPreviewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setReaderEdicion({
                        titulo,
                        subtitulo,
                        archivoUrl: archivoPdf ? pdfPreviewUrl : pdfPreviewUrl,
                        nombreArchivo,
                        habilitado: true,
                      });
                      setIsModalLectorAbierto(true);
                    }}
                    className="text-xs text-[#0c4078] hover:text-[#e62020] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 size={13} />
                    <span>Lector Completo</span>
                  </button>
                )}
              </div>

              {/* Zona Drag & Drop / Input File */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handlePdfChange(file);
                }}
                onClick={() => pdfInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  pdfPreviewUrl
                    ? "border-blue-300 bg-blue-50/30 hover:bg-blue-50/60"
                    : "border-slate-300 hover:border-[#0c4078] hover:bg-slate-50/60"
                }`}
              >
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePdfChange(file);
                  }}
                />

                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0c4078]/10 text-[#0c4078] flex items-center justify-center">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {archivoPdf
                        ? "Nuevo archivo PDF listo para subir"
                        : pdfPreviewUrl
                        ? "Haz clic para sustituir el archivo PDF actual"
                        : "Haz clic o arrastra aquí el archivo PDF de la revista"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Admite documentos pesados de alta resolución (sin restricciones de tamaño, 400 MB o más)
                    </p>
                  </div>
                </div>
              </div>

              {/* Ficha de Información del Archivo Actual */}
              {pdfPreviewUrl && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {nombreArchivo || "Revista_Institucional.pdf"}
                      </p>
                      {tamanoArchivo && (
                        <p className="text-slate-500 text-[11px]">Tamaño: {tamanoArchivo}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={archivoPdf ? pdfPreviewUrl : `/api/revista/pdf?file=${encodeURIComponent(pdfPreviewUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-[#0c4078] hover:bg-slate-200 transition-colors"
                      title="Abrir en pestaña nueva"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              )}

              {/* Visor en vivo del PDF */}
              {pdfPreviewUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Eye size={14} className="text-[#0c4078]" />
                      Visualización en Vivo del Documento
                    </span>
                    <span className="text-slate-400">Transmisión optimizada por fragmentos</span>
                  </div>

                  <div className="relative w-full h-[380px] rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
                    <object
                      data={`${archivoPdf ? pdfPreviewUrl : `/api/revista/pdf?file=${encodeURIComponent(pdfPreviewUrl)}`}#toolbar=1&navpanes=1&view=FitH`}
                      type="application/pdf"
                      className="w-full h-full border-0 bg-slate-800"
                    >
                      <iframe
                        src={`${archivoPdf ? pdfPreviewUrl : `/api/revista/pdf?file=${encodeURIComponent(pdfPreviewUrl)}`}#toolbar=1&navpanes=1&view=FitH`}
                        className="w-full h-full border-0 bg-slate-800"
                        title="Visualizador de Revista PDF"
                      />
                    </object>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: DATOS EDITORIALES, PORTADA Y ESTADO (5 columnas) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Interruptor Habilitado */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase block tracking-wider">
                    Estado en el Portal
                  </span>
                  <span className="text-xs text-slate-500">
                    {habilitado
                      ? "Esta edición será visible en el portal público"
                      : "Esta edición permanecerá oculta como borrador"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setHabilitado(!habilitado)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    habilitado ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      habilitado ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Título de la Revista */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Título de la Edición *
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Revista Institucional Edición 15"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0c4078]/20 focus:border-[#0c4078] transition-all font-semibold"
                />
              </div>

              {/* Subtítulo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Subtítulo / Lema de la Edición
                </label>
                <input
                  type="text"
                  value={subtitulo}
                  onChange={(e) => setSubtitulo(e.target.value)}
                  placeholder="Ej: Soberanía Alimentaria y Poder Popular"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0c4078]/20 focus:border-[#0c4078] transition-all"
                />
              </div>

              {/* Fila: Fecha y Orden */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Fecha / Mes
                  </label>
                  <div className="relative">
                    <Calendar
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      placeholder="Ej: Noviembre 2026"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0c4078]/20 focus:border-[#0c4078] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Posición en el Portal
                  </label>
                  <div className="relative">
                    <select
                      value={orden}
                      onChange={(e) => setOrden(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0c4078]/20 focus:border-[#0c4078] transition-all bg-white font-medium cursor-pointer"
                    >
                      <option value={0}>1ª Posición (⭐ Edición Destacada Principal)</option>
                      {Array.from({ length: Math.max(listaRevistas.length + 1, 6) }).map((_, i) => {
                        if (i === 0) return null;
                        return (
                          <option key={i} value={i}>
                            Posición #{i + 1}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Resumen / Descripción */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Resumen Editorial
                </label>
                <textarea
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Breve reseña sobre los temas, artículos o logros presentados en este número..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0c4078]/20 focus:border-[#0c4078] transition-all resize-y"
                />
              </div>

              {/* OPCIÓN DE PORTADA: 1ª HOJA DEL PDF vs IMAGEN PERSONALIZADA */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Diseño de Portada (Relieve 3D)
                </label>

                {/* Selector de Modo */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModoPortada("primera_pagina");
                      setEliminarPortada(true);
                      setArchivoPortada(null);
                      setPortadaPreviewUrl("");
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      modoPortada === "primera_pagina"
                        ? "border-[#0c4078] bg-blue-50/70 ring-2 ring-[#0c4078]/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 block">1ª Hoja PDF</span>
                    <span className="text-[10px] text-blue-700 font-semibold">Automático</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModoPortada("personalizada");
                      setEliminarPortada(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      modoPortada === "personalizada"
                        ? "border-[#0c4078] bg-blue-50/70 ring-2 ring-[#0c4078]/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 block">Imagen Propia</span>
                    <span className="text-[10px] text-purple-700 font-semibold">Personalizada</span>
                  </button>
                </div>

                {modoPortada === "primera_pagina" ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="text-slate-600">
                      Se tomará automáticamente la primera página del documento PDF como portada 3D.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => portadaInputRef.current?.click()}
                        className="w-20 aspect-[1/1.42] rounded-lg border-2 border-dashed border-slate-300 hover:border-[#0c4078] flex items-center justify-center p-1 text-center cursor-pointer shrink-0 bg-white overflow-hidden relative"
                      >
                        <input
                          ref={portadaInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePortadaChange(file);
                          }}
                        />
                        {portadaPreviewUrl && !eliminarPortada ? (
                          <img
                            src={portadaPreviewUrl}
                            alt="Portada personalizada"
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-400">
                            <ImageIcon size={18} />
                            <span className="text-[9px] font-bold">Subir</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 min-w-0">
                        <p className="font-semibold text-slate-800">
                          {portadaPreviewUrl && !eliminarPortada
                            ? "Imagen cargada"
                            : "Selecciona imagen vertical"}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          JPG, PNG o WEBP (proporción vertical 1:1.42).
                        </p>
                        {portadaPreviewUrl && !eliminarPortada && (
                          <button
                            type="button"
                            onClick={() => {
                              setEliminarPortada(true);
                              setArchivoPortada(null);
                              setPortadaPreviewUrl("");
                              if (portadaInputRef.current) portadaInputRef.current.value = "";
                            }}
                            className="text-[11px] text-red-600 font-bold hover:underline cursor-pointer"
                          >
                            Quitar imagen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de Enviar Formulario */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleLimpiarFormulario}
                    className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0c4078] hover:bg-[#082a52] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>{editingId ? "Actualizando..." : "Publicando..."}</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{editingId ? "Guardar Cambios" : "Publicar Edición"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Visor Modal de Previsualización */}
      {readerEdicion && (
        <RevistaReaderModal
          isOpen={isModalLectorAbierto}
          onClose={() => {
            setIsModalLectorAbierto(false);
            setReaderEdicion(null);
          }}
          archivoUrl={
            readerEdicion.archivoUrl?.startsWith("blob:")
              ? readerEdicion.archivoUrl
              : `/api/revista/pdf?file=${encodeURIComponent(readerEdicion.archivoUrl || "")}`
          }
          titulo={readerEdicion.titulo || "Revista Institucional"}
          subtitulo={readerEdicion.subtitulo}
          nombreArchivo={readerEdicion.nombreArchivo}
        />
      )}
    </div>
  );
}

export default RevistaAdminModal;
