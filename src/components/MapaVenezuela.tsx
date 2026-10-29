"use client";

import React, { useSyncExternalStore } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
// Importamos solo el CSS de forma global
import "leaflet/dist/leaflet.css";

// Definimos el tipo de datos para nuestras ubicaciones
export interface Ubicacion {
  id: string | number;
  lat: number;
  lng: number;
  nombre: string;
  direccion?: string;
}

interface MapaVenezuelaProps {
  ubicaciones: Ubicacion[];
}

const emptySubscribe = () => () => {};

export default function MapaVenezuela({ ubicaciones }: MapaVenezuelaProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Si el componente aún no se ha montado correctamente, mostramos un pequeño loader.
  if (!isMounted) {
    return (
      <div className="w-full h-full min-h-[400px] md:min-h-[500px] bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-200">
        <div className="w-10 h-10 border-4 border-[#0c4078] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Creamos el icono dinámicamente
  const customIcon = L.divIcon({
    className: "bg-transparent",
    html: `<div class="w-5 h-5 bg-red-600 border-4 border-white rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.5)] hover:scale-125 transition-transform duration-200"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });

  // Coordenadas centrales de Venezuela
  const centroVenezuela: [number, number] = [7.5, -66.0];

  return (
    <div className="w-full h-full min-h-[400px] md:min-h-[500px] rounded-2xl overflow-hidden shadow-inner border border-slate-200 relative z-0">
      <MapContainer
        center={centroVenezuela}
        zoom={6}
        scrollWheelZoom={false}
        className="w-full h-full absolute inset-0"
        style={{ minHeight: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {ubicaciones.map((ubicacion) => (
          <Marker
            key={ubicacion.id}
            position={[ubicacion.lat, ubicacion.lng]}
            icon={customIcon}
          >
            <Popup className="rounded-xl shadow-lg border-0">
              <div className="p-1 text-center min-w-[150px]">
                <h3 className="font-bold text-[#0c4078] mb-1">
                  {ubicacion.nombre}
                </h3>
                {ubicacion.direccion && (
                  <p className="text-xs text-slate-500 m-0 leading-tight">
                    {ubicacion.direccion}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
