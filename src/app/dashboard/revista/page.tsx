import React from "react";
import { RevistaAdminModal } from "@/components/admin/RevistaAdminModal";
import { BookOpen } from "lucide-react";
import { verifyPageAuth } from "@/lib/auth-server";

export const metadata = {
  title: "Revista Digital | Panel Administrativo",
};

export default async function RevistaDashboardPage() {
  await verifyPageAuth("revista.manage");
  return (
    <div className="w-full p-6 md:p-8 space-y-6 text-left">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-start gap-2.5">
          <BookOpen className="text-[#0c4078]" size={26} />
          Administración de Revista Digital
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Gestiona la revista institucional en formato PDF. Visualiza su información, visualiza el documento completo y activa o desactiva su publicación en el portal con un solo clic.
        </p>
      </div>

      <RevistaAdminModal />
    </div>
  );
}

