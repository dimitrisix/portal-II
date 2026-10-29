import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Target, Eye, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function InstitucionPage() {
  const valores = [
    "Sentido de Pertenencia",
    "Transparencia",
    "Corresponsabilidad",
    "Responsabilidad social",
    "Integridad",
    "Equidad",
    "Solidaridad",
    "Ética",
    "Disciplina",
    "Eficacia",
    "Eficiencia",
    "Puntualidad",
    "Gestión social",
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col justify-between overflow-hidden">
      {/* 1. Menú Superior */}
      <Navbar />

      {/* 2. Marca de Agua Elegante (Bandera de Venezuela) */}
      <div className="absolute inset-0 z-0 pointer-events-none flex flex-col opacity-[0.04] mix-blend-multiply">
        <div className="h-1/3 w-full bg-[#FFCC00]"></div>
        <div className="h-1/3 w-full bg-[#00247D]"></div>
        <div className="h-1/3 w-full bg-[#CF142B]"></div>
        {/* Patrón de estrellas sutil en el centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[800px] h-[400px] bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Flag_of_Venezuela.svg/1200px-Flag_of_Venezuela.svg.png')] bg-no-repeat bg-center bg-contain opacity-20 blur-sm mask-image-radial"></div>
        </div>
      </div>

      {/* 3. Contenido Principal */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex-1">
        {/* Título de la Página */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0c4078] tracking-tight mb-4">
            Nuestra Institución
          </h1>
          <div className="w-24 h-1.5 bg-red-600 mx-auto rounded-full"></div>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-lg">
            Conoce los pilares fundamentales que guían el compromiso y la labor
            de FUNDAPROAL.
          </p>
        </div>

        {/* Contenedor Misión y Visión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Tarjeta MISIÓN */}
          <div className="bg-white/80 backdrop-blur-sm border-t-4 border-t-red-600 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-red-100">
              <Target size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4 uppercase tracking-wider">
              Misión
            </h2>
            <p className="text-slate-600 leading-relaxed text-justify text-lg font-medium">
              Garantizar la seguridad alimentaria, oportuna y permanente a los
              sectores más vulnerables de todo el territorio nacional, a través
              de ejecución del Programa y sus Proyectos; así como promover la
              capacitación que permita su inserción en el modelo económico
              productivo socialista, hacia la construcción de una estructura
              social incluyente.
            </p>
          </div>

          {/* Tarjeta VISIÓN */}
          <div className="bg-white/80 backdrop-blur-sm border-t-4 border-t-[#0c4078] rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <div className="w-14 h-14 bg-blue-50 text-[#0c4078] rounded-xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
              <Eye size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4 uppercase tracking-wider">
              Visión
            </h2>
            <p className="text-slate-600 leading-relaxed text-justify text-lg font-medium">
              Ser identificada como la institución de referencia y de alto
              impacto social que contribuye a la erradicación del hambre en todo
              el territorio nacional.
            </p>
          </div>
        </div>

        {/* Sección de VALORES */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 relative overflow-hidden">
          {/* Decoración geométrica */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-red-600/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-[#0c4078]/5 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shadow-sm">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 uppercase tracking-wider">
                Nuestros Valores
              </h2>
            </div>

            {/* Lista de Valores en estilo "Píldoras" (Badges) elegantes */}
            <div className="flex flex-wrap gap-3">
              {valores.map((valor, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-full font-semibold shadow-sm hover:bg-[#0c4078] hover:text-white hover:border-[#0c4078] transition-colors cursor-default"
                >
                  <CheckCircle2 size={16} className="opacity-70" />
                  <span>{valor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 4. Pie de Página */}
      <Footer />
    </div>
  );
}
