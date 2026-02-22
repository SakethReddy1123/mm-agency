"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;

    if (!email) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Invalid email or password");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {error}
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
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3 pr-11 text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <HiOutlineEyeOff className="h-5 w-5" />
            ) : (
              <HiOutlineEye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-600 py-3 font-medium text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        Don’t have an account?{" "}
        <Link href="/register" className="text-emerald-400 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
