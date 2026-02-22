"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserByEmail, verifyPassword } from "@/lib/models/user";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  if (!email?.trim()) {
    return { error: "Email is required" };
  }
  if (!password?.trim()) {
    return { error: "Password is required" };
  }

  const user = await findUserByEmail(email.trim());
  if (!user) {
    return { error: "Invalid email or password" };
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    return { error: "Invalid email or password" };
  }

  const cookieStore = await cookies();
  cookieStore.set("mm-auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  redirect("/");
}
