import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ErrorBanner from "../components/ErrorBanner";
import { extractError } from "../lib/extractError";
import { roleHome } from "../lib/navigation";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { role } = await login(email, password);
      navigate(roleHome(role));
    } catch (err) {
      setError(extractError(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--app-bg)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-[-2rem] h-72 w-72 rounded-full bg-[var(--glow-teal)] blur-3xl" />
        <div className="absolute right-[-3rem] top-24 h-80 w-80 rounded-full bg-[var(--glow-gold)] blur-3xl" />
        <div className="absolute bottom-[-5rem] left-1/3 h-72 w-72 rounded-full bg-[var(--glow-rose)] blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[36px] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_120px_rgba(15,23,42,0.20)] sm:px-8 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-teal-300">
            ADS Dental Surgery Ops
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Office
              </p>
              <p className="mt-2 text-lg font-semibold">
                Scheduling, requests, billing
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Dentists
              </p>
              <p className="mt-2 text-lg font-semibold">
                Manage the day’s chairside flow
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Patients
              </p>
              <p className="mt-2 text-lg font-semibold">
                Appointments, requests, balances
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700">
            Sign In
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-slate-900">
            Welcome back
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Enter your clinic credentials to access your secure workspace.
          </p>

          <div className="mt-6">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Access workspace"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
