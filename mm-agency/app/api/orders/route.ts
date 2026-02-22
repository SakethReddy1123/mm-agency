import { NextResponse } from "next/server";
import { initDb, getPool } from "@/lib/db";
import {
  getProductRowById,
  decrementStock,
  checkStock,
} from "@/lib/models/product";
import {
  createOrder,
  getOrderIdFromRows,
} from "@/lib/models/order";

type OrderListItem = {
  order_id: string;
  customer_id: string;
  customer_name: string;
  created_at: string;
  total: number;
};

export type OrderLineRow = {
  order_id: string;
  order_date: string;
  product_name: string;
  quantity: number;
  total_amount: number;
};

export type CustomerOrdersGroup = {
  customer_id: string;
  customer_name: string;
  lines: OrderLineRow[];
  total: number;
};

/**
 * GET /api/orders — list orders.
 * ?by=customer — returns data grouped by customer: customer name, product name, quantity, total amount per line.
 * No query — returns flat list of orders (order_id, customer_name, date, total) for backward compatibility.
 */
export async function GET(request: Request) {
  try {
    await initDb();
    const pool = getPool();
    const { searchParams } = new URL(request.url);
    const byCustomer = searchParams.get("by") === "customer";

    if (byCustomer) {
      const res = await pool.query<{
        customer_id: string;
        customer_name: string;
        order_id: string;
        created_at: Date;
        product_name: string;
        quantity: number;
        total_amount: string;
      }>(
        `SELECT o.customer_id, c.name AS customer_name, o.order_id, o.created_at,
                p.name AS product_name, o.quantity, o.total_amount::numeric AS total_amount
         FROM "order" o
         JOIN customer c ON c.id = o.customer_id
         JOIN product p ON p.id = o.product_id
         ORDER BY c.name, o.created_at DESC, o.order_id, p.name`
      );
      const byCust = new Map<string, CustomerOrdersGroup>();
      for (const r of res.rows) {
        const key = r.customer_id;
        if (!byCust.has(key)) {
          byCust.set(key, {
            customer_id: r.customer_id,
            customer_name: r.customer_name,
            lines: [],
            total: 0,
          });
        }
        const group = byCust.get(key)!;
        const totalAmount = parseFloat(r.total_amount);
        group.lines.push({
          order_id: r.order_id,
          order_date: new Date(r.created_at).toISOString(),
          product_name: r.product_name,
          quantity: r.quantity,
          total_amount: totalAmount,
        });
        group.total += totalAmount;
      }
      const list = Array.from(byCust.values());
      return NextResponse.json(list);
    }

    const res = await pool.query<{
      order_id: string;
      customer_id: string;
      customer_name: string;
      created_at: Date;
      total: string;
    }>(
      `SELECT o.order_id, o.customer_id, c.name AS customer_name,
              MIN(o.created_at) AS created_at,
              SUM(o.total_amount::numeric) AS total
       FROM "order" o
       JOIN customer c ON c.id = o.customer_id
       GROUP BY o.order_id, o.customer_id, c.name
       ORDER BY MIN(o.created_at) DESC`
    );
    const list: OrderListItem[] = res.rows.map((r) => ({
      order_id: r.order_id,
      customer_id: r.customer_id,
      customer_name: r.customer_name,
      created_at: new Date(r.created_at).toISOString(),
      total: parseFloat(r.total),
    }));
    return NextResponse.json(list);
  } catch (err) {
    console.error("GET /api/orders:", err);
    return NextResponse.json(
      { error: "Failed to list orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Body: { customer_id: string, items: [{ product_id: string, quantity: number }] }
 * Validates stock up front, then in a transaction: creates order, atomically decrements stock.
 * Prevents negative stock and over-ordering.
 */
export async function POST(request: Request) {
  let body: { customer_id?: string; items?: { product_id?: string; quantity?: number }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const customer_id = body.customer_id?.trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!customer_id) {
    return NextResponse.json(
      { error: "customer_id is required" },
      { status: 400 }
    );
  }
  if (items.length === 0) {
    return NextResponse.json(
      { error: "items array with at least one { product_id, quantity } is required" },
      { status: 400 }
    );
  }

  const normalized = items
    .map((i) => ({
      product_id: String(i.product_id ?? "").trim(),
      quantity: Math.max(0, Math.floor(Number(i.quantity) || 0)),
    }))
    .filter((i) => i.product_id && i.quantity > 0);

  if (normalized.length === 0) {
    return NextResponse.json(
      { error: "At least one item must have product_id and quantity > 0" },
      { status: 400 }
    );
  }

  try {
    await initDb();

    // 1) Pre-validate: product exists and stock sufficient (fast fail before transaction)
    const insufficient = await checkStock(normalized);
    if (insufficient.length > 0) {
      return NextResponse.json(
        {
          error: "Insufficient stock",
          insufficient: insufficient.map((x) => ({
            product_id: x.product_id,
            requested: x.requested,
            available: x.available,
          })),
        },
        { status: 400 }
      );
    }

    const itemsWithTotals: {
      product_id: string;
      quantity: number;
      unit_price: number;
      total_amount: number;
    }[] = [];
    for (const item of normalized) {
      const product = await getProductRowById(item.product_id);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.product_id}` },
          { status: 404 }
        );
      }
      const unit_price = parseFloat(product.price);
      const total_amount = Math.round(unit_price * item.quantity * 100) / 100;
      itemsWithTotals.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price,
        total_amount,
      });
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const rows = await createOrder(
        { customer_id, items: itemsWithTotals },
        client
      );

      const qtyByProduct = new Map<string, number>();
      for (const item of itemsWithTotals) {
        qtyByProduct.set(
          item.product_id,
          (qtyByProduct.get(item.product_id) ?? 0) + item.quantity
        );
      }
      for (const [product_id, qty] of qtyByProduct) {
        const updated = await decrementStock(product_id, qty, client);
        if (!updated) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            {
              error: "Insufficient stock (recheck failed). Please try again.",
              insufficient: [{ product_id, requested: qty }],
            },
            { status: 400 }
          );
        }
      }

      await client.query("COMMIT");
      const order_id = getOrderIdFromRows(rows);
      return NextResponse.json({ order_id, rows });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
