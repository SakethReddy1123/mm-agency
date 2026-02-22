import { cookies } from "next/headers";

/** Returns true if the current request is from an authenticated user. */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("mm-auth")?.value === "true";
}
