import { NextResponse } from "next/server";
import { initDb, getPool } from "@/lib/db";
import { incrementStock } from "@/lib/models/product";
import {
  getOrderRowsByOrderId,
  deleteOrderByOrderId,
} from "@/lib/models/order";
import { getCustomerById } from "@/lib/models/customer";

export type OrderInvoiceResponse = {
  order_id: string;
  customer: { name: string; phone?: string; address?: string };
  created_at: string;
  items: { productName: string; quantity: number; price: number; total: number }[];
  total: number;
};

/**
 * GET /api/orders/[orderId] — order details for invoice (customer + line items with product names).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const id = orderId?.trim();
  if (!id) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }
  try {
    await initDb();
    const rows = await getOrderRowsByOrderId(id);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const customer = await getCustomerById(rows[0].customer_id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    const pool = getPool();
    const items: OrderInvoiceResponse["items"] = [];
    let total = 0;
    for (const row of rows) {
      const prodRes = await pool.query<{ name: string }>(
        `SELECT name FROM product WHERE id = $1`,
        [row.product_id]
      );
      const productName = prodRes.rows[0]?.name ?? "Unknown";
      const unitPrice = parseFloat(row.unit_price);
      const rowTotal = parseFloat(row.total_amount);
      total += rowTotal;
      items.push({
        productName,
        quantity: row.quantity,
        price: unitPrice,
        total: rowTotal,
      });
    }
    const res: OrderInvoiceResponse = {
      order_id: id,
      customer: {
        name: customer.name,
        phone: customer.phone ?? undefined,
        address: customer.address ?? undefined,
      },
      created_at: new Date(rows[0].created_at).toISOString(),
      items,
      total,
    };
    return NextResponse.json(res);
  } catch (err) {
    console.error("GET /api/orders/[orderId]:", err);
    return NextResponse.json(
      { error: "Failed to load order" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[orderId]
 * Cancels the order: restores product stock for each line item, then deletes all order rows.
 * Uses a transaction so stock restore and order deletion are atomic.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const id = orderId?.trim();
  if (!id) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  try {
    await initDb();
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const rows = await getOrderRowsByOrderId(id, client);
      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      for (const row of rows) {
        await incrementStock(row.product_id, row.quantity, client);
      }
      await deleteOrderByOrderId(id, client);
      await client.query("COMMIT");
      return NextResponse.json({ cancelled: true, order_id: id });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to cancel order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
