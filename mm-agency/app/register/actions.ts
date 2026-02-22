"use server";

import { redirect } from "next/navigation";
import { createUser, findUserByEmail } from "@/lib/models/user";

export type RegisterState = {
  error?: string;
};

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const name = (formData.get("name") as string | null)?.trim() || null;

  if (!email?.trim()) {
    return { error: "Email is required" };
  }
  if (!password?.trim()) {
    return { error: "Password is required" };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const existing = await findUserByEmail(email.trim());
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  await createUser(email.trim(), password, name);
  redirect("/login");
}
