"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-emerald-600 py-3 font-medium text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({
  loginAction,
}: {
  loginAction: (prev: LoginState, formData: FormData) => Promise<LoginState>;
}) {
  const [state, formAction] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {state.error}
        </div>
      )}
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-zinc-400"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-zinc-400"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <SubmitButton />
      <p className="text-center text-sm text-zinc-500">
        Don’t have an account?{" "}
        <Link href="/register" className="text-emerald-400 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
