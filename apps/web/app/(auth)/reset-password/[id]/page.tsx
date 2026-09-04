"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useResetPassword } from "@/hook/auth/useResetPassword";
import { useResendOtp } from "@/hook/auth/useResendOtp";

type ResetPasswordFormValues = {
  otp: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { handleResetPassword, apiError, isSubmitting, isSuccess, setApiError } =
    useResetPassword();
  const { handleResend, isResending } = useResendOtp();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>();

  const newPassword = watch("newPassword");

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setApiError(null);
    await handleResetPassword({ id, otp: data.otp, newPassword: data.newPassword });
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
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">
              Enter the OTP we sent you and choose a new password.
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
                  Password reset! Redirecting to sign in…
                </div>
              )}

              {/* OTP */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="otp" className="auth-label mb-0">
                    One-time code
                  </label>

                  <button
                    type="button"
                    disabled={isResending}
                    onClick={() => handleResend(id)}
                    className="text-xs text-blue-400 transition hover:text-blue-300 disabled:opacity-50"
                  >
                    {isResending ? "Resending…" : "Resend code"}
                  </button>
                </div>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  {...register("otp", {
                    required: "OTP is required",
                    minLength: { value: 6, message: "OTP must be 6 digits" },
                    maxLength: { value: 6, message: "OTP must be 6 digits" },
                    pattern: {
                      value: /^\d{6}$/,
                      message: "OTP must contain only digits",
                    },
                  })}
                  className="auth-input tracking-[0.4em]"
                />

                {errors.otp && (
                  <p className="auth-field-error">{errors.otp.message}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="auth-label">
                  New Password
                </label>

                <input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("newPassword", {
                    required: "New password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                  className="auth-input"
                />

                {errors.newPassword && (
                  <p className="auth-field-error">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="auth-label">
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
                      value === newPassword || "Passwords do not match",
                  })}
                  className="auth-input"
                />

                {errors.confirmPassword && (
                  <p className="auth-field-error">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-btn-primary"
              >
                {isSubmitting ? "Resetting…" : "Reset Password"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-zinc-500">
              Back to{" "}
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
