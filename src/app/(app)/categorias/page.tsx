"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Tag,
  ArrowUpDown,
  Wallet,
  Car,
  Heart,
  PiggyBank,
  ShoppingCart,
  Film,
  Gift,
  Utensils,
  Home,
  Wrench,
  BookOpen,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import NovaCategoriaModal, {
  type NewCategoryPayload,
  type CategoryColor,
  type CategoryIcon,
} from "@/components/modals/NovaCategoriaModal";

type CategoryRow = {
  id: string;
  title: string;
  description: string | null;
  icon: CategoryIcon;
  color: CategoryColor;
  created_at: string;
};

type TxRow = {
  category_id: string | null;
};

type UiState = {
  loading: boolean;
  error: string | null;
};

type Stats = {
  totalTransacoes: number;
  mostUsedCategoryId: string | null;
};

function badgeClassFromColor(color: CategoryColor): string {
  const map: Record<CategoryColor, string> = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    pink: "bg-pink-100 text-pink-700",
    red: "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-700",
    yellow: "bg-yellow-100 text-yellow-800",
  };
  return map[color];
}

function iconWrapClassFromColor(color: CategoryColor): string {
  const map: Record<CategoryColor, string> = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    pink: "bg-pink-100 text-pink-700",
    red: "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-700",
    yellow: "bg-yellow-100 text-yellow-800",
  };
  return map[color];
}

const ICON_RENDER: Record<CategoryIcon, LucideIcon> = {
  wallet: Wallet,
  car: Car,
  heart: Heart,
  pig: PiggyBank,
  cart: ShoppingCart,
  film: Film,
  gift: Gift,
  fork: Utensils,
  home: Home,
  tool: Wrench,
  book: BookOpen,
  bag: ShoppingBag,
};

export default function CategoriasPage() {
  const [open, setOpen] = useState<boolean>(false);
  const [ui, setUi] = useState<UiState>({ loading: true, error: null });
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTransacoes: 0,
    mostUsedCategoryId: null,
  });

  const totalCategorias = categories.length;

  const mostUsedCategory = useMemo(() => {
    if (!stats.mostUsedCategoryId) return null;
    return categories.find((c) => c.id === stats.mostUsedCategoryId) ?? null;
  }, [categories, stats.mostUsedCategoryId]);

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      setUi({ loading: true, error: null });

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        if (!mounted) return;
        setUi({ loading: false, error: "Usuário não autenticado." });
        return;
      }

      const userId = userData.user.id;

      const [catsRes, txCountRes, txCatsRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id,title,description,icon,color,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("transactions")
          .select("category_id")
          .eq("user_id", userId),
      ]);

      if (!mounted) return;

      if (catsRes.error) {
        setUi({ loading: false, error: "Não foi possível carregar categorias." });
        return;
      }

      const cats = (catsRes.data ?? []) as CategoryRow[];

      const totalTransacoes = txCountRes.count ?? 0;

      let mostUsedCategoryId: string | null = null;
      if (!txCatsRes.error) {
        const rows = (txCatsRes.data ?? []) as TxRow[];
        const counter = new Map<string, number>();

        for (const r of rows) {
          if (!r.category_id) continue;
          counter.set(r.category_id, (counter.get(r.category_id) ?? 0) + 1);
        }

        let bestId: string | null = null;
        let bestCount = -1;

        counter.forEach((count, id) => {
          if (count > bestCount) {
            bestCount = count;
            bestId = id;
          }
        });

        mostUsedCategoryId = bestId;
      }

      setCategories(cats);
      setStats({ totalTransacoes, mostUsedCategoryId });
      setUi({ loading: false, error: null });
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave(payload: NewCategoryPayload): Promise<void> {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      setUi((s) => ({ ...s, error: "Usuário não autenticado." }));
      return;
    }

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        title: payload.titulo,
        description: payload.descricao ? payload.descricao : null,
        icon: payload.icone,
        color: payload.cor,
      })
      .select("id,title,description,icon,color,created_at")
      .single();

    if (error) {
      setUi((s) => ({ ...s, error: "Não foi possível criar categoria." }));
      return;
    }

    const row = data as CategoryRow;

    setCategories((prev) => [row, ...prev]);
    setOpen(false);
  }

  async function handleDelete(id: string): Promise<void> {
    const ok = window.confirm("Excluir esta categoria?");
    if (!ok) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      setUi((s) => ({ ...s, error: "Não foi possível excluir categoria." }));
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));

    // se apagar a mais usada, recomputa visualmente como “-”
    setStats((s) => ({
      ...s,
      mostUsedCategoryId: s.mostUsedCategoryId === id ? null : s.mostUsedCategoryId,
    }));
  }

  const cards = useMemo(() => categories, [categories]);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Categorias</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize suas transações por categorias
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-base px-4 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-4 focus:ring-brand-base/20"
        >
          <Plus className="h-4 w-4" />
          Nova categoria
        </button>
      </div>

      {ui.error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {ui.error}
        </div>
      ) : null}

      {/* stats (igual o projeto) */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <Tag className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Total de categorias
              </p>
              <p className="mt-1 text-2xl font-extrabold text-gray-900">
                {ui.loading ? "—" : totalCategorias}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <ArrowUpDown className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Total de transações
              </p>
              <p className="mt-1 text-2xl font-extrabold text-gray-900">
                {ui.loading ? "—" : stats.totalTransacoes}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={[
                "flex h-10 w-10 items-center justify-center rounded-xl",
                mostUsedCategory
                  ? iconWrapClassFromColor(mostUsedCategory.color)
                  : "bg-gray-100 text-gray-700",
              ].join(" ")}
            >
              {mostUsedCategory ? (
                (() => {
                  const Icon = ICON_RENDER[mostUsedCategory.icon];
                  return <Icon className="h-5 w-5" />;
                })()
              ) : (
                <Tag className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Categoria mais utilizada
              </p>
              <p className="mt-1 truncate text-lg font-extrabold text-gray-900">
                {ui.loading ? "—" : mostUsedCategory?.title ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* grid */}
      <div className="mt-6">
        {ui.loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando categorias...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => {
              const Icon = ICON_RENDER[c.icon];

              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* ✅ Ícone real da categoria */}
                    <div
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        iconWrapClassFromColor(c.color),
                      ].join(" ")}
                      title={c.title}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                        aria-label="Editar"
                        title="Editar (vamos fazer depois)"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(c.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                        aria-label="Excluir"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-gray-900">
                    {c.title}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {c.description?.trim() ? c.description : "Sem descrição"}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        badgeClassFromColor(c.color),
                      ].join(" ")}
                    >
                      {c.title}
                    </span>
                  </div>
                </div>
              );
            })}

            {cards.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm md:col-span-2 lg:col-span-4">
                Nenhuma categoria ainda. Clique em <b>Nova categoria</b>.
              </div>
            ) : null}
          </div>
        )}
      </div>

      <NovaCategoriaModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(p) => void handleSave(p)}
      />
    </>
  );
}