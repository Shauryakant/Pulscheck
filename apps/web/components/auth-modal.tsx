import { useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "signin" | "signup";

type AuthModalProps = {
  isOpen: boolean;
  mode: AuthMode;
  onClose: () => void;
  onToggleMode: () => void;
};

export default function AuthModal({
  isOpen,
  mode,
  onClose,
  onToggleMode,
}: AuthModalProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const endpoint = mode === "signup" ? "/api/v1/signup" : "/api/v1/signin";
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Request failed.");
      }

      const payload = (await response.json()) as { token?: string };
      if (payload.token) {
        window.localStorage.setItem("auth_token", payload.token);
      }

      setFullName("");
      setEmail("");
      setPassword("");
      onClose();
      router.push("/websites");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#09090b] p-8 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute -inset-[1px] -z-10 rounded-3xl bg-gradient-to-b from-violet-500/20 to-transparent opacity-50" />
        <button
          className="absolute right-5 top-5 rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-zinc-500 transition hover:bg-white/5 hover:text-white"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-violet-400">
          <div className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          PulseCheck Access
        </div>
        <h3 className="font-heading mt-4 text-2xl font-bold text-white">
          {mode === "signin" ? "Sign in" : "Create your account"}
        </h3>
        <p className="mt-2 text-sm text-zinc-400">
          {mode === "signin"
            ? "Access your monitoring command center."
            : "Deploy your global monitoring infrastructure."}
        </p>

        <div className="mt-8 grid gap-4">
          {mode === "signup" ? (
            <input
              className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:bg-white/10 focus:ring-1 focus:ring-violet-500/50"
              placeholder="Full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              type="text"
            />
          ) : null}
          <input
            className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:bg-white/10 focus:ring-1 focus:ring-violet-500/50"
            placeholder="Work email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
          />
          <input
            className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:bg-white/10 focus:ring-1 focus:ring-violet-500/50"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
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
          {submitting
            ? "Authenticating..."
            : mode === "signin"
            ? "Sign in to Dashboard"
            : "Provision Account"}
        </button>

        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-6 text-xs font-medium uppercase tracking-widest text-zinc-500">
          <span>{mode === "signin" ? "New here?" : "Already provisioned?"}</span>
          <button
            className="text-white hover:text-violet-400 transition-colors"
            onClick={() => {
              setError(null);
              onToggleMode();
            }}
            type="button"
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
