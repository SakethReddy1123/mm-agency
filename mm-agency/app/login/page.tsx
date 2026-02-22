import { loginAction } from "./actions";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Left: Animated panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-cyan-950/80" />
        <div className="absolute inset-0 animate-gradient-shift bg-[length:400%_400%] bg-gradient-to-br from-emerald-600/20 via-transparent to-cyan-600/20" />
        <div className="absolute left-1/4 top-1/4 h-72 w-72 animate-float rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 h-96 w-96 animate-float-delayed rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 animate-pulse-slow rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white/95">
              MM Agency
            </h2>
            <p className="mt-3 max-w-sm text-zinc-400">
              Welcome back. Sign in to access your dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-white">MM Agency</h1>
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">
            Sign in
          </h1>
          <p className="mb-8 text-zinc-500">
            Enter your credentials to continue.
          </p>
          <LoginForm loginAction={loginAction} />
        </div>
      </div>
    </div>
  );
}
