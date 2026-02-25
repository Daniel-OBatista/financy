import type { ReactElement } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, ArrowRight } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

type CreateAccountFormState = {
  nome: string;
  email: string;
  senha: string;
};

function mapAuthErrorMessage(raw: string): string {
  const msg = raw.toLowerCase();

  if (msg.includes("email not confirmed")) return "Seu e-mail ainda não foi confirmado.";
  if (msg.includes("invalid login credentials")) return "E-mail ou senha inválidos.";
  if (msg.includes("invalid")) return "Dados inválidos. Confira e tente novamente.";
  if (msg.includes("rate limit")) return "Muitas tentativas. Aguarde um pouco e tente novamente.";

  return raw || "Falha ao cadastrar.";
}

type AuthMaybeSignUp = {
  signIn: (args: { email: string; password: string }) => Promise<void>;
  signUp?: (args: { name: string; email: string; password: string }) => Promise<void>;
};

export default function CriarContaPage(): ReactElement {
  const auth = useAuth() as AuthMaybeSignUp;
  const navigate = useNavigate();

  const [show, setShow] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateAccountFormState>({
    nome: "",
    email: "",
    senha: "",
  });

  async function handleCreateAccount(): Promise<void> {
    setError(null);

    const nome = form.nome.trim();
    const email = form.email.trim();
    const password = form.senha;

    if (!nome || !email || !password) {
      setError("Preencha nome, e-mail e senha.");
      return;
    }

    if (!email.includes("@")) {
      setError("Digite um e-mail válido.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Se existir signUp no seu AuthProvider, usamos.
      if (typeof auth.signUp === "function") {
        await auth.signUp({ name: nome, email, password });
        navigate("/dashboard", { replace: true });
        return;
      }

      // ✅ Fallback: ainda sem cadastro no backend.
      setError("Cadastro ainda não implementado no AuthProvider (signUp).");
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error("signUp error:", err);

      const message = err instanceof Error ? err.message : "Falha ao cadastrar.";
      setError(mapAuthErrorMessage(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md">
      {/* card 448 e conteúdo ~382: p-8 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">Criar conta</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comece a controlar suas finanças ainda hoje
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div>
            <label className="text-xs font-medium text-gray-700">Nome completo</label>
            <div className="relative mt-2">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={form.nome}
                onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
                placeholder="Seu nome completo"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
              />
            </div>
          </div>

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
            <label className="text-xs font-medium text-gray-700">Senha</label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={form.senha}
                onChange={(e) => setForm((s) => ({ ...s, senha: e.target.value }))}
                type={show ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Digite sua senha"
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

            <p className="mt-2 text-xs text-gray-500">
              A senha deve ter no mínimo 8 caracteres
            </p>
          </div>

          {/* Botão 48px de altura */}
          <button
            type="button"
            onClick={() => void handleCreateAccount()}
            disabled={loading}
            className={[
              "inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition focus:outline-none focus:ring-4 focus:ring-brand-base/20",
              loading ? "cursor-not-allowed bg-gray-300" : "bg-brand-base hover:bg-brand-dark",
            ].join(" ")}
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <p className="text-center text-xs text-gray-500">Já tem uma conta?</p>

          <Link
            to="/login"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            <ArrowRight className="h-4 w-4" />
            Fazer login
          </Link>
        </div>
      </div>
    </section>
  );
}