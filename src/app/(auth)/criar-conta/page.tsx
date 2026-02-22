"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { supabase } from "@/services/supabase";

type SignupFormState = {
  nome: string;
  email: string;
  senha: string;
};

export default function CriarContaPage() {
  const [show, setShow] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [form, setForm] = useState<SignupFormState>({
    nome: "",
    email: "",
    senha: "",
  });

  async function handleSignup(): Promise<void> {
    setError(null);
    setInfo(null);
    setLoading(true);

    const email = form.email.trim();
    const password = form.senha;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: form.nome.trim() },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Se o projeto estiver com confirmação de e-mail ligada, session pode vir null
    const hasSession = Boolean(data.session);
    if (!hasSession) {
      setInfo("Conta criada! Confirme seu e-mail para concluir o acesso.");
    }
    // Se tiver session, AuthGate te manda pro /dashboard automaticamente
  }

  return (
    <section className="w-full max-w-md">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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

          {info ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {info}
            </div>
          ) : null}

          <div>
            <label className="text-xs font-medium text-gray-700">
              Nome completo
            </label>
            <div className="mt-2 relative">
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
            <div className="mt-2 relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={form.email}
                onChange={(e) =>
                  setForm((s) => ({ ...s, email: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((s) => ({ ...s, senha: e.target.value }))
                }
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
            <p className="mt-2 text-[11px] text-gray-400">
              A senha deve ter no mínimo 8 caracteres
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleSignup()}
            disabled={loading}
            className={[
              "inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition focus:outline-none focus:ring-4 focus:ring-brand-base/20",
              loading ? "bg-gray-300 cursor-not-allowed" : "bg-brand-base hover:bg-brand-dark",
            ].join(" ")}
          >
            {loading ? "Criando..." : "Cadastrar"}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <p className="text-center text-xs text-gray-500">Já tem uma conta?</p>

          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </section>
  );
}