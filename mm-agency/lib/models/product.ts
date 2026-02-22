import { getPool } from "../db";

export type ProductRow = {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  price: string;
  stock_count: number;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
};

/** Product with brand name joined (for list/filter by brand name). */
export type ProductWithBrandRow = ProductRow & {
  brand_name: string;
};

export type ListProductsOptions = {
  /** When set, only products whose brand name matches (partial, case-insensitive) are returned. */
  brandName?: string;
};

/**
 * List products. When brandName is provided, only products that belong to a brand
 * whose name matches the given string are returned (relation: filter by brand name).
 */
export async function listProducts(
  options?: ListProductsOptions
): Promise<ProductWithBrandRow[]> {
  const pool = getPool();
  const brandName = options?.brandName?.trim();

  if (brandName) {
    const res = await pool.query<ProductWithBrandRow>(
      `SELECT p.id, p.brand_id, p.name, p.description, p.price, p.stock_count, p.image_url, p.created_at, p.updated_at,
              b.name AS brand_name
       FROM product p
       INNER JOIN "brand" b ON p.brand_id = b.id
       WHERE b.name ILIKE $1
       ORDER BY b.name, p.name`,
      [`%${brandName}%`]
    );
    return res.rows;
  }

  const res = await pool.query<ProductWithBrandRow>(
    `SELECT p.id, p.brand_id, p.name, p.description, p.price, p.stock_count, p.image_url, p.created_at, p.updated_at,
            b.name AS brand_name
     FROM product p
     INNER JOIN "brand" b ON p.brand_id = b.id
     ORDER BY b.name, p.name`
  );
  return res.rows;
}

export async function getProductById(id: string): Promise<ProductWithBrandRow | null> {
  const pool = getPool();
  const res = await pool.query<ProductWithBrandRow>(
    `SELECT p.id, p.brand_id, p.name, p.description, p.price, p.stock_count, p.image_url, p.created_at, p.updated_at,
            b.name AS brand_name
     FROM product p
     INNER JOIN "brand" b ON p.brand_id = b.id
     WHERE p.id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export type CreateProductInput = {
  brand_id: string;
  name: string;
  description?: string | null;
  price: number | string;
  stock_count?: number;
  image_url?: string | null;
};

export async function createProduct(input: CreateProductInput): Promise<ProductRow> {
  const pool = getPool();
  const stock = input.stock_count ?? 0;
  const price = typeof input.price === "string" ? parseFloat(input.price) : input.price;
  const res = await pool.query<ProductRow>(
    `INSERT INTO product (brand_id, name, description, price, stock_count, image_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, brand_id, name, description, price, stock_count, image_url, created_at, updated_at`,
    [
      input.brand_id.trim(),
      input.name.trim(),
      input.description?.trim() ?? null,
      price,
      stock,
      input.image_url ?? null,
    ]
  );
  return res.rows[0];
}

export type UpdateProductInput = {
  brand_id?: string;
  name?: string;
  description?: string | null;
  price?: number | string;
  stock_count?: number;
  image_url?: string | null;
};

export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<ProductRow | null> {
  const pool = getPool();
  const updates: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let pos = 1;
  if (input.brand_id !== undefined) {
    updates.push(`brand_id = $${++pos}`);
    values.push(input.brand_id.trim());
  }
  if (input.name !== undefined) {
    updates.push(`name = $${++pos}`);
    values.push(input.name.trim());
  }
  if (input.description !== undefined) {
    updates.push(`description = $${++pos}`);
    values.push(input.description?.trim() ?? null);
  }
  if (input.price !== undefined) {
    const price = typeof input.price === "string" ? parseFloat(input.price) : input.price;
    updates.push(`price = $${++pos}`);
    values.push(price);
  }
  if (input.stock_count !== undefined) {
    updates.push(`stock_count = $${++pos}`);
    values.push(input.stock_count);
  }
  if (input.image_url !== undefined) {
    updates.push(`image_url = $${++pos}`);
    values.push(input.image_url);
  }
  if (values.length === 1) return getProductRowById(id);
  values.unshift(id);
  const res = await pool.query<ProductRow>(
    `UPDATE product SET ${updates.join(", ")} WHERE id = $1 RETURNING id, brand_id, name, description, price, stock_count, image_url, created_at, updated_at`,
    values
  );
  return res.rows[0] ?? null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(`DELETE FROM product WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}

/** Get product row by id (for internal use, e.g. to read image_url before delete). */
export async function getProductRowById(id: string): Promise<ProductRow | null> {
  const pool = getPool();
  const res = await pool.query<ProductRow>(
    `SELECT id, brand_id, name, description, price, stock_count, image_url, created_at, updated_at FROM product WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

/** Safe atomic decrement: only updates if stock_count >= quantity. Prevents negative stock. Returns updated row or null if insufficient stock. */
export async function decrementStock(
  productId: string,
  quantity: number,
  client?: import("pg").PoolClient
): Promise<ProductRow | null> {
  const q = client ?? getPool();
  const res = await q.query<ProductRow>(
    `UPDATE product SET stock_count = stock_count - $2, updated_at = NOW()
     WHERE id = $1 AND stock_count >= $2 AND $2 > 0
     RETURNING id, brand_id, name, description, price, stock_count, image_url, created_at, updated_at`,
    [productId, quantity]
  );
  return res.rows[0] ?? null;
}

/**
 * Check stock for items. Returns list of { product_id, requested, available } where available < requested.
 * Use before checkout to recheck stock.
 */
export async function checkStock(
  items: { product_id: string; quantity: number }[]
): Promise<{ product_id: string; requested: number; available: number }[]> {
  const pool = getPool();
  const insufficient: { product_id: string; requested: number; available: number }[] = [];
  for (const item of items) {
    if (!item.product_id || item.quantity <= 0) continue;
    const res = await pool.query<{ stock_count: number }>(
      `SELECT stock_count FROM product WHERE id = $1`,
      [item.product_id]
    );
    const available = res.rows[0]?.stock_count ?? 0;
    if (available < item.quantity) {
      insufficient.push({
        product_id: item.product_id,
        requested: item.quantity,
        available,
      });
    }
  }
  return insufficient;
}

/** Restore stock (e.g. on order cancel). */
export async function incrementStock(
  productId: string,
  quantity: number,
  client?: import("pg").PoolClient
): Promise<ProductRow | null> {
  const q = client ?? getPool();
  const res = await q.query<ProductRow>(
    `UPDATE product SET stock_count = stock_count + $2, updated_at = NOW()
     WHERE id = $1 AND $2 > 0
     RETURNING id, brand_id, name, description, price, stock_count, image_url, created_at, updated_at`,
    [productId, quantity]
  );
  return res.rows[0] ?? null;
}
