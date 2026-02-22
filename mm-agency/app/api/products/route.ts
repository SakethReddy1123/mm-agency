import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { getProductList, createProduct } from "@/lib/services";
import { uploadFile, UploadError } from "@/lib/upload";

/**
 * GET /api/products
 * Query: brandName (optional) — when provided, returns only products whose brand name
 * matches (partial, case-insensitive). User types brand name → all products for that brand.
 */
export async function GET(request: NextRequest) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const brandName = searchParams.get("brandName") ?? undefined;
    const products = await getProductList({ brandName });
    return NextResponse.json(products);
  } catch (err) {
    console.error("GET /api/products:", err);
    return NextResponse.json(
      { error: "Failed to list products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products — Create product. Body: FormData with brand_id, name, price, optional description, stock_count, image (file).
 * Image is uploaded to blob (prefix "products").
 */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const brand_id = (formData.get("brand_id") as string | null)?.trim();
  const name = (formData.get("name") as string | null)?.trim();
  const priceRaw = formData.get("price") as string | null;
  const description = (formData.get("description") as string | null)?.trim() || null;
  const stock_countRaw = formData.get("stock_count") as string | null;
  const imageFile = formData.get("image") as File | null;

  if (!brand_id) {
    return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const price = priceRaw != null ? parseFloat(priceRaw) : NaN;
  if (Number.isNaN(price) || price < 0) {
    return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
  }
  const stock_count = stock_countRaw != null ? parseInt(stock_countRaw, 10) : 0;
  const stock = Number.isNaN(stock_count) || stock_count < 0 ? 0 : stock_count;

  let image_url: string | null = null;
  if (imageFile && imageFile.size > 0 && imageFile.name) {
    try {
      image_url = await uploadFile(imageFile, "products");
    } catch (err) {
      const message = err instanceof UploadError ? err.message : "Image upload failed";
      const status = err instanceof UploadError ? err.status : 400;
      return NextResponse.json({ error: message }, { status });
    }
  }

  try {
    await initDb();
    const product = await createProduct({
      brand_id,
      name,
      description,
      price,
      stock_count: stock,
      image_url,
    });
    return NextResponse.json(product);
  } catch (err) {
    console.error("POST /api/products:", err);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
