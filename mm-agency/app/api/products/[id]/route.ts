import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import {
  getProductById,
  getProductRowById,
  updateProduct,
  deleteProduct,
} from "@/lib/models/product";
import { uploadFile, deleteBlobByUrl, UploadError } from "@/lib/upload";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  try {
    await initDb();
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (err) {
    console.error("GET /api/products/[id]:", err);
    return NextResponse.json(
      { error: "Failed to get product" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/[id] — Update product. Body: FormData with name, price, optional brand_id, description, stock_count, image (file), remove_image.
 * Image uploaded to blob (prefix "products"). Old blob deleted when replacing or removing image.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const name = (formData.get("name") as string | null)?.trim();
  const brand_id = (formData.get("brand_id") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim();
  const priceRaw = formData.get("price") as string | null;
  const stock_countRaw = formData.get("stock_count") as string | null;
  const removeImage = formData.get("remove_image") === "true" || formData.get("remove_image") === "1";
  const imageFile = formData.get("image") as File | null;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const price = priceRaw != null ? parseFloat(priceRaw) : NaN;
  if (Number.isNaN(price) || price < 0) {
    return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
  }
  const stock_count = stock_countRaw != null ? parseInt(stock_countRaw, 10) : undefined;
  const stock = stock_count != null && !Number.isNaN(stock_count) && stock_count >= 0 ? stock_count : undefined;

  try {
    await initDb();
    const existing = await getProductRowById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    let image_url: string | null | undefined = undefined;
    if (removeImage) {
      await deleteBlobByUrl(existing.image_url);
      image_url = null;
    } else if (imageFile && imageFile.size > 0 && imageFile.name) {
      await deleteBlobByUrl(existing.image_url);
      image_url = await uploadFile(imageFile, "products");
    }

    const product = await updateProduct(id, {
      name,
      ...(brand_id && { brand_id }),
      ...(description !== undefined && description !== null && { description: description || null }),
      price,
      ...(stock !== undefined && { stock_count: stock }),
      ...(image_url !== undefined && { image_url }),
    });
    const withBrand = await getProductById(id);
    return NextResponse.json(withBrand ?? product);
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PATCH /api/products/[id]:", err);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id] — Deletes product image from blob (if any) then deletes product.
 */
export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  try {
    await initDb();
    const product = await getProductRowById(id);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    await deleteBlobByUrl(product.image_url);
    const deleted = await deleteProduct(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/products/[id]:", err);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
