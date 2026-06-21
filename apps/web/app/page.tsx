"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import AuthModal from "../components/auth-modal";

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [isAuthed, setIsAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAuthed(Boolean(window.localStorage.getItem("auth_token")));
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-violet-500/30">
      <AuthModal
        isOpen={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onToggleMode={() =>
          setAuthMode(authMode === "signin" ? "signup" : "signin")
        }
      />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-96 w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.15),transparent_60%)]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.1),transparent_65%)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-10">
          <header className="fade-up flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner">
                <div className="h-3 w-3 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
              </div>
              <div className="font-heading text-lg font-bold tracking-wide text-zinc-100">
                PulseCheck
              </div>
            </div>
            <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
              <a className="transition hover:text-white" href="#capabilities">
                Platform
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                className="rounded-full border border-white/10 px-6 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
                href="/websites"
              >
                Dashboard
              </Link>
              {mounted && isAuthed ? (
                <button
                  className="rounded-full bg-white px-6 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                  onClick={() => {
                    window.localStorage.removeItem("auth_token");
                    setIsAuthed(false);
                  }}
                  type="button"
                >
                  Sign out
                </button>
              ) : mounted ? (
                <button
                  className="rounded-full bg-white px-6 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthOpen(true);
                  }}
                  type="button"
                >
                  Login
                </button>
              ) : (
                <div className="w-24"></div>
              )}
            </div>
          </header>

          <section className="mt-20 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="fade-up fade-up-delay-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500"></span>
                </span>
                Now with global edge nodes
              </div>
              <h1 className="font-heading mt-6 text-5xl leading-[1.1] text-white md:text-6xl">
                Uptime monitoring for the modern edge.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                PulseCheck delivers real-time monitoring, deep latency insights, and
                instant incident response. Keep your services online and your engineers sleeping soundly.
              </p>
              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-8 text-sm">
                <div>
                  <div className="font-heading text-3xl font-bold text-white">99.99%</div>
                  <div className="mt-2 text-zinc-500">Target uptime</div>
                </div>
                <div>
                  <div className="font-heading text-3xl font-bold text-white">&lt;50ms</div>
                  <div className="mt-2 text-zinc-500">P99 Latency</div>
                </div>
                <div>
                  <div className="font-heading text-3xl font-bold text-white">24/7</div>
                  <div className="mt-2 text-zinc-500">Active tracking</div>
                </div>
              </div>
            </div>

            <div className="fade-up fade-up-delay-2 relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
              <div className="absolute -inset-[1px] -z-10 rounded-3xl bg-gradient-to-b from-violet-500/20 to-transparent opacity-50" />
              <div className="flex items-center justify-between border-b border-white/10 pb-4 text-xs font-medium uppercase tracking-widest text-zinc-500">
                <span>Network Status</span>
                <span className="text-violet-400">US-East-1</span>
              </div>
              <div className="mt-8 rounded-2xl border border-white/10 bg-black/40">
                <div className="border-b border-white/10 px-6 py-4 text-xs font-medium text-zinc-400">
                  Global Endpoints
                </div>
                <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr] gap-4 px-6 py-3 text-[10px] uppercase tracking-widest text-zinc-600">
                  <span>Target</span>
                  <span>Status</span>
                  <span>Latency</span>
                </div>
                {[
                  {
                    url: "api.pulsecheck.dev",
                    status: "Operational",
                    latency: "12ms",
                  },
                  {
                    url: "auth.pulsecheck.dev",
                    status: "Operational",
                    latency: "18ms",
                  },
                  {
                    url: "billing.pulsecheck.dev",
                    status: "Degraded",
                    latency: "840ms",
                  },
                ].map((row) => (
                  <div
                    key={row.url}
                    className="grid grid-cols-[1.4fr_0.7fr_0.7fr] items-center gap-4 border-t border-white/5 px-6 py-4 text-sm"
                  >
                    <span className="font-medium text-zinc-200">{row.url}</span>
                    <span className="flex items-center gap-2 text-xs font-medium">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          row.status === "Operational"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <span
                        className={
                          row.status === "Operational"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      >
                        {row.status}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-zinc-400">{row.latency}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <section id="capabilities" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
          <div className="fade-up">
            <h2 className="font-heading text-4xl text-white">
              Built for engineering velocity.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-400">
              Stop guessing if your services are online. PulseCheck provides sub-second monitoring, distributed tracing, and immediate alerts right to your workflow.
            </p>
          </div>
          <div className="fade-up fade-up-delay-1 grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Global Network",
                body: "Ping your endpoints from edges across the world to verify true availability.",
              },
              {
                title: "Sub-second Precision",
                body: "Record response times with incredible accuracy to catch subtle performance drops.",
              },
              {
                title: "Instant Alerts",
                body: "Get notified in Slack, Discord, or SMS the moment an anomaly is detected.",
              },
              {
                title: "Zero-Trust Security",
                body: "All metrics and dashboards are secured with end-to-end encryption and JWTs.",
              },
            ].map((item) => (
              <div key={item.title} className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10">
                <h3 className="font-heading text-lg font-medium text-white group-hover:text-violet-400 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black mt-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-xs uppercase tracking-widest text-zinc-600 md:flex-row md:items-center md:justify-between">
          <span>PulseCheck Inc.</span>
          <span>Fast. Secure. Reliable.</span>
        </div>
      </footer>
    </div>
  );
}
