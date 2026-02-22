"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
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
import NovaTransacaoModal, {
  type NewTransactionPayload,
  type CategoryOption,
} from "@/components/modals/NovaTransacaoModal";

/* ============================================================
   Tipagens (mesmas chaves do seu NovaCategoriaModal)
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
  amount: string; // numeric vem como string no PostgREST
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

function normalizeTxRows(rows: TxRowFromDb[] | null): TxRow[] {
  return (rows ?? []).map(normalizeTxRow);
}

/* ============================================================
   Ícones + cores (render igual às categorias)
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

export default function TransacoesPage() {
  const [open, setOpen] = useState<boolean>(false);
  const [ui, setUi] = useState<UiState>({ loading: true, error: null });

  // categorias (full para ícone/cor) + options (para modal/filtro)
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

  const [rows, setRows] = useState<TxRow[]>([]);

  // filtros
  const [q, setQ] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("Todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("Todas");

  const [period, setPeriod] = useState<string>(() => monthKey(new Date()));

  const periodOptions = useMemo(() => {
    const arr: string[] = [];
    const now = new Date();
    for (let i = 0; i < 8; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push(monthKey(d));
    }
    return arr;
  }, []);

  async function loadCategories(): Promise<void> {
    const { data, error } = await supabase
      .from("categories")
      .select("id,title,icon,color")
      .order("title", { ascending: true });

    if (error) {
      setUi((s) => ({ ...s, error: "Não foi possível carregar categorias." }));
      return;
    }

    const list = (data ?? []) as unknown as Array<{
      id: string;
      title: string;
      icon: unknown;
      color: unknown;
    }>;

    const normalized: CategoryFull[] = list.map((c) => ({
      id: String(c.id),
      title: String(c.title),
      icon: isValidIconKey(c.icon) ? c.icon : "wallet",
      color: isValidColorKey(c.color) ? c.color : "green",
    }));

    setCategoriesFull(normalized);
  }

  async function loadTransactions(): Promise<void> {
    setUi({ loading: true, error: null });

    const { start, endExclusive } = monthStartEnd(period);

    let query = supabase
      .from("transactions")
      .select("id,description,date,type,amount,category_id")
      .gte("date", start)
      .lt("date", endExclusive)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    const search = q.trim();
    if (search) query = query.ilike("description", `%${search}%`);

    if (typeFilter === "Entrada") query = query.eq("type", "entrada");
    if (typeFilter === "Saída") query = query.eq("type", "saida");

    if (categoryFilter !== "Todas") query = query.eq("category_id", categoryFilter);

    const { data, error } = await query;

    if (error) {
      setUi({ loading: false, error: "Não foi possível carregar transações." });
      return;
    }

    const dbRows = (data ?? []) as unknown as TxRowFromDb[];
    setRows(normalizeTxRows(dbRows));
    setUi({ loading: false, error: null });
  }

  useEffect(() => {
    let mounted = true;

    async function boot(): Promise<void> {
      await loadCategories();
      if (!mounted) return;
      await loadTransactions();
    }

    void boot();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, typeFilter, categoryFilter, period]);

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

    const dbRow = data as unknown as TxRowFromDb | null;
    if (dbRow) {
      const normalized = normalizeTxRow(dbRow);
      setRows((prev) => [normalized, ...prev]);
    }

    setOpen(false);
  }

  async function handleDelete(id: string): Promise<void> {
    const ok = window.confirm("Excluir esta transação?");
    if (!ok) return;

    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      setUi((s) => ({ ...s, error: "Não foi possível excluir transação." }));
      return;
    }

    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Transações</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todas as suas transações financeiras
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-base px-4 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-4 focus:ring-brand-base/20"
        >
          <Plus className="h-4 w-4" />
          Nova transação
        </button>
      </div>

      {ui.error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {ui.error}
        </div>
      ) : null}

      {/* filtros */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-gray-700">Buscar</label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por descrição"
                className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
            >
              <option>Todos</option>
              <option>Entrada</option>
              <option>Saída</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Categoria</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
            >
              <option value="Todas">Todas</option>
              {categoriesOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Período</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
            >
              {periodOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* tabela */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {ui.loading ? (
          <div className="p-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando transações...
            </div>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-app-bg text-gray-600">
              <tr>
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wide">
                  Descrição
                </th>
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wide">
                  Data
                </th>
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wide">
                  Categoria
                </th>
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wide">
                  Tipo
                </th>
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wide">
                  Valor
                </th>
                <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-wide">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => {
                const amountNumber = Number(r.amount);
                const safeAmount = Number.isFinite(amountNumber) ? amountNumber : 0;
                const isEntrada = r.type === "entrada";

                const cat = r.category_id ? categoriesById.get(r.category_id) : undefined;

                const IconComp: LucideIcon = cat ? ICON_RENDER[cat.icon] : Tag;
                const colorClass = cat ? iconWrapClassFromColor(cat.color) : "bg-gray-100 text-gray-700";

                return (
                  <tr key={r.id} className="hover:bg-gray-50/40">
                    {/* Descrição + ícone igual ao cadastrado */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={["flex h-10 w-10 items-center justify-center rounded-xl", colorClass].join(" ")}
                          title={cat?.title ?? "Sem categoria"}
                        >
                          <IconComp className="h-5 w-5" />
                        </div>

                        <p className="font-semibold text-gray-900">{r.description}</p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">{formatDateBR(r.date)}</td>

                    {/* Categoria na mesma cor do ícone */}
                    <td className="px-5 py-4">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          cat ? iconWrapClassFromColor(cat.color) : "bg-gray-100 text-gray-700",
                        ].join(" ")}
                      >
                        {cat?.title ?? "Sem categoria"}
                      </span>
                    </td>

                    {/* Tipo com seta e cor */}
                    <td className="px-5 py-4">
                      {isEntrada ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          <ArrowUpRight className="h-4 w-4" />
                          Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                          <ArrowDownRight className="h-4 w-4" />
                          Saída
                        </span>
                      )}
                    </td>

                    {/* Valor em negrito */}
                    <td className="px-5 py-4 font-extrabold text-gray-900">
                      {isEntrada ? "+ " : "- "}
                      {brl(safeAmount)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                          aria-label="Editar"
                          title="Editar (vamos fazer depois)"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(r.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                          aria-label="Excluir"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-gray-500" colSpan={6}>
                    Nenhuma transação ainda.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
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