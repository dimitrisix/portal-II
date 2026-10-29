import React from "react";
import { PrensaAdminModal } from "@/components/admin/PrensaAdminModal";
import { Video } from "lucide-react";
import { verifyPageAuth } from "@/lib/auth-server";

export const metadata = {
  title: "Administración de Prensa | Panel Administrativo",
};

export default async function PrensaDashboardPage() {
  await verifyPageAuth("prensa.manage");
  return (
    <div className="w-full p-6 md:p-8 space-y-6 text-left">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-start gap-2.5">
          <Video className="text-[#0c4078]" size={24} />
          Administración de Prensa (Videos)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gestiona los videos institucionales. El más reciente se proyectará en
          la portada principal y el resto en el catálogo general de Prensa.
        </p>
      </div>

      <div className="flex justify-start items-start">
        <PrensaAdminModal />
      </div>
    </div>
  );
}
