"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type WebsiteTick = {
  id: string;
  response_time_ms: number;
  status: "Up" | "Down" | "Unknown";
  region_id: string;
  createdAt: string;
};

type WebsiteStatusResponse = {
  id: string;
  url: string;
  timeAdded: string;
  ticks: WebsiteTick[];
};

export default function WebsiteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const websiteId = Array.isArray(params.websiteId)
    ? params.websiteId[0]
    : params.websiteId;
  const [website, setWebsite] = useState<WebsiteStatusResponse | null>(null);
  const [ticks, setTicks] = useState<WebsiteTick[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/");
    } else {
      setIsAuthed(true);
    }
  }, [router]);

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const fetchStatus = async () => {
    const token = window.localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiBase}/api/v1/status/${websiteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Failed to load status.");
      }

      const payload = (await response.json()) as WebsiteStatusResponse;
      setWebsite(payload);
      setTicks(payload.ticks ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchStatus();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [websiteId]);

  if (!isAuthed) return null;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-violet-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
                <Link href="/websites">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner transition hover:bg-white/10 cursor-pointer">
                        <div className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                    </div>
                </Link>
                <p className="text-xs font-medium uppercase tracking-widest text-violet-400">
                Endpoint Status
                </p>
            </div>
            <h1 className="font-heading mt-4 text-3xl font-bold text-white">
              {website?.url?.replace(/^https?:\/\//, "") || "Loading Target..."}
            </h1>
            <div className="mt-2 text-xs font-mono tracking-wider text-zinc-500">
              {websiteId}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              className="rounded-full border border-white/10 px-5 py-2 text-xs font-medium uppercase tracking-widest text-zinc-300 transition hover:bg-white/5 hover:text-white"
              href="/websites"
            >
              Back
            </Link>
            <button
              className="rounded-full border border-white/10 px-5 py-2 text-xs font-medium uppercase tracking-widest text-zinc-300 transition hover:bg-white/5 hover:text-white"
              type="button"
              onClick={fetchStatus}
            >
              Refresh Data
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        ) : null}

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Telemetry Logs
            </div>
            <div className="flex items-center gap-2">
                {loading && <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse"></div>}
                <div className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                {loading ? "Syncing..." : `${ticks.length} logs captured`}
                </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_1fr] gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-400">
              <span>Timestamp</span>
              <span>Status</span>
              <span>Latency</span>
              <span>Node Region</span>
            </div>
            <div className="divide-y divide-white/5">
              {ticks.map((tick) => (
                <div
                  key={tick.id}
                  className="group grid grid-cols-[1.1fr_0.8fr_0.8fr_1fr] items-center gap-4 px-4 py-4 text-sm transition hover:bg-white/5"
                >
                  <div className="font-mono text-xs text-zinc-400">
                    {new Date(tick.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest ${
                        tick.status === "Up"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : tick.status === "Down"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${tick.status === "Up" ? "bg-emerald-400" : tick.status === "Down" ? "bg-rose-400" : "bg-amber-400"}`} />
                      {tick.status}
                    </span>
                  </div>
                  <div className="font-mono text-zinc-300">
                    {tick.response_time_ms} ms
                  </div>
                  <div className="font-mono text-xs text-zinc-500">{tick.region_id}</div>
                </div>
              ))}
              {!ticks.length && !loading ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  No telemetry data collected yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
