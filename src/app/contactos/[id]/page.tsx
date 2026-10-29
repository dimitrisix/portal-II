import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { DetalleContactoClient } from "@/components/DetalleContactoClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function DetalleContactoPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    notFound();
  }

  const item = await prisma.contactoItem.findUnique({
    where: { id: numId },
  });

  if (!item || !item.activo) {
    notFound();
  }

  const initialContacto = {
    id: item.id,
    tipo: item.tipo,
    titulo: item.titulo,
    contenido: item.contenido,
    orden: item.orden,
    activo: item.activo,
    creadoAt: item.creadoAt.toISOString(),
    actualizadoAt: item.actualizadoAt?.toISOString(),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfd] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-left">
        {/* Enlace de regreso responsive */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0c4078] hover:text-[#092e57] transition-colors"
          >
            <ArrowLeft size={15} />
            Inicio
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            href="/contactos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0c4078] transition-colors"
          >
            Todos los Contactos
          </Link>
        </div>

        {/* Componente reactivo con actualización en vivo */}
        <DetalleContactoClient initialContacto={initialContacto} />
      </main>

      <Footer />
    </div>
  );
}
