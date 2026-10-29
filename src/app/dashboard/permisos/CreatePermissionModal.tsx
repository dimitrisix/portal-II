// Ubicación: src/app/dashboard/permisos/CreatePermissionModal.tsx
"use client";

import { useState, useActionState } from "react";
import { createPermission, type PermissionActionState } from "./actions";
import toast from "react-hot-toast";

export default function CreatePermissionModal() {
  const [isOpen, setIsOpen] = useState(false);

  const [state, formAction, isPending] = useActionState<PermissionActionState | null, FormData>(
    async (prevState, formData) => {
      const res = await createPermission(prevState, formData);
      if (res?.success) {
        setIsOpen(false);
        toast.custom((t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-gray-800 shadow-2xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4 flex items-center gap-3">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span className="text-sm font-medium text-white">
                Permiso creado con éxito
              </span>
            </div>
          </div>
        ));
      }
      return res;
    },
    null,
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#7367f0] hover:bg-[#6355d8] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-[#7367f0]/40"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Nuevo Permiso
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-1 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-[#5d596c] mb-2">
              Agregar Permiso
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Define un nuevo control de acceso para el sistema.
            </p>

            <form action={formAction} className="space-y-4">
              {state?.error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                  {state.error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre (Clave)
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej: ventas.leer, reportes.exportar"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] text-gray-700 font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Usa minúsculas separadas por punto.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="¿Qué permite hacer este permiso?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] text-gray-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium bg-[#7367f0] hover:bg-[#6355d8] text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isPending ? "Guardando..." : "Crear Permiso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
