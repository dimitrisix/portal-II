// Ubicación: src/app/dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import InactivityWatcher from "./InactivityWatcher";

// 1. Catálogo de Administración fuera del componente para ahorrar memoria
const allAdmin = [
  {
    name: "Logo",
    path: "/dashboard/identidad",
    permission: "logo.manage",
    roles: ["ADMINISTRADOR", "ADMIN"],
  },
  {
    name: "Banner Principal",
    path: "/dashboard/hero",
    permission: "hero.manage",
    roles: ["ADMINISTRADOR", "ADMIN"],
  },
  {
    name: "Programas",
    path: "/dashboard/programas",
    permission: "programas.manage",
    roles: ["ADMINISTRADOR", "ADMIN"],
  },
  {
    name: "Prensa",
    path: "/dashboard/prensa",
    permission: "prensa.manage",
    roles: ["ADMINISTRADOR", "ADMIN"],
  },
  {
    name: "Contactos",
    path: "/dashboard/contactos",
    permission: "contactos.manage",
    roles: ["ADMINISTRADOR", "ADMIN"],
  },
  {
    name: "Revista Digital",
    path: "/dashboard/revista",
    permission: "revista.manage",
    roles: ["ADMINISTRADOR", "ADMIN"],
  },
  // {
  //   name: "Mapa",
  //   path: "/dashboard/mapa",
  //   permission: "mapa.manage",
  //   roles: ["ADMINISTRADOR", "ADMIN"],
  // },
  {
    name: "Ilustración Lateral",
    path: "/dashboard/banner-lateral",
    permission: "banner_lateral.manage",
    roles: ["ADMINISTRADOR", "ADMIN"],
  },
  {
    name: "Pie de Página",
    path: "/dashboard/footer",
    permission: "pie_pagina.manage",
    roles: ["ADMINISTRADOR", "ADMIN"],
  },
  {
    name: "Users",
    path: "/dashboard/users",
    permission: "users.manage",
    roles: ["ADMINISTRADOR", "ADMIN"],
  },
  {
    name: "Roles",
    path: "/dashboard/roles",
    permission: "roles.manage",
    roles: ["ADMINISTRADOR", "ADMIN"],
  },
  {
    name: "Permisos",
    path: "/dashboard/permisos",
    permission: "permisos.manage",
    roles: ["ADMINISTRADOR", "ADMIN"],
  },
  {
    name: "Auditoria",
    path: "/dashboard/auditoria",
    permission: "auditoria.view",
    roles: ["ADMINISTRADOR", "ADMIN"],
  },
];

