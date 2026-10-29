import { Pool } from "pg";

// Tipamos el objeto global para TypeScript
const globalForDb = global as unknown as {
  pool: Pool;
  secondaryPool: Pool;
};

// 1. Pool para la base de datos principal
export const pool =
  globalForDb.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

// 2. Pool para la segunda base de datos
export const secondaryPool =
  globalForDb.secondaryPool ||
  new Pool({
    connectionString: process.env.DATABASE_SIMA_URL,
  });

// Evitamos duplicar conexiones en modo desarrollo (Hot Module Replacement)
if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
  globalForDb.secondaryPool = secondaryPool;
}
