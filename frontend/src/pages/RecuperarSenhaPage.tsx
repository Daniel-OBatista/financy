import type { ReactElement } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

type FormState = {
  email: string;
  senha: string;
};

export default function RecuperarSenhaPage(): ReactElement {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [show, setShow] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({ email: "", senha: "" });

  async function handleReset(): Promise<void> {
    setError(null);
    setOk(null);

    const email = form.email.trim();
    const senha = form.senha;

    if (!email || !senha) {
      setError("Preencha e-mail e a nova senha.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ email, newPassword: senha });
      setOk("Senha atualizada! Agora você já pode fazer login.");
      setTimeout(() => navigate("/login", { replace: true }), 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Falha ao atualizar senha.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">Recuperar senha</h1>
          <p className="mt-1 text-sm text-gray-500">Defina uma nova senha para sua conta</p>
        </div>

        <div className="mt-6 space-y-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {ok ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {ok}
            </div>
          ) : null}

          <div>
            <label className="text-xs font-medium text-gray-700">E-mail</label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                type="email"
                autoComplete="email"
                placeholder="mail@exemplo.com"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Nova senha</label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={form.senha}
                onChange={(e) => setForm((s) => ({ ...s, senha: e.target.value }))}
                type={show ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Digite a nova senha"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-500">A senha deve ter no mínimo 8 caracteres</p>
          </div>

          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={loading}
            className={[
              "inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition focus:outline-none focus:ring-4 focus:ring-brand-base/20",
              loading ? "cursor-not-allowed bg-gray-300" : "bg-brand-base hover:bg-brand-dark",
            ].join(" ")}
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <Link
            to="/login"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            <ArrowRight className="h-4 w-4" />
            Voltar para login
          </Link>
        </div>
      </div>
    </section>
  );
}