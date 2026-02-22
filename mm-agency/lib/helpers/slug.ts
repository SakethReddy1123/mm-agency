/**
 * Generate a URL-friendly slug from a string (e.g. brand name).
 * Lowercase, spaces to hyphens, only alphanumeric and hyphens.
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
