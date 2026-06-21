import { useState } from "react";

type WebsiteRow = {
  id: string;
  url: string;
  timeAdded: string;
  status: "Up" | "Down" | "Unknown";
  latencyMs: number | null;
  avgResponseTimeMs: number | null;
};

type AddWebsiteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onWebsiteAdded: (website: WebsiteRow) => void;
};

export default function AddWebsiteModal({
  isOpen,
  onClose,
  onWebsiteAdded,
}: AddWebsiteModalProps) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
    "http://localhost:3000";


  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    if (!websiteUrl.trim()) {
      setError("Website URL is required.");
      return;
    }

    const token = window.localStorage.getItem("auth_token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/api/v1/website`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: websiteUrl.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Failed to add website.");
      }

      const payload = (await response.json()) as { id?: string };
      onWebsiteAdded({
        id: payload.id || `temp-${Date.now()}`,
        url: websiteUrl.trim(),
        timeAdded: new Date().toISOString(),
        status: "Unknown",
        latencyMs: null,
        avgResponseTimeMs: null,
      });

      setWebsiteUrl("");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#09090b] p-8 shadow-2xl">
        <div className="absolute -inset-[1px] -z-10 rounded-3xl bg-gradient-to-b from-violet-500/20 to-transparent opacity-50" />
        <button
          className="absolute right-5 top-5 rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-zinc-500 transition hover:bg-white/5 hover:text-white"
          onClick={() => {
            setWebsiteUrl("");
            setError(null);
            setSubmitting(false);
            onClose();
          }}
          type="button"
        >
          Close
        </button>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-violet-400">
          <div className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          PulseCheck Engine
        </div>
        <h2 className="font-heading mt-4 text-2xl font-bold text-white">
          Deploy Target Endpoint
        </h2>
        <div className="mt-6 grid gap-4">
          <input
            className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:bg-white/10 focus:ring-1 focus:ring-violet-500/50"
            placeholder="https://example.com"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            type="url"
          />
        </div>
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        ) : null}
        <button
          className="mt-6 w-full rounded-full bg-violet-500 py-3 text-xs font-medium uppercase tracking-widest text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition hover:bg-violet-600 hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Deploying..." : "Add Endpoint"}
        </button>
      </div>
    </div>
  );
}
