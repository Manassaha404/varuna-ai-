"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useLogin } from "@/hook/auth/useLogin";

type LoginFormValues = {
  emailOrUsername: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { handleLogin, apiError, isLoggingIn, setApiError } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    await handleLogin(data);
  };

  function handleRegister() {
    router.push("/signup");
  }

  function handleBackHome() {
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="flex h-16 items-center justify-between border-b border-white/10 px-6">
        <div className="text-xl font-semibold tracking-tight">
          Varuna<span className="text-blue-400">AI</span>
        </div>

        <button
          type="button"
          onClick={handleBackHome}
          className="rounded-full border border-white/10 px-5 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
        >
          Back to Home
        </button>
      </nav>

      {/* Login */}
      <section className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>

            <p className="mt-2 text-sm text-zinc-500">
              Sign in to continue with VarunaAI
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* API Error */}
              {apiError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {apiError}
                </div>
              )}

              {/* Email or Username */}
              <div>
                <label
                  htmlFor="emailOrUsername"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Email or Username
                </label>

                <input
                  id="emailOrUsername"
                  type="text"
                  placeholder="you@example.com or username"
                  autoComplete="username"
                  {...register("emailOrUsername", {
                    required: "Email or username is required",
                  })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-blue-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-400/10"
                />

                {errors.emailOrUsername && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.emailOrUsername.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-blue-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-400/10"
                />

                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full rounded-full bg-blue-500 py-3.5 font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoggingIn ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Register */}
            <p className="mt-7 text-center text-sm text-zinc-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={handleRegister}
                className="font-medium text-blue-400 transition hover:text-blue-300"
              >
                Create account
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-zinc-700">
            By continuing, you agree to VarunaAI&apos;s Terms and Privacy
            Policy.
          </p>
        </div>
      </section>
    </main>
  );
}