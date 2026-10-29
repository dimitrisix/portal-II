import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import prisma from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";

import { DetalleProgramaClient } from "@/components/DetalleProgramaClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalleProgramaPage({ params }: Props) {
  const { id } = await params;
  const programaId = Number(id);

  if (isNaN(programaId)) {
    notFound();
  }

  const programa = await prisma.programa.findUnique({
    where: { id: programaId },
  });

  if (!programa || !programa.activo) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfd] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/programas"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#0c4078] hover:text-[#092e57] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a todos los programas
        </Link>

        <DetalleProgramaClient initialPrograma={programa} />
      </main>

      <Footer />
    </div>
  );
}
