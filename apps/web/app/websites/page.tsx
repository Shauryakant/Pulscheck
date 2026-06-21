"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import AddWebsiteModal from "../../components/add-website-modal";

type WebsiteRow = {
  id: string;
  url: string;
  timeAdded: string;
  status: "Up" | "Down" | "Unknown";
  latencyMs: number | null;
  avgResponseTimeMs: number | null;
};

export default function WebsitesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<WebsiteRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  const fetchWebsites = async () => {
    const token = window.localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/api/v1/websites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Failed to load websites.");
      }

      const payload = (await response.json()) as {
        data: Array<{
          id: string;
          url: string;
          timeAdded: string;
          status: "Up" | "Down" | "Unknown";
          latencyMs: number | null;
          avgResponseTimeMs: number | null;
        }>;
      };

      const normalized = payload.data.map((item) => {
        return {
          id: item.id,
          url: item.url,
          timeAdded: item.timeAdded,
          status: item.status,
          latencyMs: item.latencyMs,
          avgResponseTimeMs: item.avgResponseTimeMs,
        };
      });

      setRows(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites(); // Initial fetch
    const intervalId = window.setInterval(() => {
      fetchWebsites(); // Poll every 5 seconds
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  if (!isAuthed) return null;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-violet-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <AddWebsiteModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onWebsiteAdded={(website) => {
            setRows((prev) => [website, ...prev]);
            setError(null);
          }}
        />
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
                <Link href="/">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner transition hover:bg-white/10 cursor-pointer">
                        <div className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                    </div>
                </Link>
                <p className="text-xs font-medium uppercase tracking-widest text-violet-400">
                Network Monitor
                </p>
            </div>
            <h1 className="font-heading mt-4 text-3xl font-bold text-white whitespace-nowrap">
              Active Endpoints
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              className="rounded-full border border-white/10 px-5 py-2 text-xs font-medium uppercase tracking-widest text-zinc-300 transition hover:bg-white/5 hover:text-white"
              type="button"
              onClick={() => {
                setError(null);
                fetchWebsites();
              }}
            >
              Refresh
            </button>
            <button
              className="rounded-full bg-violet-500 hover:bg-violet-600 px-5 py-2 text-xs font-medium uppercase tracking-widest text-white transition shadow-[0_0_15px_rgba(139,92,246,0.5)]"
              type="button"
              onClick={() => {
                setError(null);
                setModalOpen(true);
              }}
            >
              Add Endpoint
            </button>
            <button
              className="rounded-full border border-rose-500/30 px-5 py-2 text-xs font-medium uppercase tracking-widest text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
              type="button"
              onClick={() => {
                window.localStorage.removeItem("auth_token");
                router.replace("/");
              }}
            >
              Sign out
            </button>
          </div>
          <div className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            {rows.length} Active
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Monitored Endpoints
            </div>
            <div className="flex items-center gap-2">
                {loading && <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse"></div>}
                <div className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                {loading ? "Syncing..." : "Live"}
                </div>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div className="grid grid-cols-[1fr] gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-400">
              <span>Endpoint Target</span>
            </div>
            <div className="divide-y divide-white/5">
              {rows.map((row) => (
                <Link
                  key={row.id}
                  href={`/websites/${row.id}`}
                  className="group grid grid-cols-[1fr] gap-4 px-4 py-4 text-sm transition hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full shadow-[0_0_8px_currentColor] ${row.status === "Up" ? "bg-emerald-400 text-emerald-400" : row.status === "Down" ? "bg-rose-500 text-rose-500" : "bg-amber-500 text-amber-500"}`} />
                    <span className="font-mono text-sm text-zinc-300 group-hover:text-violet-300 transition-colors">
                        {row.url.replace(/^https?:\/\//, "")}
                    </span>
                  </div>
                </Link>
              ))}
              {!rows.length && !loading ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  No endpoints configured. Click "Add Endpoint" to start tracking.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
