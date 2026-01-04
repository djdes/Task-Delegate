import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// This file is required by the template but we are using MemStorage.
// We'll export a dummy db connection if DATABASE_URL is not set to avoid crashing.
// In a real DB scenario, we would throw if DATABASE_URL is missing.

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy" 
});
export const db = drizzle(pool, { schema });
