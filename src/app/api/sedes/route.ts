import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Esta línea mágica fuerza a Next.js a NUNCA guardar esto en caché.
// Así garantizamos que la información sea 100% en vivo.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sedes = await prisma.sedeMapa.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });

    return NextResponse.json(sedes);
  } catch (error) {
    console.error("Error al obtener sedes del mapa:", error);
    return NextResponse.json(
      { error: "Error al cargar las ubicaciones" },
      { status: 500 },
    );
  }
}
