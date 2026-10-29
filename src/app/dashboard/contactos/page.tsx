import React from "react";
import { ContactosAdminModal } from "@/components/admin/ContactosAdminModal";
import { FileText } from "lucide-react";
import { verifyPageAuth } from "@/lib/auth-server";

export const metadata = {
  title: "Administración de contactos de la página | Panel Administrativo",
};

export default async function ContactosDashboardPage() {
  await verifyPageAuth("contactos.manage");
  return (
    <div className="w-full p-6 md:p-8 space-y-6 text-left">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-start gap-2.5">
          <FileText className="text-[#0c4078]" size={24} />
          Administración de contactos de la página
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed max-w-3xl">
          Esta sección permite gestionar el bloque lateral derecho del portal
          principal denominado <strong>CONTACTOS</strong>. En él se publican y
          organizan los enlaces institucionales directos, discursos oficiales,
          procesos de contratación, trípticos informativos y revistas
          descargables para el acceso público de la ciudadanía.
        </p>
      </div>

      <div className="flex justify-start items-start">
        <ContactosAdminModal />
      </div>
    </div>
  );
}
