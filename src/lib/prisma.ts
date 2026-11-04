import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClientSingleton = () => {
  // 1. Leemos tu variable de entorno de PostgreSQL
  const connectionString = process.env.DATABASE_URL;

  // 2. Creamos el pool de conexiones y el adaptador
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  // 3. Iniciamos Prisma usando el adaptador como te pidió el error
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// Instancia singleton de Prisma Client con adaptador pg
const prisma = prismaClientSingleton();

let autoInitPromise: Promise<void> | null = null;

/**
 * Autosanación de esquemas: asegura que las tablas esenciales como RevistaConfig existan
 * automáticamente en el entorno de producción sin requerir intervención manual de migraciones.
 */
export async function ensureDatabaseTables(): Promise<void> {
  if (autoInitPromise) return autoInitPromise;
  autoInitPromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "public"."RevistaConfig" (
          "id" SERIAL PRIMARY KEY,
          "titulo" TEXT NOT NULL DEFAULT 'Revista Institucional',
          "subtitulo" TEXT DEFAULT 'Edición Digital',
          "descripcion" TEXT,
          "fecha" TEXT,
          "archivoUrl" TEXT,
          "nombreArchivo" TEXT,
          "tamanoArchivo" TEXT,
          "portadaUrl" TEXT,
          "orden" INTEGER NOT NULL DEFAULT 0,
          "habilitado" BOOLEAN NOT NULL DEFAULT true,
          "actualizadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."RevistaConfig" ADD COLUMN IF NOT EXISTS "orden" INTEGER NOT NULL DEFAULT 0;
      `).catch(() => {});
    } catch (e) {
      console.warn("[DB AutoInit Warning]:", e);
    }
  })();
  return autoInitPromise;
}

if (typeof window === "undefined") {
  ensureDatabaseTables().catch(() => {});
}

export { prisma };
export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
