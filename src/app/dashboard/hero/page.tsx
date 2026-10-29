import React from "react";
import { HeroAdminModal } from "@/components/admin/HeroAdminModal";
import { Sliders } from "lucide-react";
import { verifyPageAuth } from "@/lib/auth-server";

export const metadata = {
  title: "Administración del Banner Principal | Panel Administrativo",
};

export default async function HeroDashboardPage() {
  await verifyPageAuth("hero.manage");
  return (
    <div className="w-full p-6 md:p-8 space-y-6 text-left">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-start gap-2.5">
          <Sliders className="text-[#0c4078]" size={24} />
          Administración del Banner Principal (Hero)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Modifica la imagen principal y las consignas que encabezan el portal
          institucional.
        </p>
      </div>

      <div className="flex justify-start items-start">
        <HeroAdminModal />
      </div>
    </div>
  );
}
