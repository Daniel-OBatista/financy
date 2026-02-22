"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Tag,
  Plus,
  ChevronRight,
  type LucideIcon,
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
} from "lucide-react";
import { supabase } from "@/services/supabase";
import NovaTransacaoModal, {
  type NewTransactionPayload,
  type CategoryOption,
} from "@/components/modals/NovaTransacaoModal";

/* ============================================================
   Tipagens (iguais ao seu cadastro)
============================================================ */
type CategoryColor =
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "orange"
  | "yellow";

type CategoryIcon =
  | "wallet"
  | "car"
  | "heart"
  | "pig"
  | "cart"
  | "film"
  | "gift"
  | "fork"
  | "home"
  | "tool"
  | "book"
  | "bag";

type CategoryFull = {
  id: string;
  title: string;
  icon: CategoryIcon;
  color: CategoryColor;
};

type TxRow = {
  id: string;
  description: string;
  date: string; // YYYY-MM-DD
  type: "entrada" | "saida";
  amount: string;
  category_id: string | null;
};

type TxRowFromDb = {
  id: string;
  description: string;
  date: string;
  type: string;
  amount: string | number;
  category_id: string | null;
};

type UiState = {
  loading: boolean;
  error: string | null;
};

type DashboardTotals = {
  saldoTotal: number;
  receitasMes: number;
  despesasMes: number;
};

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("pt-BR");
}

function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthStartEnd(period: string): { start: string; endExclusive: string } {
  const [yStr, mStr] = period.split("-");
  const y = Number(yStr);
  const m = Number(mStr);

  const start = `${period}-01`;
  const nextMonth = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  const endExclusive = `${nextMonth.y}-${String(nextMonth.m).padStart(2, "0")}-01`;
  return { start, endExclusive };
}

