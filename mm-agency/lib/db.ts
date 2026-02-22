import { Pool } from "pg";

// -----------------------------------------------------------------------------
// Connection
// -----------------------------------------------------------------------------

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://localhost:5432/mm_agency?user=postgres&password=postgres&sslmode=disable";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// -----------------------------------------------------------------------------
// Schema — all tables in one file (add new tables below; run on app spin-up)
// -----------------------------------------------------------------------------

const TABLE_USER = `
CREATE TABLE IF NOT EXISTS "user" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL UNIQUE,
  password     TEXT NOT NULL,
  name         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user" (email);
`;

// Add more tables here, e.g.:
// const TABLE_PROJECT = `
// CREATE TABLE IF NOT EXISTS "project" (
//   id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   name       TEXT NOT NULL,
//   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// `;

const TABLES = [TABLE_USER /* , TABLE_PROJECT, ... */];

// -----------------------------------------------------------------------------
// Initialize DB (creates all tables; call once when app spins up)
// -----------------------------------------------------------------------------

export async function initDb(): Promise<void> {
  const client = getPool();
  for (const sql of TABLES) {
    await client.query(sql);
  }
}
