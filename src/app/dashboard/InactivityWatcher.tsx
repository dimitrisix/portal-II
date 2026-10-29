// Ubicación: src/app/dashboard/InactivityWatcher.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface InactivityWatcherProps {
  /** Tiempo total de inactividad antes del logout (en minutos). Por defecto: 30 */
  timeoutMinutes?: number;
  /** Tiempo de advertencia previo al cierre (en minutos). Por defecto: 2 */
  warningMinutes?: number;
}

export default function InactivityWatcher({
  timeoutMinutes = 30,
  warningMinutes = 2,
}: InactivityWatcherProps) {
  const [showModal, setShowModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningMinutes * 60);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;

  const lastActivityRef = useRef<number>(0);
  const isWarningActiveRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);

  // Forzar cierre de sesión seguro manteniendo el mismo dominio o IP
  const handleLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setShowModal(false);

    // 1. Ocultar el DOM de inmediato para que bfcache no guarde captura del panel
    document.documentElement.style.display = "none";

    // 2. Cierre de sesión manteniendo el origen actual (dominio o IP)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      await fetch("/api/auth/logout", {
        method: "POST",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      window.location.replace("/login?motivo=inactividad");
    } catch {
      window.location.replace("/api/auth/logout?motivo=inactividad");
    }
  }, []);

  // Restablecer el temporizador por interacción explícita del usuario
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isWarningActiveRef.current) {
      isWarningActiveRef.current = false;
      setShowModal(false);
    }
  }, []);

  // Escuchar eventos de interacción del usuario
  useEffect(() => {
    lastActivityRef.current = Date.now();

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleUserActivity = () => {
      // Solo refrescar la marca de tiempo si el modal NO está visible y no estamos en proceso de logout
      if (!isWarningActiveRef.current && !isLoggingOutRef.current) {
        lastActivityRef.current = Date.now();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, []);

  // Ciclo de verificación periódica cada 1 segundo
  useEffect(() => {
    if (lastActivityRef.current === 0) {
      lastActivityRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (isLoggingOutRef.current) {
        clearInterval(interval);
        return;
      }

      const now = Date.now();
      const elapsed = now - (lastActivityRef.current || now);

      // 1. Caso: El tiempo total expiró -> Cerrar sesión de inmediato
      if (elapsed >= timeoutMs) {
        clearInterval(interval);
        handleLogout();
        return;
      }

      // 2. Caso: Entró en ventana de advertencia (últimos minutos)
      if (elapsed >= timeoutMs - warningMs) {
        isWarningActiveRef.current = true;
        setShowModal(true);
        const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
        setSecondsRemaining(remaining);
      } else {
        // Aún en rango seguro
        if (isWarningActiveRef.current) {
          isWarningActiveRef.current = false;
          setShowModal(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeoutMs, warningMs, handleLogout]);

  if (!showModal) return null;

  // Formato MM:SS
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 p-6 sm:p-7 text-center relative animate-scale-up">
        {/* Icono de advertencia */}
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4 border border-amber-200">
          <svg
            className="w-7 h-7 animate-pulse"
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

        {/* Textos */}
        <h3 className="text-lg font-bold text-[#5d596c]">
          ¿Sigues ahí? Tu sesión está por expirar
        </h3>
        <p className="mt-2 text-sm text-[#6f6b7d] leading-relaxed">
          Por razones de seguridad institucional, cerraremos tu sesión debido a
          inactividad prolongada en:
        </p>

        {/* Contador regresivo */}
        <div className="my-5 py-2.5 px-4 bg-amber-50/70 border border-amber-200 rounded-lg inline-block">
          <span className="font-mono text-2xl font-bold text-amber-600 tracking-wider">
            {formattedTime}
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            type="button"
            onClick={resetActivity}
            className="flex-1 py-2.5 px-4 bg-[#7367f0] hover:bg-[#655bd3] text-white font-medium text-sm rounded-lg shadow-md shadow-[#7367f0]/30 transition-colors cursor-pointer"
          >
            Mantener sesión activa
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-lg transition-colors cursor-pointer"
          >
            Salir ahora
          </button>
        </div>
      </div>
    </div>
  );
}