function toNumberAmount(v: string | number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeTxRow(row: TxRowFromDb): TxRow {
  return {
    id: String(row.id),
    description: String(row.description),
    date: String(row.date),
    type: row.type === "entrada" ? "entrada" : "saida",
    amount: String(row.amount),
    category_id: row.category_id ? String(row.category_id) : null,
  };
}

/* ============================================================
   Ícones + cores
============================================================ */
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

function isValidIconKey(v: unknown): v is CategoryIcon {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(ICON_RENDER, v);
}

function isValidColorKey(v: unknown): v is CategoryColor {
  const allowed: CategoryColor[] = [
    "green",
    "blue",
    "purple",
    "pink",
    "red",
    "orange",
    "yellow",
  ];
  return typeof v === "string" && (allowed as string[]).includes(v);
}

function colorClass(color: CategoryColor): string {
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

/* ============================================================
   Dashboard
============================================================ */
export default function DashboardPage() {
  const [open, setOpen] = useState<boolean>(false);
  const [ui, setUi] = useState<UiState>({ loading: true, error: null });

  const [period] = useState<string>(() => monthKey(new Date())); // mês atual
  const { start, endExclusive } = useMemo(() => monthStartEnd(period), [period]);

  const [categoriesFull, setCategoriesFull] = useState<CategoryFull[]>([]);
  const categoriesOptions: CategoryOption[] = useMemo(
    () => categoriesFull.map((c) => ({ id: c.id, title: c.title })),
    [categoriesFull]
  );

  const categoriesById = useMemo(() => {
    const m = new Map<string, CategoryFull>();
    for (const c of categoriesFull) m.set(c.id, c);
    return m;
  }, [categoriesFull]);

  const [recentRows, setRecentRows] = useState<TxRow[]>([]);
  const [monthRows, setMonthRows] = useState<TxRow[]>([]);
  const [totals, setTotals] = useState<DashboardTotals>({
    saldoTotal: 0,
    receitasMes: 0,
    despesasMes: 0,
  });

  const categoriasResumo = useMemo(() => {
    // resumo de despesas do mês (mais parecido com seu print)
    const map = new Map<
      string,
      { category: CategoryFull; count: number; total: number }
    >();

    for (const r of monthRows) {
      if (r.type !== "saida") continue; // despesas
      if (!r.category_id) continue;

      const cat = categoriesById.get(r.category_id);
      if (!cat) continue;

      const amt = toNumberAmount(r.amount);
      const prev = map.get(cat.id);
      if (!prev) {
        map.set(cat.id, { category: cat, count: 1, total: amt });
      } else {
        map.set(cat.id, { category: cat, count: prev.count + 1, total: prev.total + amt });
      }
    }

    const arr = Array.from(map.values());
    arr.sort((a, b) => b.total - a.total);
    return arr.slice(0, 5);
  }, [monthRows, categoriesById]);

  useEffect(() => {
    let mounted = true;

    async function boot(): Promise<void> {
      setUi({ loading: true, error: null });

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        if (!mounted) return;
        setUi({ loading: false, error: "Usuário não autenticado." });
        return;
      }

      const userId = userData.user.id;

      const [catsRes, allRes, monthRes, recentRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id,title,icon,color")
          .eq("user_id", userId)
          .order("title", { ascending: true }),

        supabase
          .from("transactions")
          .select("type,amount")
          .eq("user_id", userId),

        supabase
          .from("transactions")
          .select("id,description,date,type,amount,category_id")
          .eq("user_id", userId)
          .gte("date", start)
          .lt("date", endExclusive),

        supabase
          .from("transactions")
          .select("id,description,date,type,amount,category_id")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      if (!mounted) return;

      if (catsRes.error) {
        setUi({ loading: false, error: "Não foi possível carregar categorias." });
        return;
      }

      const list = (catsRes.data ?? []) as unknown as Array<{
        id: string;
        title: string;
        icon: unknown;
        color: unknown;
      }>;

      const catsNormalized: CategoryFull[] = list.map((c) => ({
        id: String(c.id),
        title: String(c.title),
        icon: isValidIconKey(c.icon) ? c.icon : "wallet",
        color: isValidColorKey(c.color) ? c.color : "green",
      }));
      setCategoriesFull(catsNormalized);

      // totals (saldo total)
      let saldoTotal = 0;
      if (!allRes.error) {
        const all = (allRes.data ?? []) as unknown as Array<{ type: string; amount: string | number }>;
        for (const r of all) {
          const amt = toNumberAmount(r.amount);
          if (r.type === "entrada") saldoTotal += amt;
          else saldoTotal -= amt;
        }
      }

      // mês (receitas / despesas)
      let receitasMes = 0;
      let despesasMes = 0;
      let monthNormalized: TxRow[] = [];

      if (!monthRes.error) {
        const monthDb = (monthRes.data ?? []) as unknown as TxRowFromDb[];
        monthNormalized = monthDb.map(normalizeTxRow);
        for (const r of monthNormalized) {
          const amt = toNumberAmount(r.amount);
          if (r.type === "entrada") receitasMes += amt;
          else despesasMes += amt;
        }
      }

      // recentes
      let recentNormalized: TxRow[] = [];
      if (!recentRes.error) {
        const recentDb = (recentRes.data ?? []) as unknown as TxRowFromDb[];
        recentNormalized = recentDb.map(normalizeTxRow);
      }

      setTotals({ saldoTotal, receitasMes, despesasMes });
      setMonthRows(monthNormalized);
      setRecentRows(recentNormalized);
      setUi({ loading: false, error: null });
    }

    void boot();
    return () => {
      mounted = false;
    };
  }, [start, endExclusive]);

  async function handleSave(payload: NewTransactionPayload): Promise<void> {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      setUi((s) => ({ ...s, error: "Usuário não autenticado." }));
      return;
    }

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: payload.type,
        description: payload.description,
        amount: payload.amount,
        date: payload.date,
        category_id: payload.category_id,
      })
      .select("id,description,date,type,amount,category_id")
      .single();

    if (error) {
      setUi((s) => ({ ...s, error: "Não foi possível criar transação." }));
      return;
    }

    // adiciona em recentes
    const row = data as unknown as TxRowFromDb | null;
    if (row) {
      const n = normalizeTxRow(row);
      setRecentRows((prev) => [n, ...prev].slice(0, 6));
      // se for do mês atual, atualiza também o mês
      if (n.date >= start && n.date < endExclusive) {
        setMonthRows((prev) => [n, ...prev]);
      }
    }

    setOpen(false);
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visão geral das suas finanças
          </p>
        </div>
      </div>

      {ui.error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {ui.error}
        </div>
      ) : null}

      {/* TOP STATS */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Saldo total
              </p>
              <p className="mt-1 text-xl font-extrabold text-gray-900">
                {ui.loading ? "—" : brl(totals.saldoTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Receitas do mês
              </p>
              <p className="mt-1 text-xl font-extrabold text-gray-900">
                {ui.loading ? "—" : brl(totals.receitasMes)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <ArrowDownRight className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Despesas do mês
              </p>
              <p className="mt-1 text-xl font-extrabold text-gray-900">
                {ui.loading ? "—" : brl(totals.despesasMes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* TRANSAÇÕES RECENTES */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Transações recentes
            </p>

            <Link
              href="/transacoes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-base hover:text-brand-dark"
            >
              Ver todas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {ui.loading ? (
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentRows.map((r) => {
                const isEntrada = r.type === "entrada";
                const amt = toNumberAmount(r.amount);

                const cat = r.category_id ? categoriesById.get(r.category_id) : undefined;
                const Icon: LucideIcon = cat ? ICON_RENDER[cat.icon] : Tag;

                const iconCls = cat ? colorClass(cat.color) : "bg-gray-100 text-gray-700";
                const pillCls = cat ? colorClass(cat.color) : "bg-gray-100 text-gray-700";

                return (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                    <div className={["flex h-10 w-10 items-center justify-center rounded-xl", iconCls].join(" ")}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {r.description}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDateBR(r.date)}
                      </p>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                      <span className={["rounded-full px-3 py-1 text-xs font-semibold", pillCls].join(" ")}>
                        {cat?.title ?? "Sem categoria"}
                      </span>

                      {isEntrada ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Receita
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                          Despesa
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="text-sm font-extrabold text-gray-900">
                        {isEntrada ? "+ " : "- "}
                        {brl(amt)}
                      </p>

                      <div
                        className={[
                          "flex h-7 w-7 items-center justify-center rounded-full",
                          isEntrada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600",
                        ].join(" ")}
                        title={isEntrada ? "Entrada" : "Saída"}
                      >
                        {isEntrada ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {recentRows.length === 0 ? (
                <div className="px-5 py-6 text-sm text-gray-600">
                  Nenhuma transação ainda.
                </div>
              ) : null}
            </div>
          )}

          <div className="border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-base hover:text-brand-dark"
            >
              <Plus className="h-4 w-4" />
              Nova transação
            </button>
          </div>
        </div>

        {/* CATEGORIAS */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Categorias
            </p>

            <Link
              href="/categorias"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-base hover:text-brand-dark"
            >
              Gerenciar <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {ui.loading ? (
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {categoriasResumo.map((item) => (
                <div key={item.category.id} className="flex items-center justify-between px-5 py-4">
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      colorClass(item.category.color),
                    ].join(" ")}
                  >
                    {item.category.title}
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {item.count} itens
                    </span>
                    <span className="text-xs font-extrabold text-gray-900">
                      {brl(item.total)}
                    </span>
                  </div>
                </div>
              ))}

              {categoriasResumo.length === 0 ? (
                <div className="px-5 py-6 text-sm text-gray-600">
                  Sem dados de categorias neste mês.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <NovaTransacaoModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(p) => void handleSave(p)}
        categories={categoriesOptions}
      />
    </>
  );
}