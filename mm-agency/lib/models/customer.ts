import { getPool } from "../db";

export type CustomerRow = {
  id: string;
  image_url: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function listCustomers(): Promise<CustomerRow[]> {
  const pool = getPool();
  const res = await pool.query<CustomerRow>(
    `SELECT id, image_url, name, phone, address, created_at, updated_at
     FROM customer
     ORDER BY name`
  );
  return res.rows;
}

export async function getCustomerById(id: string): Promise<CustomerRow | null> {
  const pool = getPool();
  const res = await pool.query<CustomerRow>(
    `SELECT id, image_url, name, phone, address, created_at, updated_at
     FROM customer
     WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export type CreateCustomerInput = {
  image_url?: string | null;
  name: string;
  phone?: string | null;
  address?: string | null;
};

export async function createCustomer(
  input: CreateCustomerInput
): Promise<CustomerRow> {
  const pool = getPool();
  const res = await pool.query<CustomerRow>(
    `INSERT INTO customer (image_url, name, phone, address)
     VALUES ($1, $2, $3, $4)
     RETURNING id, image_url, name, phone, address, created_at, updated_at`,
    [
      input.image_url ?? null,
      input.name.trim(),
      input.phone?.trim() ?? null,
      input.address?.trim() ?? null,
    ]
  );
  return res.rows[0];
}

export type UpdateCustomerInput = {
  image_url?: string | null;
  name?: string;
  phone?: string | null;
  address?: string | null;
};

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput
): Promise<CustomerRow | null> {
  const pool = getPool();
  const updates: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let pos = 1;
  if (input.image_url !== undefined) {
    updates.push(`image_url = $${++pos}`);
    values.push(input.image_url);
  }
  if (input.name !== undefined) {
    updates.push(`name = $${++pos}`);
    values.push(input.name.trim());
  }
  if (input.phone !== undefined) {
    updates.push(`phone = $${++pos}`);
    values.push(input.phone);
  }
  if (input.address !== undefined) {
    updates.push(`address = $${++pos}`);
    values.push(input.address);
  }
  if (values.length === 0) return getCustomerById(id);
  values.unshift(id);
  const res = await pool.query<CustomerRow>(
    `UPDATE customer SET ${updates.join(", ")} WHERE id = $1 RETURNING id, image_url, name, phone, address, created_at, updated_at`,
    values
  );
  return res.rows[0] ?? null;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(`DELETE FROM customer WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}
