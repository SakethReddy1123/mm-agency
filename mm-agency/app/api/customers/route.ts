import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { listCustomers, createCustomer } from "@/lib/models/customer";

export async function GET() {
  try {
    await initDb();
    const customers = await listCustomers();
    return NextResponse.json(customers);
  } catch (err) {
    console.error("GET /api/customers:", err);
    return NextResponse.json(
      { error: "Failed to list customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: { image_url?: string; name?: string; phone?: string; address?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }
  try {
    await initDb();
    const customer = await createCustomer({
      image_url: body.image_url ?? null,
      name,
      phone: body.phone ?? null,
      address: body.address ?? null,
    });
    return NextResponse.json(customer);
  } catch (err) {
    console.error("POST /api/customers:", err);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
