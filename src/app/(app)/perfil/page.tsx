"use client";

import { useEffect, useMemo, useState } from "react";
import { LogOut, User, Loader2 } from "lucide-react";
import { supabase } from "@/services/supabase";

type ProfileFormState = {
  nome: string;
  email: string;
};

type UiState = {
  loading: boolean;
  saving: boolean;
  signingOut: boolean;
  message: string | null;
  error: string | null;
};

export default function PerfilPage() {
  const initials = useMemo(() => "CT", []);

  const [form, setForm] = useState<ProfileFormState>({
    nome: "",
    email: "",
  });

  const [ui, setUi] = useState<UiState>({
    loading: true,
    saving: false,
    signingOut: false,
    message: null,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadProfile(): Promise<void> {
      if (!mounted) return;

      setUi((s) => ({
        ...s,
        loading: true,
        error: null,
        message: null,
      }));

      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error) {
        setUi((s) => ({
          ...s,
          loading: false,
          error: "Não foi possível carregar seu perfil.",
        }));
        return;
      }

      const user = data.user;
      const email = user.email ?? "";

      // ✅ nome vem do metadata (full_name)
      const fullNameUnknown = "Conta";
      const fullName =
        (user.user_metadata?.full_name as string | undefined) ??
        fullNameUnknown;

      setForm({
        nome: fullName,
        email,
      });

      setUi((s) => ({ ...s, loading: false }));
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave(): Promise<void> {
    setUi((s) => ({ ...s, saving: true, error: null, message: null }));

    const nome = form.nome.trim();

    if (nome.length < 2) {
      setUi((s) => ({
        ...s,
        saving: false,
        error: "Informe um nome válido.",
      }));
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { full_name: nome },
    });

    if (error) {
      setUi((s) => ({
        ...s,
        saving: false,
        error: "Não foi possível salvar as alterações.",
      }));
      return;
    }

    setUi((s) => ({
      ...s,
      saving: false,
      message: "Alterações salvas com sucesso!",
    }));
  }

  async function handleLogout(): Promise<void> {
    setUi((s) => ({ ...s, signingOut: true, error: null, message: null }));

    await supabase.auth.signOut();

    // ✅ O AuthGate que criamos te manda pro /login automaticamente.
    // (Se você ainda não colocou AuthGate, me avisa que eu adapto)
  }

  if (ui.loading) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando perfil...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-sm font-extrabold text-gray-700">
            {initials}
          </div>

          <h1 className="mt-4 text-base font-semibold text-gray-900">
            {form.nome || "Conta"}
          </h1>

          <p className="mt-1 text-sm text-gray-500">{form.email}</p>
        </div>

        <div className="mt-6 space-y-4">
          {ui.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {ui.error}
            </div>
          ) : null}

          {ui.message ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {ui.message}
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
                onChange={(e) =>
                  setForm((s) => ({ ...s, nome: e.target.value }))
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">E-mail</label>
            <input
              value={form.email}
              disabled
              className="mt-2 h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
            />
            <p className="mt-2 text-[11px] text-gray-400">
              O e-mail não pode ser alterado
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={ui.saving || ui.signingOut}
            className={[
              "inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition focus:outline-none focus:ring-4 focus:ring-brand-base/20",
              ui.saving
                ? "cursor-not-allowed bg-gray-300"
                : "bg-brand-base hover:bg-brand-dark",
            ].join(" ")}
          >
            {ui.saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </span>
            ) : (
              "Salvar alterações"
            )}
          </button>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={ui.signingOut || ui.saving}
            className={[
              "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition",
              ui.signingOut
                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
                : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50",
            ].join(" ")}
          >
            {ui.signingOut ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saindo...
              </span>
            ) : (
              <>
                <LogOut className="h-4 w-4 text-red-600" />
                Sair da conta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}