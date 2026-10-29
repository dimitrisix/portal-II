"use client";

import { useState, useTransition } from "react";
import { deleteUser } from "./actions";
import toast from "react-hot-toast"; // <-- Importamos toast

export default function DeleteUserButton({
  userId,
  userName,
}: {
  userId: string | number;
  userName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const handleDelete = () => {
    setErrorMsg("");
    startTransition(async () => {
      const result = await deleteUser(userId);

      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        // 1. Cerramos el modal
        setIsOpen(false);

        // 2. Disparamos la notificación global
        // Reemplaza el toast.success anterior por este toast.custom:
        toast.custom((t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-gray-800 shadow-2xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="text-sm font-medium text-white">
                  Usuario {userName} eliminado
                </span>
              </div>
            </div>
          </div>
        ));
      }
    });
  };

  return (
    <>
      {/* Botón de Papelera en la tabla */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-red-500 transition-colors"
        title="Eliminar Usuario"
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
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>

      {/* Modal de Advertencia */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-6 relative">
            {/* Icono de Peligro */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-center text-[#5d596c] mb-2">
              ¿Eliminar usuario?
            </h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              Estás a punto de eliminar a{" "}
              <strong className="text-gray-700">
                {userName || "este usuario"}
              </strong>
              . Esta acción no se puede deshacer.
            </p>

            {errorMsg && (
              <div className="mb-4 p-2 text-sm text-center text-red-600 bg-red-50 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
