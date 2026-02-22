"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/services/supabase";

type LoginFormState = {
  email: string;
  senha: string;
  lembrar: boolean;
};

function mapSupabaseAuthErrorMessage(raw: string): string {
  const msg = raw.toLowerCase();

  if (msg.includes("email not confirmed")) return "Seu e-mail ainda não foi confirmado.";
  if (msg.includes("invalid login credentials")) return "E-mail ou senha inválidos.";
  if (msg.includes("invalid")) return "Dados inválidos. Confira e tente novamente.";
  if (msg.includes("rate limit")) return "Muitas tentativas. Aguarde um pouco e tente novamente.";

  // fallback (útil no dev)
  return raw;
}

export default function LoginPage() {
  const [show, setShow] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<LoginFormState>({
    email: "",
    senha: "",
    lembrar: false,
  });

  async function handleLogin(): Promise<void> {
    setError(null);

    const email = form.email.trim();
    const password = form.senha;

    if (!email || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      // ✅ importantíssimo pra você ver o erro real
      // (depois você pode remover)
      // eslint-disable-next-line no-console
      console.error("Supabase signIn error:", signInError);

      setError(mapSupabaseAuthErrorMessage(signInError.message));
      return;
    }

    // (opcional) conferir se sessão veio
    if (!data.session) {
      setError("Sessão não criada. Verifique configurações do Supabase Auth.");
      return;
    }

    // AuthGate detecta a sessão e manda pro /dashboard automaticamente
  }

  return (
    <section className="w-full max-w-md">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">Fazer login</h1>
          <p className="mt-1 text-sm text-gray-500">
            Entre na sua conta para continuar
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div>
            <label className="text-xs font-medium text-gray-700">E-mail</label>
            <div className="mt-2 relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                placeholder="mail@exemplo.com"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Senha</label>
            <div className="mt-2 relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={form.senha}
                onChange={(e) => setForm((s) => ({ ...s, senha: e.target.value }))}
                type={show ? "text" : "password"}
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
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={form.lembrar}
                onChange={(e) => setForm((s) => ({ ...s, lembrar: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 accent-brand-base"
              />
              Lembrar-me
            </label>

            <button
              type="button"
              className="text-xs font-medium text-brand-base hover:text-brand-dark"
              onClick={() => setError("Use o painel do Supabase para resetar a senha deste usuário (por enquanto).")}
            >
              Recuperar senha
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleLogin()}
            disabled={loading}
            className={[
              "inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition focus:outline-none focus:ring-4 focus:ring-brand-base/20",
              loading ? "bg-gray-300 cursor-not-allowed" : "bg-brand-base hover:bg-brand-dark",
            ].join(" ")}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <p className="text-center text-xs text-gray-500">
            Ainda não tem uma conta?
          </p>

          <Link
            href="/criar-conta"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </section>
  );
}