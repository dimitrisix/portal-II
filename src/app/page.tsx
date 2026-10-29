import { Navbar } from "@/components/Navbar"; // o Header si se llama Header.tsx
import { HeroSlider } from "@/components/HeroSlider";
import { ProgramCards } from "@/components/ProgramCards";
import { SidebarPrensa } from "@/components/SidebarPrensa";
import { SidebarContactos } from "@/components/SidebarContactos";
import { BannerLateral } from "@/components/BannerLateral";
import { Footer } from "@/components/Footer";
import { RevistaSection } from "@/components/RevistaSection";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#fdfdfd] overflow-x-hidden flex flex-col justify-between">
      {/* 1. Menú Público Superior (Logo + Enlaces Institucionales) */}
      <Navbar />

      {/* 2. Carrusel Hero Principal */}
      <HeroSlider />

      {/* 3. Contenedor Central Relativo */}
      <main className="relative max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1">
        {/* Sección de Revista Institucional (Solo se muestra cuando está habilitada por administración) */}
        <RevistaSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative">
          {/* Columna Izquierda: Tarjetas de Programas (2 columnas) */}
          <section className="lg:col-span-2 relative z-10">
            <ProgramCards />
          </section>

          {/* Columna Derecha: Prensa y Contactos (1 columna) */}
          <aside className="lg:col-span-1 space-y-6 relative z-10">
            <SidebarPrensa />
            <SidebarContactos />
          </aside>
        </div>

        {/* 4. Ilustración Lateral (Esquina inferior derecha de fondo) */}
        <BannerLateral />
      </main>

      {/* 5. Pie de Página Institucional */}
      <Footer />
    </div>
  );
}
