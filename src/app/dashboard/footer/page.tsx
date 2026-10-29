import React from "react";
import { FooterAdminModal } from "@/components/admin/FooterAdminModal";
import { PanelBottom } from "lucide-react";
import { verifyPageAuth } from "@/lib/auth-server";

export const metadata = {
  title: "Pie de Página | Panel Administrativo",
};

export default async function FooterDashboardPage() {
  await verifyPageAuth("pie_pagina.manage");
  return (
    <div className="w-full p-6 md:p-8 space-y-6 text-left">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-start gap-2.5">
          <PanelBottom className="text-[#0c4078]" size={24} />
          Administración del Pie de Página (Footer)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Carga y administra el cintillo institucional del pie de página del portal.
        </p>
      </div>

      <FooterAdminModal />
    </div>
  );
}
