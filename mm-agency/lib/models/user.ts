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
  const derived = await scryptAsync(
    plainPassword,
    salt,
    KEY_LEN,
    SCRYPT_OPTS
  );
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

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const pool = getPool();
  const res = await pool.query<UserRow>(
    `SELECT id, email, password, name, created_at, updated_at FROM "user" WHERE email = $1`,
    [email.trim().toLowerCase()]
  );
  return res.rows[0] ?? null;
}
