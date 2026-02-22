import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "@/lib/models/customer";
import { uploadFile, deleteBlobByUrl, UploadError } from "@/lib/upload";

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
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const address = (formData.get("address") as string | null)?.trim() || null;
  const removeImage = formData.get("remove_image") === "true" || formData.get("remove_image") === "1";
  const imageFile = formData.get("image") as File | null;

  try {
    await initDb();
    const existing = await getCustomerById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    let image_url: string | null | undefined = undefined;
    if (removeImage) {
      await deleteBlobByUrl(existing.image_url);
      image_url = null;
    } else if (imageFile && imageFile.size > 0 && imageFile.name) {
      await deleteBlobByUrl(existing.image_url);
      image_url = await uploadFile(imageFile, "customers");
    }

    const customer = await updateCustomer(id, {
      name,
      phone,
      address,
      ...(image_url !== undefined && { image_url }),
    });
    return NextResponse.json(customer!);
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
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
  try {
    await initDb();
    const customer = await getCustomerById(id);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    await deleteBlobByUrl(customer.image_url);
    const deleted = await deleteCustomer(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/customers/[id]:", err);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
