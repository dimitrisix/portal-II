// Ubicación: src/app/dashboard/users/CreateUserModal.tsx
"use client";

import { useState, useActionState } from "react";
import { createUser, type ActionState } from "./actions";
import toast from "react-hot-toast";

interface RoleItem {
  id: number;
  name: string;
}

interface CreateUserModalProps {
  roles: RoleItem[];
}

export default function CreateUserModal({ roles }: CreateUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Estado para capturar la contraseña en tiempo real y validar los requisitos visuales
  const [password, setPassword] = useState("");

  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    async (prevState, formData) => {
      const res = await createUser(prevState, formData);
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
                  Usuario creado con éxito
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

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#7367f0] hover:bg-[#6355d8] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-[#7367f0]/40 cursor-pointer"
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
        Nuevo Usuario
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative animate-in fade-in zoom-in duration-200 my-8">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-1 transition-colors cursor-pointer"
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

            <h3 className="text-xl font-bold text-[#5d596c] mb-6">
              Agregar Usuario
            </h3>

            <form action={formAction} className="space-y-4">
              {state?.error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                  {state.error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cédula
                </label>
                <input
                  type="text"
                  name="cedula"
                  required
                  placeholder="Ej. 12345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario (Nombre de usuario)
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="Ej. jperez"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="ejemplo@correo.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol del Usuario
                </label>
                <select
                  name="roleId"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] text-gray-700 bg-white"
                >
                  <option value="">Sin Rol (Usuario Estándar)</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] text-gray-700"
                />

                {/* Lista de validación en tiempo real */}
                <div className="mt-2.5 space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                  <p className="font-semibold text-gray-600 mb-1">
                    Seguridad de la contraseña:
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
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium bg-[#7367f0] hover:bg-[#6355d8] text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isPending ? "Creando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
