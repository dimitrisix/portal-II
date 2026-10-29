import React from "react";
import { LogoAdminModal } from "@/components/admin/LogoAdminModal";
import { Image as ImageIcon } from "lucide-react";
import { verifyPageAuth } from "@/lib/auth-server";

export const metadata = {
  title: "Administración del logo del menú | Panel Administrativo",
};

export default async function IdentidadDashboardPage() {
  await verifyPageAuth("logo.manage");
  return (
    <div className="w-full p-6 md:p-8 space-y-6 text-left">
      {/* Encabezado alineado a la izquierda */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-start gap-2.5">
          <ImageIcon className="text-[#0c4078]" size={24} />
          Administración del logo del menú
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Sube o actualiza la imagen del logotipo que se muestra en el
          encabezado principal del portal.
        </p>
      </div>

      {/* Contenedor pegado a la izquierda */}
      <div className="flex justify-start items-start">
        <LogoAdminModal />
      </div>
    </div>
  );
}
