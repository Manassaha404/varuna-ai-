"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useUpdateProfile } from "@/hook/auth/useUpdateProfile";

type UpdateProfileFormValues = {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string;
};

export default function UpdateProfilePage() {
  const router = useRouter();
  const { handleUpdateProfile, apiError, isUpdatingProfile, setApiError } =
    useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>();

  const onSubmit = async (data: UpdateProfileFormValues) => {
    setApiError(null);
    // Strip empty strings so only changed fields are sent
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== ""),
    ) as UpdateProfileFormValues;
    await handleUpdateProfile(payload);
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
            <h1 className="auth-title">Update Profile</h1>
            <p className="auth-subtitle">
              Fill in only the fields you want to change.
            </p>
          </div>

          {/* Card */}
          <div className="auth-card">
            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
              {apiError && (
                <div className="auth-alert-error">{apiError}</div>
              )}

              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="auth-label">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    autoComplete="given-name"
                    {...register("firstName")}
                    className="auth-input"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="auth-label">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    autoComplete="family-name"
                    {...register("lastName")}
                    className="auth-input"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="auth-label">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  autoComplete="username"
                  {...register("username", {
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]*$/,
                      message: "Only letters, numbers, and underscores allowed",
                    },
                  })}
                  className="auth-input"
                />
                {errors.username && (
                  <p className="auth-field-error">{errors.username.message}</p>
                )}
              </div>

              {/* Avatar URL */}
              <div>
                <label htmlFor="avatarUrl" className="auth-label">
                  Avatar URL
                </label>
                <input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  {...register("avatarUrl", {
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: "Enter a valid URL starting with http(s)://",
                    },
                  })}
                  className="auth-input"
                />
                {errors.avatarUrl && (
                  <p className="auth-field-error">{errors.avatarUrl.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="auth-btn-primary"
              >
                {isUpdatingProfile ? "Saving…" : "Save Changes"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-zinc-500">
              Want to change your password?{" "}
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="auth-btn-link"
              >
                Reset it here
              </button>
            </p>
          </div>

          <p className="auth-footer">
            Changes are reflected immediately across VarunaAI.
          </p>
        </div>
      </section>
    </main>
  );
}
