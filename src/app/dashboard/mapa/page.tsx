import React from "react";
import { Map, MapPin, Trash2, Plus, AlertCircle, Edit, X } from "lucide-react";
import prisma from "@/lib/prisma";
import { verifyPageAuth } from "@/lib/auth-server";
import { guardarSede, eliminarSede } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardMapaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. Barrera de Seguridad Criptográfica y Control de Acceso
  await verifyPageAuth("mapa.manage");

  // OBTENEMOS LAS SEDES
  const sedes = await prisma.sedeMapa.findMany({
    orderBy: { id: "desc" },
  });

  // RESOLVEMOS LOS PARÁMETROS DE EDICIÓN
  const params = await Promise.resolve(searchParams);
  const editParam = params?.edit;

  let sedeEnEdicion = null;

  if (editParam) {
    const editId = parseInt(
      Array.isArray(editParam) ? editParam[0] : editParam,
    );
    if (!isNaN(editId)) {
      sedeEnEdicion = await prisma.sedeMapa.findUnique({
        where: { id: editId },
      });
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#0c4078] flex items-center gap-3">
          <Map className="text-red-600" size={36} />
          Administración del Mapa
        </h1>
        <p className="text-slate-500 mt-2">
          Agrega, modifica o elimina las sedes de FUNDAPROAL. Los cambios se
          reflejarán automáticamente en el portal público.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA: Formulario */}
        <div className="xl:col-span-1">
          <div
            key={`formulario-${sedeEnEdicion?.id || "nuevo"}`}
            className={`p-6 rounded-2xl shadow-sm border transition-colors h-fit sticky top-6 ${sedeEnEdicion ? "bg-blue-50/50 border-blue-200" : "bg-white border-slate-200"}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`text-xl font-bold flex items-center gap-2 ${sedeEnEdicion ? "text-[#0c4078]" : "text-slate-800"}`}
              >
                {sedeEnEdicion ? (
                  <>
                    <Edit size={22} className="text-blue-600" /> Editar Sede
                  </>
                ) : (
                  <>
                    <Plus size={22} className="text-red-600" /> Registrar Nueva
                    Sede
                  </>
                )}
              </h2>

              {sedeEnEdicion && (
                <a
                  href="/dashboard/mapa"
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Cancelar edición"
                >
                  <X size={24} />
                </a>
              )}
            </div>

            <form action={guardarSede} className="space-y-4">
              <input type="hidden" name="id" value={sedeEnEdicion?.id || ""} />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nombre de la Sede *
                </label>
                <input
                  type="text"
                  name="nombre"
                  defaultValue={sedeEnEdicion?.nombre || ""}
                  required
                  placeholder="Ej: Sede Central FUNDAPROAL"
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c4078] transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Dirección Completa
                </label>
                <textarea
                  name="direccion"
                  defaultValue={sedeEnEdicion?.direccion || ""}
                  rows={2}
                  placeholder="Ej: Av. Andrés Bello, Edificio Las Fundaciones, Caracas"
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c4078] transition-all text-slate-800 resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Latitud *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="lat"
                    defaultValue={sedeEnEdicion?.lat || ""}
                    required
                    placeholder="Ej: 10.5060"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c4078] transition-all font-mono text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Longitud *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="lng"
                    defaultValue={sedeEnEdicion?.lng || ""}
                    required
                    placeholder="Ej: -66.9146"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c4078] transition-all font-mono text-sm text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full mt-4 font-bold py-3 px-4 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 uppercase text-sm text-white ${sedeEnEdicion ? "bg-blue-600 hover:bg-blue-700" : "bg-[#0c4078] hover:bg-[#072445]"}`}
              >
                {sedeEnEdicion ? (
                  <>
                    <Edit size={18} /> Actualizar Ubicación
                  </>
                ) : (
                  <>
                    <MapPin size={18} /> Guardar Ubicación
                  </>
                )}
              </button>

              {!sedeEnEdicion && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                  <AlertCircle
                    size={16}
                    className="text-[#0c4078] shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>¿Cómo obtener las coordenadas?</strong>
                    <br />
                    Abre <em>Google Maps</em>, haz clic derecho sobre el lugar y
                    luego clic izquierdo en los números para copiarlos.
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* COLUMNA DERECHA: Lista de Sedes Registradas */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">
                Sedes Registradas en Sistema
              </h2>
              <span className="bg-[#0c4078] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {sedes.length} Total
              </span>
            </div>

            {sedes.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <MapPin size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg">No hay sedes registradas aún.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sedes.map((sede) => (
                  <div
                    key={sede.id}
                    className={`p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${sedeEnEdicion?.id === sede.id ? "bg-blue-50/50 border-l-4 border-l-blue-500" : ""}`}
                  >
                    <div>
                      <h3 className="text-lg font-bold text-[#0c4078]">
                        {sede.nombre}
                      </h3>
                      {sede.direccion && (
                        <p className="text-sm text-slate-600 mt-1">
                          {sede.direccion}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          Lat: {sede.lat}
                        </span>
                        <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          Lng: {sede.lng}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`/dashboard/mapa?edit=${sede.id}`}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar Sede"
                      >
                        <Edit size={20} />
                      </a>

                      <form action={eliminarSede}>
                        <input type="hidden" name="id" value={sede.id} />
                        <button
                          type="submit"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar Sede"
                        >
                          <Trash2 size={20} />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
