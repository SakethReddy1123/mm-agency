import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { getCustomerList, createCustomer } from "@/lib/services";
import { uploadFile, UploadError } from "@/lib/upload";

export async function GET() {
  try {
    await initDb();
    const customers = await getCustomerList();
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
  const imageFile = formData.get("image") as File | null;

  let image_url: string | null = null;
  if (imageFile && imageFile.size > 0 && imageFile.name) {
    try {
      image_url = await uploadFile(imageFile, "customers");
    } catch (err) {
      const message = err instanceof UploadError ? err.message : "Image upload failed";
      const status = err instanceof UploadError ? err.status : 400;
      return NextResponse.json({ error: message }, { status });
    }
  }

  try {
    await initDb();
    const customer = await createCustomer({
      image_url,
      name,
      phone,
      address,
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
