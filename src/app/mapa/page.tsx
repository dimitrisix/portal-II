"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

// Importamos el componente del mapa de forma dinámica (sin SSR)
const MapaInteractivo = dynamic(() => import("@/components/MapaVenezuela"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-slate-100 rounded-2xl flex flex-col items-center justify-center border border-slate-200">
      <div className="w-10 h-10 border-4 border-[#0c4078] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium animate-pulse">
        Cargando mapa interactivo...
      </p>
    </div>
  ),
});

// Definimos la estructura de la base de datos
interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
}

export default function MapaPage() {
  const [sedesFundaproal, setSedesFundaproal] = useState<Sede[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const fetchSedes = async () => {
      try {
        const res = await fetch("/api/sedes", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (res.ok) {
          const data = (await res.json()) as Sede[];
          if (!isCancelled) {
            setSedesFundaproal(data);
          }
        }
      } catch (error) {
        console.error("Error consultando sedes:", error);
      } finally {
        if (!isCancelled) {
          setCargando(false);
        }
      }
    };

    void fetchSedes();

    const intervalo = setInterval(() => {
      void fetchSedes();
    }, 5000);

    return () => {
      isCancelled = true;
      clearInterval(intervalo);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex-1">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0c4078] tracking-tight mb-4 uppercase">
            Presencia Nacional
          </h1>
          <div className="w-24 h-1.5 bg-red-600 mx-auto rounded-full mb-6"></div>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Conoce nuestra red de despliegue territorial. Estamos ubicados
            estratégicamente para garantizar la seguridad alimentaria en todo el
            país.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col lg:flex-row min-h-[500px]">
          {/* El Mapa Interactivo */}
          <div className="w-full lg:w-2/3 p-4 relative">
            {cargando ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#0c4078] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium animate-pulse">
                  Sincronizando coordenadas...
                </p>
              </div>
            ) : (
              <MapaInteractivo ubicaciones={sedesFundaproal} />
            )}
          </div>

          {/* Lista Lateral Administrable */}
          <div className="w-full lg:w-1/3 bg-slate-50 border-l border-slate-100 p-6 lg:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                <MapPin size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 uppercase">
                Red de Sedes
              </h2>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 flex-1 max-h-[500px] scrollbar-thin scrollbar-thumb-[#0c4078] scrollbar-track-slate-200">
              {sedesFundaproal.length === 0 && !cargando ? (
                <div className="text-center p-6 text-slate-400">
                  <p>Aún no hay sedes registradas en el sistema.</p>
                </div>
              ) : (
                sedesFundaproal.map((sede) => (
                  <div
                    key={sede.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#0c4078] transition-colors group cursor-default"
                  >
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#0c4078] transition-colors">
                      {sede.nombre}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">
                      {sede.direccion}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-2 font-mono bg-slate-50 inline-block px-2 py-1 rounded">
                      Lat: {sede.lat} / Lng: {sede.lng}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
