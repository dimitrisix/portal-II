import React from "react";
import { ProgramasAdminModal } from "@/components/admin/ProgramasAdminModal";
import { Newspaper } from "lucide-react";
import { verifyPageAuth } from "@/lib/auth-server";

export const metadata = {
  title: "Administración de Programas | Panel Administrativo",
};

export default async function ProgramasDashboardPage() {
  await verifyPageAuth("programas.manage");
  return (
    <div className="w-full p-6 md:p-8 space-y-6 text-left">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-start gap-2.5">
          <Newspaper className="text-[#0c4078]" size={24} />
          Administración de Programas
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Crea, edita y elimina los programas y noticias visibles en la
          cuadrícula principal del portal.
        </p>
      </div>

      <div className="flex justify-start items-start">
        <ProgramasAdminModal />
      </div>
    </div>
  );
}
