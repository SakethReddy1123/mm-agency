import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import * as brand from "@/lib/models/brand";
import { uploadFile, UploadError, deleteBlobByUrl } from "@/lib/upload";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  { params }: Params
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await brand.findById(id);
  if (!row) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PATCH(
  request: Request,
  { params }: Params
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const contentType = request.headers.get("content-type") ?? "";
  let name: string | undefined;
  let slug: string | null | undefined;
  let description: string | null | undefined;
  let logo_url: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    if (form.has("name")) name = (form.get("name") as string)?.trim() || undefined;
    if (form.has("slug")) slug = (form.get("slug") as string)?.trim() || null;
    if (form.has("description")) description = (form.get("description") as string)?.trim() || null;
    const logoFile = form.get("logo");
    if (logoFile instanceof File && logoFile.size > 0) {
      try {
        logo_url = await uploadFile(logoFile, "brands");
      } catch (e) {
        const err = e instanceof UploadError ? e : new UploadError("Upload failed", 500);
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
    }
  } else {
    try {
      const body = await request.json() as {
        name?: string;
        slug?: string;
        description?: string;
        logo_url?: string;
      };
      name = body.name?.trim();
      slug = body.slug !== undefined ? (body.slug.trim() || null) ?? undefined : undefined;
      description = body.description !== undefined ? (body.description.trim() || null) ?? undefined : undefined;
      logo_url = body.logo_url !== undefined ? (body.logo_url.trim() || null) ?? undefined : undefined;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  const row = await brand.updateBrand(id, {
    name,
    slug: slug !== undefined ? slug : undefined,
    description: description !== undefined ? description : undefined,
    logo_url: logo_url !== undefined ? logo_url : undefined,
  });

  if (!row) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function DELETE(
  _request: Request,
  { params }: Params
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await brand.findById(id);
  if (!row) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }
  await deleteBlobByUrl(row.logo_url);
  await brand.deleteBrand(id);
  return new NextResponse(null, { status: 204 });
}
