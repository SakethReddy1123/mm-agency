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

const TABLE_CUSTOMER = `
CREATE TABLE IF NOT EXISTS customer (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url  TEXT,
  name       TEXT NOT NULL,
  phone      TEXT,
  address    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_name ON customer (name);
`;

const TABLES = [TABLE_USER, TABLE_CUSTOMER];

// -----------------------------------------------------------------------------
// Initialize DB (creates all tables; call once when app spins up)
// -----------------------------------------------------------------------------

export async function initDb(): Promise<void> {
  const client = getPool();
  for (const sql of TABLES) {
    await client.query(sql);
  }
}
