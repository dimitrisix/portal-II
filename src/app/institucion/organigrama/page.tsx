import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Handshake,
  FileSearch,
  Gavel,
  Scale,
  Calculator,
  MessageSquareHeart,
  Megaphone,
  FolderKanban,
  Users,
  Laptop,
  ShieldCheck,
  PackageOpen,
  Wrench,
  Sprout,
  MapPin,
  type LucideIcon,
} from "lucide-react";

// Componente reutilizable para cada cajita del organigrama
const OrgNode = ({
  title,
  icon: Icon,
  colorClass,
  side = "none",
}: {
  title: string;
  icon: LucideIcon;
  colorClass: string;
  side?: "left" | "right" | "none";
}) => (
  <div className="relative flex items-center justify-center w-full group">
    {/* Conector Izquierdo (Solo PC) */}
    {side === "left" && (
      <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-12 w-6 lg:w-12 h-0.5 bg-slate-300"></div>
    )}

    {/* Conector Derecho (Solo PC) */}
    {side === "right" && (
      <div className="hidden md:block absolute top-1/2 -left-6 lg:-left-12 w-6 lg:w-12 h-0.5 bg-slate-300"></div>
    )}

    <div
      className={`w-full bg-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all rounded-xl p-4 flex items-center gap-4 border-l-4 border-t-0 md:border-t-4 md:border-l-0 z-10 ${colorClass}`}
    >
      <div
        className={`p-2 rounded-lg shrink-0 ${colorClass.replace("border-", "bg-").replace("600", "50").replace("800", "50").replace("[#0c4078]", "blue-50")}`}
      >
        <Icon size={22} className={colorClass.replace("border-", "text-")} />
      </div>
      <h3 className="text-[13px] md:text-sm font-bold text-slate-800 leading-tight text-left md:text-center flex-1">
        {title}
      </h3>
    </div>
  </div>
);

// Etiqueta de Nivel (Divisor elegante)
const LevelBadge = ({ title, bgClass }: { title: string; bgClass: string }) => (
  <div className="flex items-center justify-center w-full my-8 md:my-12 relative z-10">
    <div className="absolute w-full h-px bg-slate-200"></div>
    <div
      className={`relative px-6 py-2 rounded-full text-xs md:text-sm font-bold text-white uppercase tracking-wider shadow-md ${bgClass}`}
    >
      {title}
    </div>
  </div>
);

