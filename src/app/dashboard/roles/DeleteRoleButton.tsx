// Ubicación: src/app/dashboard/roles/DeleteRoleButton.tsx
"use client";

import { useState } from "react";
import { deleteRole } from "./actions";
import toast from "react-hot-toast";

export default function DeleteRoleButton({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteRole(id);

    if (result?.error) {
      toast.error(result.error);
      setShowConfirm(false);
    } else {
      toast.success(`Rol "${name}" eliminado con éxito`);
      setShowConfirm(false);
    }

    setIsDeleting(false);
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
        title="Eliminar Rol"
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

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-6 relative zoom-in-95">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
              ¿Eliminar Rol?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Estás a punto de eliminar el rol{" "}
              <span className="font-semibold text-gray-700">&quot;{name}&quot;</span>.
              Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Eliminando...
                  </>
                ) : (
                  "Sí, Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
