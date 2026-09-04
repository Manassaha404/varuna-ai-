"use client";

import { useRouter } from "next/navigation";
import { useUserInfoStore } from "@/store/userInfoStore";
import { useLogout } from "@/hook/auth/useLogout";

export default function Home() {
  const router = useRouter();
  const { userId } = useUserInfoStore();
  const { handleLogout, isLoggingOut } = useLogout();

  const isLoggedIn = Boolean(userId);

  function handleGetStarted() {
    router.push("/login");
  }

  function handleExplore() {
    router.push("/chat");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="flex h-16 items-center justify-between border-b border-white/10 px-6 sm:px-10">
        <div className="text-xl font-semibold tracking-tight">
          Varuna<span className="text-blue-400">AI</span>
        </div>

        {isLoggedIn ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            {isLoggingOut ? "Signing out…" : "Sign Out"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGetStarted}
            className="rounded-full bg-blue-500 px-5 py-2 text-sm font-medium transition hover:bg-blue-400"
          >
            Get Started
          </button>
        )}
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden px-6">
        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-7 mt-10 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-300">
            <span className="text-blue-400">✦</span>
            Agentic AI for Marine Intelligence
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
            Understand the
            <br />
            <span className="text-blue-400">ocean.</span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
            Ask questions about the sea in natural language. VarunaAI
            combines satellite data, ocean conditions, weather, tides,
            fishing zones, and geospatial intelligence to help you make
            smarter maritime decisions.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* Login */}
            <button
              type="button"
              onClick={handleGetStarted}
              className="w-full rounded-full bg-blue-500 px-8 py-3.5 font-medium transition hover:bg-blue-400 sm:w-auto"
            >
              Start with VarunaAI
            </button>

            {/* Chat */}
            <button
              type="button"
              onClick={handleExplore}
              className="w-full rounded-full border border-white/10 px-8 py-3.5 font-medium text-zinc-300 transition hover:bg-white/10 sm:w-auto"
            >
              Demo Chat
            </button>
          </div>

          {/* Example Query */}
          <div className="mx-auto mt-16 max-w-3xl">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-600">
              Ask VarunaAI
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left shadow-2xl">
              {/* User message */}
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                  ✦
                </div>

                <div>
                  <p className="text-sm text-zinc-500">You</p>

                  <p className="mt-1 text-sm leading-6 text-zinc-200 sm:text-base">
                    Where is the nearest Potential Fishing Zone today
                    and is it safe to go there?
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="my-5 h-px bg-white/10" />

              {/* AI message */}
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm">
                  V
                </div>

                <div>
                  <p className="text-sm text-blue-400">VarunaAI</p>

                  <p className="mt-1 text-sm leading-6 text-zinc-400 sm:text-base">
                    I’ll analyze nearby fishing zones, sea surface
                    temperature, chlorophyll, weather, wave conditions,
                    and marine safety information to find the best
                    available option.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mb-16 mt-12 grid gap-4 text-left sm:grid-cols-3">
            <Feature
              icon="◎"
              title="Fishing Intelligence"
              description="Discover potentially productive fishing zones using satellite and ocean data."
            />

            <Feature
              icon="⌁"
              title="Marine Safety"
              description="Understand waves, wind, lightning, cyclones, and hazardous sea conditions."
            />

            <Feature
              icon="⌖"
              title="Geospatial AI"
              description="Analyze locations, routes, boundaries, restricted waters, and marine zones."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-blue-400/20 hover:bg-white/[0.05]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-lg text-blue-400">
        {icon}
      </div>

      <h3 className="font-medium text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}