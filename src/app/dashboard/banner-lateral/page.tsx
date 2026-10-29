import React from "react";
import { BannerLateralAdminModal } from "@/components/admin/BannerLateralAdminModal";
import { ImageIcon } from "lucide-react";
import { verifyPageAuth } from "@/lib/auth-server";

export const metadata = {
  title: "Ilustración Lateral | Panel Administrativo",
};

export default async function BannerLateralDashboardPage() {
  await verifyPageAuth("banner_lateral.manage");
  return (
    <div className="w-full p-6 md:p-8 space-y-6 text-left">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-start gap-2.5">
          <ImageIcon className="text-[#0c4078]" size={24} />
          Administración de Ilustración Lateral (Esquina Inferior Derecha)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Gestiona la silueta o ilustración gráfica que acompaña la barra
          lateral derecha del portal.
        </p>
      </div>

      <BannerLateralAdminModal />
    </div>
  );
}
