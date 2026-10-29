// Ubicación: src/app/dashboard/users/ResetPasswordModal.tsx
"use client";

import { useState, useActionState } from "react";
import { resetPassword, type ActionState } from "./actions";
import toast from "react-hot-toast";

export default function ResetPasswordModal({
  userId,
  userName,
}: {
  userId: number | string;
  userName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (prevState, formData) => {
      const res = await resetPassword(prevState, formData);
      if (res?.success) {
        setIsOpen(false);
        setPassword("");
        toast.custom((t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-gray-800 shadow-2xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  ></path>
                </svg>
                <span className="text-sm font-medium text-white">
                  Contraseña actualizada con éxito
                </span>
              </div>
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
        className="inline-flex items-center justify-center text-gray-400 hover:text-amber-500 transition-colors focus:outline-none"
        title="Cambiar Contraseña"
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
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto text-left">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative animate-in fade-in zoom-in duration-200 my-8">
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
              Cambiar Contraseña
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Establece una nueva clave para el usuario{" "}
              <span className="font-semibold text-gray-700">{userName}</span>.
            </p>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="id" value={userId} />

              {state?.error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                  {state.error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] text-gray-700"
                />

                {/* Indicadores en tiempo real */}
                <div className="mt-2.5 space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                  <p className="font-semibold text-gray-600 mb-1">
                    Requisitos de seguridad:
                  </p>
                  <div
                    className={`flex items-center gap-2 transition-colors ${hasLength ? "text-green-600 font-medium" : "text-gray-400"}`}
                  >
                    <span className="w-4 text-center">
                      {hasLength ? "✓" : "○"}
                    </span>{" "}
                    Al menos 8 caracteres
                  </div>
                  <div
                    className={`flex items-center gap-2 transition-colors ${hasUpper ? "text-green-600 font-medium" : "text-gray-400"}`}
                  >
                    <span className="w-4 text-center">
                      {hasUpper ? "✓" : "○"}
                    </span>{" "}
                    Al menos una letra mayúscula
                  </div>
                  <div
                    className={`flex items-center gap-2 transition-colors ${hasLower ? "text-green-600 font-medium" : "text-gray-400"}`}
                  >
                    <span className="w-4 text-center">
                      {hasLower ? "✓" : "○"}
                    </span>{" "}
                    Al menos una letra minúscula
                  </div>
                  <div
                    className={`flex items-center gap-2 transition-colors ${hasNumber ? "text-green-600 font-medium" : "text-gray-400"}`}
                  >
                    <span className="w-4 text-center">
                      {hasNumber ? "✓" : "○"}
                    </span>{" "}
                    Al menos un número
                  </div>
                  <div
                    className={`flex items-center gap-2 transition-colors ${hasSpecial ? "text-green-600 font-medium" : "text-gray-400"}`}
                  >
                    <span className="w-4 text-center">
                      {hasSpecial ? "✓" : "○"}
                    </span>{" "}
                    Un caracter especial (ej. @, #, $, !)
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
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
                  {isPending ? "Actualizando..." : "Actualizar Clave"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
