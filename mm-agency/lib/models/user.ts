import { getPool } from "../db";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const SALT_LEN = 16;
const KEY_LEN = 32;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

export type UserRow = {
  id: string;
  email: string;
  password: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
};

function hashPassword(plainPassword: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(SALT_LEN);
    scrypt(plainPassword, salt, KEY_LEN, SCRYPT_OPTS, (err, derived) => {
      if (err) return reject(err);
      const saltHex = salt.toString("hex");
      const hashHex = (derived as Buffer).toString("hex");
      resolve(`${saltHex}.${hashHex}`);
    });
  });
}

export async function verifyPassword(
  plainPassword: string,
  stored: string
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(".");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const derived = await (scryptAsync as (
    password: string | Buffer,
    salt: string | Buffer,
    keylen: number,
    options: { N: number; r: number; p: number }
  ) => Promise<Buffer>)(plainPassword, salt, KEY_LEN, SCRYPT_OPTS);
  const hash = (derived as Buffer).toString("hex");
  return hash === hashHex;
}

export async function createUser(
  email: string,
  password: string,
  name?: string | null
): Promise<UserRow> {
  const pool = getPool();
  const hashed = await hashPassword(password);
  const res = await pool.query<UserRow>(
    `INSERT INTO "user" (email, password, name) VALUES ($1, $2, $3)
     RETURNING id, email, password, name, created_at, updated_at`,
    [email.trim().toLowerCase(), hashed, name ?? null]
  );
  return res.rows[0];
}

/** List all users (ordered by email). */
export async function find(): Promise<UserRow[]> {
  const pool = getPool();
  const res = await pool.query<UserRow>(
    `SELECT id, email, password, name, created_at, updated_at FROM "user" ORDER BY email`
  );
  return res.rows;
}

/** Find one user by id. */
export async function findById(id: string): Promise<UserRow | null> {
  const pool = getPool();
  const res = await pool.query<UserRow>(
    `SELECT id, email, password, name, created_at, updated_at FROM "user" WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

/** Find one user by email. */
export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const pool = getPool();
  const res = await pool.query<UserRow>(
    `SELECT id, email, password, name, created_at, updated_at FROM "user" WHERE email = $1`,
    [email.trim().toLowerCase()]
  );
  return res.rows[0] ?? null;
}

export async function updateUser(
  id: string,
  data: {
    email?: string;
    password?: string;
    name?: string | null;
  }
): Promise<UserRow | null> {
  const pool = getPool();
  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (data.email !== undefined) {
    updates.push(`email = $${i++}`);
    values.push(data.email.trim().toLowerCase());
  }
  if (data.password !== undefined && data.password.trim()) {
    const hashed = await hashPassword(data.password);
    updates.push(`password = $${i++}`);
    values.push(hashed);
  }
  if (data.name !== undefined) {
    updates.push(`name = $${i++}`);
    values.push(data.name?.trim() || null);
  }
  if (updates.length === 0) return null;
  updates.push(`updated_at = NOW()`);
  values.push(id);
  const res = await pool.query<UserRow>(
    `UPDATE "user" SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, email, password, name, created_at, updated_at`,
    values
  );
  return res.rows[0] ?? null;
}

/** Delete a user by id. */
export async function deleteUser(id: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(`DELETE FROM "user" WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}
