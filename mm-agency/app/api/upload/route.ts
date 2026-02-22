import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { uploadFile, UploadError } from "@/lib/upload";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing or invalid file (use field name 'file')" },
      { status: 400 }
    );
  }

  try {
    const url = await uploadFile(file);
    return NextResponse.json({ url });
  } catch (e) {
    const err = e instanceof UploadError ? e : new UploadError("Upload failed", 500);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
