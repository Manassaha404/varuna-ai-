"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useSignup } from "@/hook/auth/useSignup";

type RegisterFormValues = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { handleSignup, apiError, apiSuccess, isSigningUp, setApiError } =
    useSignup();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  const password = watch("password");

  const onSubmit = async (data: RegisterFormValues) => {
    setApiError(null);
    const { confirmPassword, ...signupData } = data;
    await handleSignup(signupData);
  };

  function handleLogin() {
    router.push("/login");
  }

  function handleBackHome() {
    router.push("/");
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-blue-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-400/10";

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

      {/* Register */}
      <section className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Create your account
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Get started with VarunaAI
            </p>
          </div>

          {/* Register Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* API Error */}
              {apiError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {apiError}
                </div>
              )}

              {/* API Success */}
              {apiSuccess && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                  {apiSuccess}
                </div>
              )}

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-medium text-zinc-300"
                  >
                    First Name
                  </label>

                  <input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    autoComplete="given-name"
                    {...register("firstName", {
                      required: "First name is required",
                    })}
                    className={inputClass}
                  />

                  {errors.firstName && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-medium text-zinc-300"
                  >
                    Last Name
                  </label>

                  <input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    autoComplete="family-name"
                    {...register("lastName", {
                      required: "Last name is required",
                    })}
                    className={inputClass}
                  />

                  {errors.lastName && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Username
                </label>

                <input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  autoComplete="username"
                  {...register("username", {
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message:
                        "Username can only contain letters, numbers, and underscores",
                    },
                  })}
                  className={inputClass}
                />

                {errors.username && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                  className={inputClass}
                />

                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.email.message}
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
                  autoComplete="new-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                  className={inputClass}
                />

                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === password || "Passwords do not match",
                  })}
                  className={inputClass}
                />

                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={isSigningUp}
                className="w-full rounded-full bg-blue-500 py-3.5 font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSigningUp ? "Creating account…" : "Create Account"}
              </button>
            </form>

            {/* Login */}
            <p className="mt-7 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={handleLogin}
                className="font-medium text-blue-400 transition hover:text-blue-300"
              >
                Sign in
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-zinc-700">
            By creating an account, you agree to VarunaAI&apos;s Terms and
            Privacy Policy.
          </p>
        </div>
      </section>
    </main>
  );
}