export default function DashboardClient({
  children,
  userName,
  roleName = "EMPLEADO",
  permissions = [],
}: {
  children: React.ReactNode;
  userName: string;
  roleName?: string;
  permissions?: string[];
}) {
  const pathname = usePathname();

  // Detección de rutas de autenticación
  const isAuthRoute =
    pathname?.startsWith("/dashboard/login") || pathname?.startsWith("/login");

  // Estados de la interfaz
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Normalizar el rol
  const currentRole = roleName?.toUpperCase().trim() || "EMPLEADO";
  const isAdmin = currentRole === "ADMINISTRADOR" || currentRole === "ADMIN";

  // Memoizar los permisos (evalúa rol de administrador, roles específicos o permisos RBAC)
  const adminItems = useMemo(() => {
    return allAdmin.filter(
      (item) =>
        isAdmin ||
        item.roles.includes(currentRole) ||
        (item.permission && permissions.includes(item.permission)),
    );
  }, [isAdmin, currentRole, permissions]);

  // 2. LA SOLUCIÓN AL ERROR: Sincronizar el estado durante el render, SIN useEffect.
  // Si la ruta cambió, ajustamos los menús inmediatamente en un solo ciclo de renderizado.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname); // Actualizamos la ruta en memoria
    setIsSidebarOpen(false); // Cerramos el panel lateral
    setIsProfileOpen(false); // Cerramos el menú de perfil

    // Evaluar si debemos auto-expandir el menú de Administración
    if (!isAuthRoute && pathname) {
      const currentPath = pathname.toLowerCase();
      const isWithinAdmin = adminItems.some((item) =>
        currentPath.startsWith(item.path.toLowerCase()),
      );

      if (isWithinAdmin) {
        setIsAppsOpen(true);
      }
    }
  }

  // Cierre de sesión seguro manteniendo el mismo dominio o IP
  const handleLogout = async () => {
    setIsLoggingOut(true);
    document.documentElement.style.display = "none";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      await fetch("/api/auth/logout", {
        method: "POST",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      window.location.replace("/login");
    } catch {
      window.location.replace("/api/auth/logout");
    }
  };

  // Cortina anti-flash para anular el guardado en memoria del botón "Atrás" (bfcache)
  useEffect(() => {
    const onPageHide = () => {
      document.documentElement.style.display = "none";
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        document.documentElement.style.display = "none";
        window.location.replace("/login");
      } else {
        document.documentElement.style.display = "";
      }
    };

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      document.documentElement.style.display = "";
    };
  }, []);

  const currentYear = new Date().getFullYear();

  // Si está en Login o Primer Ingreso, renderiza la vista limpia
  if (isAuthRoute) {
    return (
      <main className="w-full min-h-screen bg-[#f8f7fa]">
        {children}
        <Toaster
          position="bottom-right"
          reverseOrder={false}
          toastOptions={{ style: { background: "#000", color: "#fff" } }}
        />
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8f7fa] text-[#4b465c] font-sans antialiased overflow-hidden">
      {/* 1. OVERLAY MÓVIL */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-90 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-100 w-64 bg-white flex flex-col border-r border-gray-100 shadow-2xl lg:static lg:shadow-none transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Cabecera Sidebar con Logo Centrado */}
        <div className="h-16 relative flex items-center justify-center px-4 shrink-0 border-b border-gray-50">
          <div className="flex items-center justify-center h-10 w-full px-2">
            {!logoError ? (
              <Image
                src="/logo.png"
                alt="Logo Institucional"
                width={180}
                height={36}
                priority
                unoptimized
                onError={() => setLogoError(true)}
                className="max-h-9 max-w-45 w-auto h-auto object-contain mx-auto"
              />
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-8 h-8 text-[#7367f0]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="text-xl font-bold text-[#5d596c]">Sicas</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute right-4 lg:hidden p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
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
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
          {/* Dashboard Link */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === "/dashboard"
              ? "bg-[#7367f0] text-white shadow-md shadow-[#7367f0]/40"
              : "text-[#6f6b7d] hover:bg-gray-50"
              }`}
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="font-medium">Dashboard</span>
          </Link>

          {/* Menú Administración */}
          {adminItems.length > 0 && (
            <div>
              <button
                onClick={() => setIsAppsOpen(!isAppsOpen)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${isAppsOpen
                  ? "bg-gray-100 text-[#7367f0]"
                  : "text-[#6f6b7d] hover:bg-gray-50"
                  }`}
              >
                <div className="flex items-center gap-3">
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
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  <span className="font-medium">Administración</span>
                </div>
                <svg
                  className={`w-4 h-4 transform transition-transform duration-200 ${isAppsOpen ? "rotate-90" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {isAppsOpen && (
                <ul className="mt-1 space-y-1">
                  {adminItems.map((item) => {
                    const isActive =
                      pathname?.toLowerCase() === item.path.toLowerCase();
                    return (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          className={`flex items-center gap-3 p-3 ml-4 rounded-lg transition-colors ${isActive
                            ? "bg-[#7367f0] text-white shadow-md shadow-[#7367f0]/40"
                            : "text-[#6f6b7d] hover:bg-gray-50"
                            }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${isActive ? "bg-white" : "border-2 border-gray-400"
                              }`}
                          />
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </nav>
      </aside>

      {/* 3. ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 m-4 bg-white rounded-lg shadow-sm flex items-center justify-between px-4 shrink-0 relative z-10">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden mr-3 p-2 bg-gray-100 text-[#7367f0] rounded-lg shadow-sm cursor-pointer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-9 h-9 rounded-full bg-indigo-100 text-[#7367f0] flex items-center justify-center font-bold text-sm shadow-sm border-2 border-white cursor-pointer relative"
            >
              {userName ? userName.charAt(0).toUpperCase() : "U"}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-100 z-60">
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-semibold text-gray-700 truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-[#7367f0] font-medium uppercase">
                    {currentRole}
                  </p>
                </div>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    {isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* CONTENIDO Y FOOTER */}
        <div className="flex-1 overflow-auto p-4 pt-0 flex flex-col justify-between">
          <div className="flex-1">{children}</div>

          <footer className="mt-6 py-3 px-4 bg-white rounded-lg shadow-sm border border-gray-100/80 flex items-center justify-center text-xs sm:text-sm text-[#6f6b7d] text-center">
            <p>
              © {currentYear} | Desarrollado por:{" "}
              <span className="font-semibold text-[#5d596c]">
                OTIC-FUNDAPROAL
              </span>
              .
            </p>
          </footer>
        </div>
      </main>

      {/* DETECTOR DE INACTIVIDAD */}
      <InactivityWatcher timeoutMinutes={30} warningMinutes={2} />

      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{ style: { background: "#000", color: "#fff" } }}
      />
    </div>
  );
}
