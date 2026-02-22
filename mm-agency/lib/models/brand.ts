import { getPool } from "../db";
import { slugify } from "../helpers/slug";

export type BrandRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  created_at: Date;
  updated_at: Date;
};

function slugFromName(name: string): string {
  const s = slugify(name);
  return s || "brand";
}

/** List all brands. */
export async function find(): Promise<BrandRow[]> {
  const pool = getPool();
  const res = await pool.query<BrandRow>(
    `SELECT id, name, slug, description, logo_url, created_at, updated_at FROM "brand" ORDER BY name`
  );
  return res.rows;
}

/** Find one brand by id. */
export async function findById(id: string): Promise<BrandRow | null> {
  const pool = getPool();
  const res = await pool.query<BrandRow>(
    `SELECT id, name, slug, description, logo_url, created_at, updated_at FROM "brand" WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

/** Find one brand by slug. */
export async function findBySlug(slug: string): Promise<BrandRow | null> {
  const pool = getPool();
  const res = await pool.query<BrandRow>(
    `SELECT id, name, slug, description, logo_url, created_at, updated_at FROM "brand" WHERE slug = $1`,
    [slug.trim()]
  );
  return res.rows[0] ?? null;
}

/** Find brands by name (partial, case-insensitive). Use for search/filter when user types brand name. */
export async function findByName(name: string): Promise<BrandRow[]> {
  if (!name?.trim()) return [];
  const pool = getPool();
  const res = await pool.query<BrandRow>(
    `SELECT id, name, slug, description, logo_url, created_at, updated_at
     FROM "brand"
     WHERE name ILIKE $1
     ORDER BY name`,
    [`%${name.trim()}%`]
  );
  return res.rows;
}

export async function createBrand(data: {
  name: string;
  slug?: string | null;
  description?: string | null;
  logo_url?: string | null;
}): Promise<BrandRow> {
  const pool = getPool();
  const slug =
    data.slug?.trim() || slugFromName(data.name);
  const res = await pool.query<BrandRow>(
    `INSERT INTO "brand" (name, slug, description, logo_url)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, slug, description, logo_url, created_at, updated_at`,
    [
      data.name.trim(),
      slug,
      data.description?.trim() || null,
      data.logo_url?.trim() || null,
    ]
  );
  return res.rows[0];
}

export async function updateBrand(
  id: string,
  data: {
    name?: string;
    slug?: string | null;
    description?: string | null;
    logo_url?: string | null;
  }
): Promise<BrandRow | null> {
  const pool = getPool();
  const slug =
    data.slug !== undefined
      ? (data.slug?.trim() || (data.name ? slugFromName(data.name) : undefined))
      : data.name !== undefined
        ? slugFromName(data.name)
        : undefined;
  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (data.name !== undefined) {
    updates.push(`name = $${i++}`);
    values.push(data.name.trim());
  }
  if (slug !== undefined) {
    updates.push(`slug = $${i++}`);
    values.push(slug);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${i++}`);
    values.push(data.description?.trim() || null);
  }
  if (data.logo_url !== undefined) {
    updates.push(`logo_url = $${i++}`);
    values.push(data.logo_url?.trim() || null);
  }
  if (updates.length === 0) return null;
  updates.push(`updated_at = NOW()`);
  values.push(id);
  const res = await pool.query<BrandRow>(
    `UPDATE "brand" SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, name, slug, description, logo_url, created_at, updated_at`,
    values
  );
  return res.rows[0] ?? null;
}

/** Delete a brand by id. */
export async function deleteBrand(id: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(`DELETE FROM "brand" WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}
