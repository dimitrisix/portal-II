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

export { prisma };
export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
