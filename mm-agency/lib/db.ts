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

const TABLE_BRAND = `
CREATE TABLE IF NOT EXISTS "brand" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE,
  description  TEXT,
  logo_url     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_brand_slug ON "brand" (slug);
CREATE INDEX IF NOT EXISTS idx_brand_name ON "brand" (name);
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

const TABLE_PRODUCT = `
CREATE TABLE IF NOT EXISTS product (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    UUID NOT NULL REFERENCES "brand" (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(12, 2) NOT NULL,
  stock_count INTEGER NOT NULL DEFAULT 0,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_brand_id ON product (brand_id);
CREATE INDEX IF NOT EXISTS idx_product_name ON product (name);
CLUSTER product USING idx_product_brand_id;
`;

/** Single order table: customer + product per row. order_id groups lines into one order. */
const TABLE_ORDER = `
CREATE TABLE IF NOT EXISTS "order" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL,
  customer_id  UUID NOT NULL REFERENCES customer (id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES product (id) ON DELETE RESTRICT,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(12, 2) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_order_id ON "order" (order_id);
CREATE INDEX IF NOT EXISTS idx_order_customer_id ON "order" (customer_id);
CREATE INDEX IF NOT EXISTS idx_order_product_id ON "order" (product_id);
CREATE INDEX IF NOT EXISTS idx_order_created_at ON "order" (created_at);
`;

const TABLES = [TABLE_USER, TABLE_BRAND, TABLE_CUSTOMER, TABLE_PRODUCT, TABLE_ORDER];

// -----------------------------------------------------------------------------
// Initialize DB (creates all tables; call once when app spins up)
// -----------------------------------------------------------------------------

export async function initDb(): Promise<void> {
  const client = getPool();
  for (const sql of TABLES) {
    await client.query(sql);
  }
}
