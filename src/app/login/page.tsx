// Ubicación: src/app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { processLogin, LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 px-4 bg-[#7367f0] hover:bg-[#655bd3] disabled:bg-[#7367f0]/60 text-white font-medium text-sm rounded-lg transition-all duration-200 shadow-md shadow-[#7367f0]/30 cursor-pointer disabled:cursor-not-allowed"
    >
      {pending ? "Validando credenciales..." : "Ingresar"}
    </button>
  );
}

function LoginFormContent() {
  const [motivoInactividad, setMotivoInactividad] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [biometricError, setBiometricError] = useState("");

  const initialState: LoginState = {};
  const [state, formAction] = useActionState(processLogin, initialState);

  // Leer motivo de inactividad directamente en cliente sin useSearchParams (evita Suspense y baches SSR)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("motivo") === "inactividad") {
          const timer = setTimeout(() => {
            setMotivoInactividad(true);
          }, 0);
          return () => clearTimeout(timer);
        }
      }
    } catch {
      // Ignorar si el navegador restringe window.location
    }
  }, []);

  // 1. Redirección limpia al dashboard tras autenticación exitosa
  useEffect(() => {
    if (state?.success) {
      window.location.replace("/dashboard");
    }
  }, [state]);

  // 2. Trampa de historial: bloquea el botón "Atrás" del navegador y mantiene al usuario en /login
  useEffect(() => {
    try {
      window.history.pushState(null, "", window.location.href);

      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    } catch {
      // Ignorar si el navegador bloquea manipulación de historial
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBiometricLogin = async () => {
    setBiometricError("");
    try {
      const res = await fetch("/api/auth/biometric/challenge", {
        method: "POST",
      });
      if (!res.ok)
        throw new Error("No se pudo iniciar la autenticación biométrica.");
      const options = await res.json();

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(atob(options.challenge), (c) =>
            c.charCodeAt(0),
          ),
          rpId: window.location.hostname,
          userVerification: "preferred",
        },
      });

      if (credential) {
        const verifyRes = await fetch("/api/auth/biometric/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credential),
        });

        const data = await verifyRes.json();
        if (data.success) {
          window.location.replace("/dashboard");
        } else {
          setBiometricError(
            data.error || "No se reconoció la credencial biométrica.",
          );
        }
      }
    } catch (err: unknown) {
      console.error("Error biométrico:", err);
      setBiometricError(
        "Autenticación cancelada o no disponible en este equipo.",
      );
    }
  };

  return (
    <div className="w-full max-w-112.5 bg-white rounded-xl shadow-[0_4px_24px_0_rgba(34,41,47,0.08)] border border-gray-100 p-8 sm:p-10 relative z-10">
      {/* Logo Institucional */}
      <div className="flex items-center justify-center h-14 mb-6 px-2">
        {!logoError ? (
          <Image
            src="/logo.png"
            alt="Logo Institucional"
            width={180}
            height={48}
            priority
            unoptimized
            onError={() => setLogoError(true)}
            className="max-h-12 max-w-full w-auto h-auto object-contain"
          />
        ) : (
          <div className="flex items-center gap-2.5">
            <svg
              className="w-8 h-8 text-[#7367f0]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-2xl font-bold tracking-tight text-[#5d596c]">
              Sicas
            </span>
          </div>
        )}
      </div>

      {/* Encabezado */}
      <div className="mb-6 text-center">
        <h2 className="text-xl sm:text-[22px] font-semibold text-[#5d596c]">
          ¡Bienvenid@s! 👋
        </h2>
        <p className="mt-1.5 text-sm text-[#6f6b7d]">
          Sistema de Administración del Portal de Fundaproal
        </p>
      </div>

      {/* Alerta por caducidad de inactividad */}
      {motivoInactividad && (
        <div className="mb-4 p-3 text-xs sm:text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2.5 leading-tight animate-fade-in">
          <svg
            className="w-5 h-5 shrink-0 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Su sesión se cerró automáticamente por inactividad para proteger sus
            datos.
          </span>
        </div>
      )}

      {/* Formulario */}
      <form action={formAction} className="space-y-4">
        {/* Honeypot: campo invisible anti-bots */}
        <div className="opacity-0 absolute top-0 left-0 h-0 w-0 -z-50 pointer-events-none overflow-hidden">
          <input
            type="text"
            name="system_check_token"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {state?.error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {state.error}
          </div>
        )}

        {biometricError && (
          <div className="p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
            {biometricError}
          </div>
        )}

        {/* Campo Username */}
        <div>
          <label
            htmlFor="username"
            className="block text-xs sm:text-sm font-medium text-[#5d596c] mb-1.5"
          >
            Nombre de Usuario
          </label>
          <input
            type="text"
            id="username"
            name="username"
            className="w-full px-3.5 py-2 text-sm rounded-md border border-gray-300 text-[#5d596c] placeholder-gray-400 focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] transition-colors"
            placeholder="Introduzca su nombre de usuario"
            required
          />
        </div>

        {/* Campo Contraseña */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs sm:text-sm font-medium text-[#5d596c]"
            >
              Contraseña
            </label>
            {/* <Link
              href="/dashboard/login/recuperar"
              className="text-xs text-[#7367f0] hover:underline font-medium"
            >
              ¿Olvidó su contraseña?
            </Link> */}
          </div>

          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              className="w-full pl-3.5 pr-10 py-2 text-sm rounded-md border border-gray-300 text-[#5d596c] placeholder-gray-400 focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] transition-colors tracking-wide"
              placeholder="············"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showPassword ? (
                <svg
                  className="w-5 h-5 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Botón Ingresar */}
        <div className="pt-2">
          <SubmitButton />
        </div>
      </form>

      {/* Acceso para Primer Ingreso */}
      {/* <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-sm text-[#6f6b7d]">
          ¿Es su primera vez en el sistema?{" "}
          <Link
            href="/dashboard/login/primer-ingreso"
            className="text-[#7367f0] hover:underline font-semibold block sm:inline mt-1 sm:mt-0"
          >
            Cree su contraseña aquí
          </Link>
        </p>
      </div> */}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f7fa] p-4 relative overflow-hidden font-sans antialiased selection:bg-[#7367f0] selection:text-white">
      {/* Siluetas de fondo decorativas estilo Vuexy */}
      <div className="absolute top-12 left-1/2 -translate-x-75 w-56 h-72 bg-[#7367f0]/5 rounded-3xl z-0 pointer-events-none hidden md:block" />
      <div className="absolute top-4 left-1/2 -translate-x-65 w-52 h-72 border-2 border-[#7367f0]/20 rounded-3xl z-0 pointer-events-none hidden md:block" />
      <div className="absolute bottom-6 left-1/2 translate-x-27.5 w-56 h-72 border-2 border-dashed border-[#7367f0]/20 rounded-3xl z-0 pointer-events-none hidden md:block" />
      <div className="absolute bottom-12 left-1/2 translate-x-32.5 w-48 h-64 bg-[#7367f0]/5 rounded-3xl z-0 pointer-events-none hidden md:block" />

      {/* Render directo de LoginFormContent para garantizar que el formulario esté en el HTML SSR inicial sin baches en blanco */}
      <LoginFormContent />
    </div>
  );
}
