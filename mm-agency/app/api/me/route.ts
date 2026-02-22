import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findUserById } from "@/lib/models/user";

export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("mm-auth")?.value;
  const userId = cookieStore.get("mm-user-id")?.value;

  if (auth !== "true" || !userId) {
    return NextResponse.json({ user: null });
  }

  const user = await findUserById(userId);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
