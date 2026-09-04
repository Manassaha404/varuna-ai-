"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useChangeUsername } from "@/hook/auth/useChangeUsername";

type ChangeUsernameFormValues = {
  newUsername: string;
};

export default function ChangeUsernamePage() {
  const router = useRouter();
  const { handleChangeUsername, apiError, isChangingUsername, setApiError } =
    useChangeUsername();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangeUsernameFormValues>();

  const onSubmit = async (data: ChangeUsernameFormValues) => {
    setApiError(null);
    await handleChangeUsername(data.newUsername);
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
            <h1 className="auth-title">Change Username</h1>
            <p className="auth-subtitle">
              Choose a new unique username for your account.
            </p>
          </div>

          {/* Card */}
          <div className="auth-card">
            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
              {apiError && (
                <div className="auth-alert-error">{apiError}</div>
              )}

              {/* New Username */}
              <div>
                <label htmlFor="newUsername" className="auth-label">
                  New Username
                </label>

                <input
                  id="newUsername"
                  type="text"
                  placeholder="newusername"
                  autoComplete="username"
                  {...register("newUsername", {
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message:
                        "Only letters, numbers, and underscores allowed",
                    },
                  })}
                  className="auth-input"
                />

                {errors.newUsername && (
                  <p className="auth-field-error">
                    {errors.newUsername.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isChangingUsername}
                className="auth-btn-primary"
              >
                {isChangingUsername ? "Updating…" : "Update Username"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-zinc-500">
              Changed your mind?{" "}
              <button
                type="button"
                onClick={() => router.push("/")}
                className="auth-btn-link"
              >
                Go home
              </button>
            </p>
          </div>

          <p className="auth-footer">
            Your new username will be visible to other users immediately.
          </p>
        </div>
      </section>
    </main>
  );
}
