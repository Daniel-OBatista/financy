import type { ReactElement } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function LoginPage(): ReactElement {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Falha ao entrar.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-md items-center">
      <div className="w-full rounded-[28px] border border-border/25 bg-card/35 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex items-center gap-3">
          <img
            src="/financy.png"
            alt="Financy"
            className="h-10 w-10 rounded-2xl border border-border/25 bg-card/50 object-contain p-2"
          />
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight">Entrar</h2>
            <p className="mt-0.5 text-sm text-muted">Acesse sua conta para ver suas finanças.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-extrabold text-muted">E-mail</label>
            <input
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-2xl border border-border/25 bg-card/40 px-4 py-3 text-sm text-fg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-muted">Senha</label>
            <input
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-2xl border border-border/25 bg-card/40 px-4 py-3 text-sm text-fg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-extrabold text-primaryFg shadow-lg shadow-primary/15 transition hover:brightness-110 disabled:opacity-60"
            type="submit"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-center text-xs text-muted">
            (Login local só para proteger as telas. Depois ligamos no GraphQL.)
          </p>
        </form>
      </div>
    </div>
  );
}