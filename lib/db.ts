import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: NeonDatabase<typeof schema> | null = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

function getDb() {
  if (!db) {
    db = drizzle({ client: getPool(), schema });
  }
  return db;
}

export { getPool as pool, getDb as db };
