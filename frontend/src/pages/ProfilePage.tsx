import type { ReactElement, ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Mail, User2, LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
};

type AuthShape = {
  user?: AuthUser | null;
  signOut: () => Promise<void> | void;
  updateProfile?: (input: { name: string }) => Promise<void>;
  refreshUser?: () => Promise<void>;
};

type UiState = {
  saving: boolean;
  error: string | null;
  ok: string | null;
};

const AUTH_NAME_KEY = "financy_name"; // ✅ MESMA chave do AuthProvider

function initialsFrom(text: string): string {
  const cleaned = text.trim();
  if (!cleaned) return "U";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 1)).toUpperCase();
}

export default function ProfilePage(): ReactElement {
  const navigate = useNavigate();
  const auth = useAuth() as AuthShape;

  const user = auth.user ?? null;

  const [name, setName] = useState<string>("");
  const [ui, setUi] = useState<UiState>({ saving: false, error: null, ok: null });

  const email = user?.email ?? "";

  const displayName = useMemo(() => {
    const n = (user?.name ?? "").trim();
    if (n) return n;
    const left = email.split("@")[0] ?? "";
    return left ? left : "Conta";
  }, [user?.name, email]);

  const initials = useMemo(
    () => initialsFrom((user?.name ?? "").trim() || email || "U"),
    [user?.name, email]
  );

  useEffect(() => {
    // ✅ baseia no user do contexto e no MESMO localStorage do AuthProvider
    const local = window.localStorage.getItem(AUTH_NAME_KEY) ?? "";
    const base = (user?.name ?? "").trim() || local;
    setName(base);
  }, [user?.name]);

  function onNameChange(e: ChangeEvent<HTMLInputElement>): void {
    setName(e.target.value);
    setUi((s) => ({ ...s, error: null, ok: null }));
  }

  async function onSave(): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      setUi({ saving: false, error: "Informe seu nome.", ok: null });
      return;
    }

    setUi({ saving: true, error: null, ok: null });

    try {
      if (typeof auth.updateProfile === "function") {
        await auth.updateProfile({ name: trimmed });
      } else {
        // fallback ultra simples (não deve acontecer após a atualização)
        window.localStorage.setItem(AUTH_NAME_KEY, trimmed);
      }

      if (typeof auth.refreshUser === "function") {
        await auth.refreshUser();
      }

      setUi({ saving: false, error: null, ok: "Alterações salvas com sucesso." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar.";
      setUi({ saving: false, error: msg, ok: null });
    }
  }

  async function onLogout(): Promise<void> {
    await Promise.resolve(auth.signOut());
    navigate("/login", { replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pb-12 pt-8">
      <div className="rounded-3xl border border-border/25 bg-card/40 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="px-6 pb-6 pt-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200/70 text-lg font-black text-slate-900">
              {initials}
            </div>

            <h1 className="mt-4 text-lg font-black tracking-tight text-fg">{displayName}</h1>
            <p className="mt-1 text-sm text-muted">{email}</p>

            <div className="mt-6 h-px w-full bg-border/20" />
          </div>

          <div className="mt-6 space-y-4">
            {ui.error ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600">
                Erro: {ui.error}
              </div>
            ) : null}

            {ui.ok ? (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-700">
                {ui.ok}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-fg">Nome completo</label>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-bg px-4 py-3">
                <User2 className="h-4 w-4 text-muted" />
                <input
                  value={name}
                  onChange={onNameChange}
                  placeholder="Seu nome"
                  className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-fg">E-mail</label>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-bg px-4 py-3 opacity-80">
                <Mail className="h-4 w-4 text-muted" />
                <input value={email} disabled className="w-full bg-transparent text-sm text-fg outline-none" />
              </div>
              <div className="text-xs text-muted">O e-mail não pode ser alterado</div>
            </div>

            <button
              onClick={onSave}
              disabled={ui.saving}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-60"
              type="button"
            >
              {ui.saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </button>

            <button
              onClick={onLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg px-4 py-3 text-sm font-bold text-fg transition hover:bg-black/5 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
              type="button"
            >
              <LogOut className="h-4 w-4 text-rose-500" />
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}