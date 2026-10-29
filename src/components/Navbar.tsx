"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Target, Network } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

function resolverLogoUrl(logoConfig?: { url?: string } | string | null): string {
  let urlExtraida = "";
  if (logoConfig) {
    if (typeof logoConfig === "string") {
      urlExtraida = logoConfig;
    } else {
      urlExtraida = logoConfig.url || "";
    }
  }

  if (urlExtraida) {
    if (urlExtraida.startsWith("{")) {
      try {
        const parseado = JSON.parse(urlExtraida);
        urlExtraida =
          parseado.url || parseado.imagenUrl || parseado.valor || "";
      } catch {
        // Ignorar si no es JSON
      }
    }

    if (!urlExtraida.startsWith("/") && !urlExtraida.startsWith("http")) {
      urlExtraida = "/" + urlExtraida;
    }

    return urlExtraida;
  }

  return "/logo.png";
}

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuInstitucionAbierto, setMenuInstitucionAbierto] = useState(false);

  const { logo } = useConfig();
  const logoConfigurado = resolverLogoUrl(logo);

  const [fallbackLogo, setFallbackLogo] = useState<string | null>(null);
  const [mostrarTexto, setMostrarTexto] = useState(false);

  // Al actualizarse el logo en tiempo real, restablecer el estado para probar la nueva imagen
  useEffect(() => {
    setFallbackLogo(null);
    setMostrarTexto(false);
  }, [logoConfigurado]);

  const currentLogo = fallbackLogo || logoConfigurado;

  return (
    <nav className="bg-[#0c4078] w-full z-50 shadow-md relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          {/* =========================================
              LOGOTIPO ADMINISTRABLE
              ========================================= */}
          <div className="flex-shrink-0 flex items-center min-w-[150px]">
            <Link href="/">
              {!mostrarTexto ? (
                <img
                  key={currentLogo}
                  src={currentLogo}
                  alt="Logo FUNDAPROAL"
                  className="h-12 md:h-16 w-auto object-contain transition-opacity duration-300"
                  onError={() => {
                    if (fallbackLogo === null) {
                      setFallbackLogo("/logo.png");
                    } else if (fallbackLogo === "/logo.png") {
                      setFallbackLogo("/images/logo-fundaproal.png");
                    } else {
                      setMostrarTexto(true);
                    }
                  }}
                />
              ) : (
                <span className="text-white font-extrabold text-xl md:text-2xl tracking-wider">
                  FUNDAPROAL
                </span>
              )}
            </Link>
          </div>

          {/* Menú de Escritorio (PC) */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {/* 🔥 INICIO ACTUALIZADO: Sin fondo rojo, igual al resto */}
            <Link
              href="/"
              className="text-white hover:text-red-400 font-bold uppercase text-sm transition-colors"
            >
              INICIO
            </Link>

            <div
              className="relative group"
              onMouseEnter={() => setMenuInstitucionAbierto(true)}
              onMouseLeave={() => setMenuInstitucionAbierto(false)}
            >
              <button
                onClick={() =>
                  setMenuInstitucionAbierto(!menuInstitucionAbierto)
                }
                className="flex items-center gap-1 text-white hover:text-red-400 font-bold transition-colors py-2 uppercase text-sm"
              >
                INSTITUCIÓN
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${menuInstitucionAbierto ? "rotate-180 text-red-400" : ""}`}
                />
              </button>

              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 bg-white rounded-2xl shadow-xl transition-all duration-300 z-50 ${menuInstitucionAbierto ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-4"}`}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-t border-l border-slate-100"></div>

                <div className="relative p-2 flex flex-col gap-1 bg-white rounded-2xl border border-slate-100">
                  <Link
                    href="/institucion"
                    onClick={() => setMenuInstitucionAbierto(false)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors group/item"
                  >
                    <div className="bg-red-50 text-red-600 p-2.5 rounded-lg group-hover/item:bg-red-600 group-hover/item:text-white transition-colors shadow-sm">
                      <Target size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        Misión, Visión y Valores
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Nuestra esencia
                      </div>
                    </div>
                  </Link>

                  <div className="h-px w-full bg-slate-100 my-0.5"></div>

                  <Link
                    href="/institucion/organigrama"
                    onClick={() => setMenuInstitucionAbierto(false)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors group/item"
                  >
                    <div className="bg-blue-50 text-[#0c4078] p-2.5 rounded-lg group-hover/item:bg-[#0c4078] group-hover/item:text-white transition-colors shadow-sm">
                      <Network size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        Organigrama
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Estructura organizativa
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/programas"
              className="text-white hover:text-red-400 font-bold uppercase text-sm transition-colors"
            >
              PROGRAMAS
            </Link>
            {/* <Link
              href="/mapa"
              className="text-white hover:text-red-400 font-bold uppercase text-sm transition-colors"
            >
              MAPA
            </Link> */}
            <Link
              href="/prensa"
              className="text-white hover:text-red-400 font-bold uppercase text-sm transition-colors"
            >
              PRENSA
            </Link>
            <Link
              href="/contactos"
              className="text-white hover:text-red-400 font-bold uppercase text-sm transition-colors"
            >
              CONTACTOS
            </Link>
          </div>

          {/* Botón de Menú Móvil */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-red-400 p-2 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Desplegable para Móviles */}
      <div
        className={`md:hidden bg-[#092e57] border-t border-blue-900/50 transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-4 pt-4 pb-6 space-y-2 flex flex-col">
          {/* 🔥 INICIO MÓVIL ACTUALIZADO: Sin fondo rojo, igual al resto */}
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white hover:bg-[#0c4078] block px-4 py-3 rounded-md font-bold uppercase text-sm transition-colors"
          >
            INICIO
          </Link>

          <div className="w-full bg-[#0c4078] rounded-md overflow-hidden">
            <button
              onClick={() => setMenuInstitucionAbierto(!menuInstitucionAbierto)}
              className="flex items-center justify-between w-full text-white px-4 py-3 font-bold uppercase text-sm transition-colors"
            >
              INSTITUCIÓN
              <ChevronDown
                size={18}
                className={`transition-transform duration-300 ${menuInstitucionAbierto ? "rotate-180 text-red-400" : ""}`}
              />
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden bg-[#072445] ${menuInstitucionAbierto ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"}`}
            >
              <div className="flex flex-col py-2 px-4 gap-1">
                <Link
                  href="/institucion"
                  onClick={() => {
                    setMenuInstitucionAbierto(false);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-[#0c4078] rounded-md transition-colors group"
                >
                  <Target
                    size={18}
                    className="text-red-400 group-hover:text-red-300"
                  />
                  <span className="text-sm font-semibold">
                    Misión, Visión y Valores
                  </span>
                </Link>
                <Link
                  href="/institucion/organigrama"
                  onClick={() => {
                    setMenuInstitucionAbierto(false);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-[#0c4078] rounded-md transition-colors group"
                >
                  <Network
                    size={18}
                    className="text-blue-400 group-hover:text-blue-300"
                  />
                  <span className="text-sm font-semibold">Organigrama</span>
                </Link>
              </div>
            </div>
          </div>

          <Link
            href="/programas"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white hover:bg-[#0c4078] block px-4 py-3 rounded-md font-bold uppercase text-sm transition-colors"
          >
            PROGRAMAS
          </Link>
          {/* <Link
            href="/mapa"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white hover:bg-[#0c4078] block px-4 py-3 rounded-md font-bold uppercase text-sm transition-colors"
          >
            MAPA
          </Link> */}
          <Link
            href="/prensa"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white hover:bg-[#0c4078] block px-4 py-3 rounded-md font-bold uppercase text-sm transition-colors"
          >
            PRENSA
          </Link>
          <Link
            href="/contactos"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white hover:bg-[#0c4078] block px-4 py-3 rounded-md font-bold uppercase text-sm transition-colors"
          >
            CONTACTOS
          </Link>
        </div>
      </div>
    </nav>
  );
}
