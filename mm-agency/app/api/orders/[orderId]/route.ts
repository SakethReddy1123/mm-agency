import { NextResponse } from "next/server";
import { initDb, getPool } from "@/lib/db";
import { incrementStock } from "@/lib/models/product";
import {
  getOrderRowsByOrderId,
  deleteOrderByOrderId,
} from "@/lib/models/order";

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
