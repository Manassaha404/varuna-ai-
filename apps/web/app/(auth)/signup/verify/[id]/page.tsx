"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useVerifySignUpOtp } from "@/hook/auth/useVerifySignUpOtp";
import { useResendOtp } from "@/hook/auth/useResendOtp";

export default function VerifyOtpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { handleVerify, isPending } = useVerifySignUpOtp();
  const { handleResend, isResending } = useResendOtp();

  const [otp, setOtp] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    if (/^\d*$/.test(value) && value.length <= 6) {
      setOtp(value);
      setLocalError(null);
      // Auto-submit when 6 digits are entered
      if (value.length === 6) {
        handleVerify(id, value);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setLocalError("Please enter the complete 6-digit code.");
      return;
    }
    handleVerify(id, otp);
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
            <h1 className="auth-title">Verify your email</h1>
            <p className="auth-subtitle">
              We sent a 6-digit code to your email. Enter it below.
            </p>
          </div>

          {/* Card */}
          <div className="auth-card">
            <form onSubmit={handleSubmit} className="auth-form">
              {localError && (
                <div className="auth-alert-error">{localError}</div>
              )}

              {/* OTP input */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="otp" className="auth-label mb-0">
                    Verification code
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
                  value={otp}
                  onChange={(e) => handleChange(e.target.value)}
                  maxLength={6}
                  placeholder="123456"
                  className="auth-input text-center text-xl tracking-[0.5em]"
                />

                {/* Progress dots */}
                <div className="mt-3 flex justify-center gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-6 rounded-full transition-all duration-200 ${
                        i < otp.length ? "bg-blue-400" : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || otp.length < 6}
                className="auth-btn-primary"
              >
                {isPending ? "Verifying…" : "Verify Email"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-zinc-500">
              Wrong account?{" "}
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="auth-btn-link"
              >
                Back to sign up
              </button>
            </p>
          </div>

          <p className="auth-footer">
            The code expires in 10 minutes. Check your spam folder if you
            don&apos;t see it.
          </p>
        </div>
      </section>
    </main>
  );
}
