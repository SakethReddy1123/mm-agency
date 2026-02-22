import { NextResponse } from "next/server";
import { checkStock } from "@/lib/models/product";

/**
 * POST /api/orders/check-stock
 * Body: { items: [{ product_id: string, quantity: number }] }
 * Recheck stock before checkout. Returns ok: true if all items have sufficient stock,
 * else ok: false and insufficient list with product_id, requested, available.
 */
export async function POST(request: Request) {
  let body: { items?: { product_id?: string; quantity?: number }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = Array.isArray(body.items) ? body.items : [];
  const items = raw
    .map((i) => ({
      product_id: String(i.product_id ?? "").trim(),
      quantity: Math.max(0, Math.floor(Number(i.quantity) || 0)),
    }))
    .filter((i) => i.product_id && i.quantity > 0);

  if (items.length === 0) {
    return NextResponse.json(
      { ok: true, insufficient: [] },
      { status: 200 }
    );
  }

  const insufficient = await checkStock(items);
  return NextResponse.json({
    ok: insufficient.length === 0,
    insufficient: insufficient.map((x) => ({
      product_id: x.product_id,
      requested: x.requested,
      available: x.available,
    })),
  });
}
