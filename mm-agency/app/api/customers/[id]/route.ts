import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "@/lib/models/customer";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  await initDb();
  const customer = await getCustomerById(id);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  return NextResponse.json(customer);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: {
    image_url?: string | null;
    name?: string;
    phone?: string | null;
    address?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    await initDb();
    const customer = await updateCustomer(id, body);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(customer);
  } catch (err) {
    console.error("PATCH /api/customers/[id]:", err);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  await initDb();
  const deleted = await deleteCustomer(id);
  if (!deleted) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
