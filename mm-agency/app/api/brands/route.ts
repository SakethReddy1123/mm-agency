import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import * as brand from "@/lib/models/brand";
import { uploadFile, UploadError } from "@/lib/upload";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await brand.find();
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let name: string;
  let slug: string | undefined;
  let description: string | undefined;
  let logo_url: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    name = (form.get("name") as string)?.trim() ?? "";
    slug = (form.get("slug") as string)?.trim() || undefined;
    description = (form.get("description") as string)?.trim() || undefined;
    const logoFile = form.get("logo");
    if (logoFile instanceof File && logoFile.size > 0) {
      try {
        logo_url = await uploadFile(logoFile, "brands");
      } catch (e) {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          return NextResponse.json(
            { error: "Image upload not configured. Set BLOB_READ_WRITE_TOKEN in .env or leave logo empty." },
            { status: 503 }
          );
        }
        const msg = e instanceof Error ? e.message : "Upload failed";
        const status = e instanceof UploadError ? e.status : 500;
        return NextResponse.json({ error: msg }, { status });
      }
    }
  } else {
    try {
      const body = await request.json() as { name?: string; slug?: string; description?: string; logo_url?: string };
      name = body.name?.trim() ?? "";
      slug = body.slug?.trim() || undefined;
      description = body.description?.trim() || undefined;
      logo_url = body.logo_url?.trim() || undefined;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  try {
    const row = await brand.createBrand({
      name,
      slug,
      description,
      logo_url,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create brand";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
