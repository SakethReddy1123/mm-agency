import { registerAction } from "./actions";
import { RegisterForm } from "./RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex w-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">
            Create account
          </h1>
          <p className="mb-8 text-zinc-500">
            Passwords are stored hashed in the database.
          </p>
          <RegisterForm registerAction={registerAction} />
          <p className="mt-4 text-center text-sm text-zinc-500">
            <Link href="/login" className="text-emerald-400 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