export default function OrganigramaPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col justify-between overflow-hidden">
      <Navbar />

      {/* Marca de Agua Patria */}
      <div className="absolute inset-0 z-0 pointer-events-none flex flex-col opacity-[0.03] mix-blend-multiply">
        <div className="h-1/3 w-full bg-[#FFCC00]"></div>
        <div className="h-1/3 w-full bg-[#00247D]"></div>
        <div className="h-1/3 w-full bg-[#CF142B]"></div>
      </div>

      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex-1">
        {/* Encabezado */}
        <div className="text-center mb-4 md:mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0c4078] tracking-tight mb-4 uppercase">
            Organigrama de FUNDAPROAL
          </h1>
          <div className="w-24 h-1.5 bg-red-600 mx-auto rounded-full"></div>
        </div>

        {/* ================= INICIO DEL ORGANIGRAMA ================= */}
        <div className="max-w-6xl mx-auto relative flex flex-col items-center">
          {/* NIVEL ESTRATÉGICO */}
          <LevelBadge
            title="Nivel Estratégico (Superior)"
            bgClass="bg-red-700"
          />

          <div className="relative w-full flex flex-col items-center">
            {/* Línea central vertical que cruza todo el nivel */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-300 z-0"></div>

            {/* Consejo Directivo */}
            <div className="w-full max-w-xs z-10 mb-6 md:mb-12">
              <OrgNode
                title="Consejo Directivo"
                icon={Handshake}
                colorClass="border-red-700 text-red-700"
              />
            </div>

            {/* Fila: Auditoría Interna + Presidencia */}
            <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-4 md:gap-0 relative z-10">
              <div className="flex items-center md:pr-12 relative">
                <OrgNode
                  title="Auditoria Interna"
                  icon={FileSearch}
                  colorClass="border-red-700 text-red-700"
                  side="left"
                />
              </div>
              <div className="flex items-center justify-center">
                <div className="w-full max-w-xs">
                  <OrgNode
                    title="Presidencia"
                    icon={Gavel}
                    colorClass="border-red-700 text-red-700"
                  />
                </div>
              </div>
              <div>{/* Espacio vacío para balancear el grid en PC */}</div>
            </div>
          </div>

          {/* NIVEL APOYO */}
          <LevelBadge
            title="Nivel Apoyo - Administrativo"
            bgClass="bg-slate-700"
          />

          <div className="relative w-full max-w-5xl">
            {/* Línea central vertical del Nivel Apoyo */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-300 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-24 gap-y-4 md:gap-y-8 w-full z-10 relative">
              {/* Fila 1 */}
              <OrgNode
                title="Consultoria Juridica"
                icon={Scale}
                colorClass="border-slate-700 text-slate-700"
                side="left"
              />
              <OrgNode
                title="Oficina de Planificación Y Presupuesto"
                icon={Calculator}
                colorClass="border-slate-700 text-slate-700"
                side="right"
              />

              {/* Fila 2 */}
              <OrgNode
                title="Oficina de Atención Ciudadana"
                icon={MessageSquareHeart}
                colorClass="border-slate-700 text-slate-700"
                side="left"
              />
              <OrgNode
                title="Oficina de Gestión Comunicacional"
                icon={Megaphone}
                colorClass="border-slate-700 text-slate-700"
                side="right"
              />

              {/* Fila 3 */}
              <OrgNode
                title="Oficina de Gestión Administrativa"
                icon={FolderKanban}
                colorClass="border-slate-700 text-slate-700"
                side="left"
              />
              <OrgNode
                title="Oficina de Gestión Humana"
                icon={Users}
                colorClass="border-slate-700 text-slate-700"
                side="right"
              />

              {/* Fila 4 */}
              <OrgNode
                title="Oficina de Tecnologías de la Información y la Comunicación"
                icon={Laptop}
                colorClass="border-slate-700 text-slate-700"
                side="left"
              />
              <OrgNode
                title="Oficina de Seguridad Integral e Inspecciones"
                icon={ShieldCheck}
                colorClass="border-slate-700 text-slate-700"
                side="right"
              />
            </div>
          </div>

          {/* NIVEL OPERACIONAL */}
          <LevelBadge
            title="Nivel Operacional Sustantivo"
            bgClass="bg-[#0c4078]"
          />

          <div className="relative w-full mt-2">
            {/* Tronco central y Tenedor (Fork) para el Nivel Operacional */}
            <div className="hidden md:block absolute -top-16 bottom-[-4rem] left-1/2 -translate-x-1/2 w-0.5 bg-slate-300 z-0"></div>

            <div className="hidden md:block absolute top-0 left-[16.66%] right-[16.66%] h-0.5 bg-slate-300 z-0"></div>
            <div className="hidden md:block absolute top-0 left-[16.66%] w-0.5 h-6 bg-slate-300 z-0"></div>
            <div className="hidden md:block absolute top-0 right-[16.66%] w-0.5 h-6 bg-slate-300 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full pt-0 md:pt-6 z-10 relative">
              <OrgNode
                title="Gerencia de Operaciones y Programas Alimentarios"
                icon={PackageOpen}
                colorClass="border-[#0c4078] text-[#0c4078]"
              />
              <OrgNode
                title="Gerencia de Mantenimiento de Infraestructura y Equipos"
                icon={Wrench}
                colorClass="border-[#0c4078] text-[#0c4078]"
              />
              <OrgNode
                title="Gerencia de Gestión Socio Productiva y Formación Liberadora"
                icon={Sprout}
                colorClass="border-[#0c4078] text-[#0c4078]"
              />
            </div>
          </div>

          {/* NIVEL DESCONCENTRADO */}
          <LevelBadge title="Nivel Desconcentrado" bgClass="bg-indigo-600" />

          <div className="w-full max-w-sm z-10 relative">
            <OrgNode
              title="Coordinaciones Estatales"
              icon={MapPin}
              colorClass="border-indigo-600 text-indigo-600"
            />
          </div>
        </div>
        {/* ================= FIN DEL ORGANIGRAMA ================= */}
      </main>

      <Footer />
    </div>
  );
}
