import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("mm-auth");
  cookieStore.delete("mm-user-id");
  const url = new URL(request.url);
  const loginUrl = new URL("/login", url.origin);
  return NextResponse.redirect(loginUrl, 303);
}
