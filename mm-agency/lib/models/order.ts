import { getPool } from "../db";

export type OrderRow = {
  id: string;
  order_id: string;
  order_number: string | null;
  customer_id: string;
  product_id: string;
  quantity: number;
  unit_price: string;
  total_amount: string;
  created_at: Date;
};

export type CreateOrderItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
};

export type CreateOrderInput = {
  customer_id: string;
  items: CreateOrderItem[];
};

/** Get next human-readable order number (e.g. ORD-000001). */
async function getNextOrderNumber(q: import("pg").Pool | import("pg").PoolClient): Promise<string> {
  const res = await q.query<{ order_number: string }>(
    `SELECT 'ORD-' || LPAD(nextval('order_number_seq')::text, 6, '0') AS order_number`
  );
  return res.rows[0]?.order_number ?? `ORD-${Date.now()}`;
}

/** Create an order: inserts one row per item with same order_id and order_number. unit_price and total_amount must be pre-calculated by caller. Optional client for transaction. */
export async function createOrder(
  input: CreateOrderInput,
  client?: import("pg").PoolClient
): Promise<OrderRow[]> {
  const q = client ?? getPool();
  const customer_id = input.customer_id.trim();
  const items = input.items.filter(
    (i) => i.product_id?.trim() && i.quantity > 0 && i.total_amount >= 0
  );
  if (!customer_id || items.length === 0) {
    throw new Error("customer_id and at least one item with unit_price and total_amount are required");
  }

  const order_id = crypto.randomUUID();
  const order_number = await getNextOrderNumber(q);
  const rows: OrderRow[] = [];
  for (const item of items) {
    const res = await q.query<OrderRow>(
      `INSERT INTO "order" (order_id, order_number, customer_id, product_id, quantity, unit_price, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, order_id, order_number, customer_id, product_id, quantity, unit_price, total_amount, created_at`,
      [
        order_id,
        order_number,
        customer_id,
        item.product_id.trim(),
        item.quantity,
        item.unit_price,
        item.total_amount,
      ]
    );
    rows.push(res.rows[0]);
  }
  return rows;
}

/** Return order_id from first row (when created in same request). */
export function getOrderIdFromRows(rows: OrderRow[]): string | null {
  return rows[0]?.order_id ?? null;
}

/** Get all order rows for an order_id (for cancel + restore stock). */
export async function getOrderRowsByOrderId(
  orderId: string,
  client?: import("pg").PoolClient
): Promise<OrderRow[]> {
  const q = client ?? getPool();
  const res = await q.query<OrderRow>(
    `SELECT id, order_id, order_number, customer_id, product_id, quantity, unit_price, total_amount, created_at
     FROM "order" WHERE order_id = $1`,
    [orderId]
  );
  return res.rows;
}

/** Delete all rows for an order_id. Use in transaction with stock restore. */
export async function deleteOrderByOrderId(
  orderId: string,
  client?: import("pg").PoolClient
): Promise<number> {
  const q = client ?? getPool();
  const res = await q.query(`DELETE FROM "order" WHERE order_id = $1`, [orderId]);
  return res.rowCount ?? 0;
}
