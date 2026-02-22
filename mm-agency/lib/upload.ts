import { put, del } from "@vercel/blob";

/** Max file size 4.5 MB (Vercel serverless limit). */
const MAX_SIZE = 4.5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export class UploadError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "UploadError";
  }
}

/**
 * Upload a file to Vercel Blob. Use as a common module for brand logo, etc.
 * @param file - The file to upload (e.g. from FormData)
 * @param pathPrefix - Optional path prefix (default "images")
 * @returns The public URL of the uploaded blob
 * @throws UploadError if file is invalid or upload fails
 */
export async function uploadFile(
  file: File,
  pathPrefix: string = "images"
): Promise<string> {
  if (!file || !(file instanceof File)) {
    throw new UploadError("Missing or invalid file", 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError(
      "Invalid type. Allowed: jpeg, png, gif, webp, svg",
      400
    );
  }

  if (file.size > MAX_SIZE) {
    throw new UploadError(
      "File too large (max 4.5 MB). Use client upload for larger files.",
      400
    );
  }

  const ext = file.name.split(".").pop() || "bin";
  const pathname = `${pathPrefix}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const blob = await put(pathname, file,{
    access:'public',
    addRandomSuffix: false,
  });

  return blob.url;
}

/** Vercel Blob URL pattern (e.g. https://xxx.public.blob.vercel-storage.com/...) */
const BLOB_URL_PATTERN = /^https:\/\/[^.]+\.(blob\.vercel-storage\.com|vercel-storage\.com)\//i;

/**
 * Delete a blob from Vercel Blob by URL. No-op if url is empty or not a Blob URL.
 * Does not throw; safe to call before deleting the DB record.
 */
export async function deleteBlobByUrl(url: string | null | undefined): Promise<void> {
  if (!url?.trim()) return;
  if (!BLOB_URL_PATTERN.test(url.trim())) return;
  try {
    await del(url.trim());
  } catch {
    // Ignore (e.g. already deleted or 404); brand delete should still succeed
  }
}
