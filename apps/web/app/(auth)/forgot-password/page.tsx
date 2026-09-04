"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useForgotPassword } from "@/hook/auth/useForgotPassword";

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { handleForgotPassword, apiError, isSubmitting, isSuccess, setApiError } =
    useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>();

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setApiError(null);
    await handleForgotPassword(data);
  };

  return (
    <main className="auth-page">
      {/* Navbar */}
      <nav className="auth-nav">
        <div className="auth-nav-logo">
          Varuna<span>AI</span>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="auth-nav-btn"
        >
          Back to Home
        </button>
      </nav>

      {/* Content */}
      <section className="auth-section">
        <div className="auth-container">
          {/* Header */}
          <div className="auth-header">
            <h1 className="auth-title">Forgot your password?</h1>
            <p className="auth-subtitle">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {/* Card */}
          <div className="auth-card">
            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
              {apiError && (
                <div className="auth-alert-error">{apiError}</div>
              )}

              {isSuccess && (
                <div className="auth-alert-success">
                  Reset link sent! Check your inbox.
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="auth-label">
                  Email address
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
                  className="auth-input"
                />

                {errors.email && (
                  <p className="auth-field-error">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-btn-primary"
              >
                {isSubmitting ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-zinc-500">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="auth-btn-link"
              >
                Sign in
              </button>
            </p>
          </div>

          <p className="auth-footer">
            By continuing, you agree to VarunaAI&apos;s Terms and Privacy Policy.
          </p>
        </div>
      </section>
    </main>
  );
}
