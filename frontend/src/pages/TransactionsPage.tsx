import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Briefcase,
  Car,
  CircleDollarSign,
  Film,
  Fuel,
  Home,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Modal from "../components/Modal";
import {
  type Category,
  type Transaction,
  type TransactionType,
  GET_CATEGORIES,
  GET_TRANSACTIONS,
  CREATE_TRANSACTION,
  UPDATE_TRANSACTION,
  DELETE_TRANSACTION,
} from "../graphql/ops";
import { brlFromCents, isoToBR, toISODateInput } from "../lib/format";

type GetCategoriesData = { categories: Category[] };
type GetTransactionsData = { transactions: Transaction[] };

type CreateTxVars = {
  input: {
    description: string;
    date: string;
    type: TransactionType;
    amountCents: number;
    categoryId?: string | null;
  };
};

type UpdateTxVars = {
  input: {
    id: string;
    description?: string;
    date?: string;
    type?: TransactionType;
    amountCents?: number;
    categoryId?: string | null;
  };
};

type DeleteTxVars = { id: string };

type TypeFilter = "ALL" | TransactionType;
type PageToken = number | "…";

function safeDateMs(isoLike: string): number {
  const d =
    /^\d{4}-\d{2}-\d{2}$/.test(isoLike) ? new Date(`${isoLike}T00:00:00`) : new Date(isoLike);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function ymFromIso(isoLike: string): string {
  const d =
    /^\d{4}-\d{2}-\d{2}$/.test(isoLike) ? new Date(`${isoLike}T00:00:00`) : new Date(isoLike);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const mm = String(m).padStart(2, "0");
  return `${y}-${mm}`;
}

function formatPeriodLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const year = Number(y);
  const monthIdx = Number(m) - 1;
  const d = new Date(year, monthIdx, 1);
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(d);
  const cap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${cap} / ${year}`;
}

type CatVisual = {
  Icon: LucideIcon;
  iconWrapClass: string;
  iconClass: string;
  pillClass: string;
};

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function getCategoryVisual(c?: Category | null): CatVisual {
  const titleKey = c?.title ? normalizeKey(c.title) : "";
  const iconKey = (c as { icon?: string } | null)?.icon
    ? normalizeKey(String((c as { icon?: string }).icon))
    : "";
  const colorKey = (c as { color?: string } | null)?.color
    ? normalizeKey(String((c as { color?: string }).color))
    : "";

  const colorMap: Record<string, { iconWrapClass: string; iconClass: string; pillClass: string }> = {
    green: {
      iconWrapClass: "bg-emerald-100",
      iconClass: "text-emerald-700",
      pillClass: "bg-emerald-100 text-emerald-700",
    },
    blue: {
      iconWrapClass: "bg-sky-100",
      iconClass: "text-sky-700",
      pillClass: "bg-sky-100 text-sky-700",
    },
    purple: {
      iconWrapClass: "bg-violet-100",
      iconClass: "text-violet-700",
      pillClass: "bg-violet-100 text-violet-700",
    },
    pink: {
      iconWrapClass: "bg-pink-100",
      iconClass: "text-pink-700",
      pillClass: "bg-pink-100 text-pink-700",
    },
    orange: {
      iconWrapClass: "bg-orange-100",
      iconClass: "text-orange-700",
      pillClass: "bg-orange-100 text-orange-700",
    },
    yellow: {
      iconWrapClass: "bg-amber-100",
      iconClass: "text-amber-800",
      pillClass: "bg-amber-100 text-amber-800",
    },
    slate: {
      iconWrapClass: "bg-slate-100",
      iconClass: "text-slate-700",
      pillClass: "bg-slate-100 text-slate-700",
    },
  };

  const iconMap: Record<string, LucideIcon> = {
    wallet: Wallet,
    car: Car,
    mercado: ShoppingCart,
    market: ShoppingCart,
    alimentacao: UtensilsCrossed,
    food: UtensilsCrossed,
    transporte: Car,
    gasolina: Fuel,
    fuel: Fuel,
    utilidades: Home,
    house: Home,
    casa: Home,
    aluguel: Home,
    salario: Briefcase,
    income: Briefcase,
    investimento: Wallet,
    invest: Wallet,
    entretenimento: Film,
    movie: Film,
    tag: Tag,
  };

  const inferredIcon: LucideIcon =
    iconMap[iconKey] ??
    iconMap[titleKey] ??
    (titleKey.includes("alimenta") ? UtensilsCrossed : undefined) ??
    (titleKey.includes("transp") ? Car : undefined) ??
    (titleKey.includes("merc") ? ShoppingCart : undefined) ??
    (titleKey.includes("sal") ? Briefcase : undefined) ??
    (titleKey.includes("util") || titleKey.includes("alugu") ? Home : undefined) ??
    (titleKey.includes("inv") ? Wallet : undefined) ??
    (titleKey.includes("cin") || titleKey.includes("entre") ? Film : undefined) ??
    Tag;

  const byTitle: Record<string, keyof typeof colorMap> = {
    alimentacao: "blue",
    transporte: "purple",
    mercado: "orange",
    investimento: "green",
    utilidades: "yellow",
    salario: "green",
    entretenimento: "pink",
  };

  const pickColorKey: keyof typeof colorMap =
    (colorKey && (colorKey as keyof typeof colorMap)) || byTitle[titleKey] || "slate";

  const picked = colorMap[pickColorKey] ?? colorMap.slate;

  return {
    Icon: inferredIcon,
    iconWrapClass: picked.iconWrapClass,
    iconClass: picked.iconClass,
    pillClass: picked.pillClass,
  };
}

function buildPagination(current: number, totalPages: number): PageToken[] {
  if (totalPages <= 1) return [1];

  const tokens: PageToken[] = [];
  const add = (v: PageToken): void => {
    if (tokens.length === 0 || tokens[tokens.length - 1] !== v) tokens.push(v);
  };

  const windowSize = 1;
  const start = Math.max(2, current - windowSize);
  const end = Math.min(totalPages - 1, current + windowSize);

  add(1);
  if (start > 2) add("…");
  for (let p = start; p <= end; p += 1) add(p);
  if (end < totalPages - 1) add("…");
  add(totalPages);

  return tokens;
}

export default function TransactionsPage(): ReactElement {
  const cats = useQuery<GetCategoriesData>(GET_CATEGORIES);
  const txs = useQuery<GetTransactionsData>(GET_TRANSACTIONS);

  const [createTx, { loading: creating }] = useMutation<{ createTransaction: Transaction }, CreateTxVars>(
    CREATE_TRANSACTION,
    { refetchQueries: [{ query: GET_TRANSACTIONS }] }
  );

  const [updateTx, { loading: updating }] = useMutation<{ updateTransaction: Transaction }, UpdateTxVars>(
    UPDATE_TRANSACTION,
    { refetchQueries: [{ query: GET_TRANSACTIONS }] }
  );

  const [deleteTx, { loading: deleting }] = useMutation<{ deleteTransaction: boolean }, DeleteTxVars>(
    DELETE_TRANSACTION,
    { refetchQueries: [{ query: GET_TRANSACTIONS }] }
  );

  // filtros
  const [q, setQ] = useState<string>("");
  const [filterType, setFilterType] = useState<TypeFilter>("ALL");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [filterPeriod, setFilterPeriod] = useState<string>(""); // YYYY-MM
  const [periodInitialized, setPeriodInitialized] = useState<boolean>(false);

  // paginação
  const pageSize = 10;
  const [page, setPage] = useState<number>(1);

  // modal
  const [open, setOpen] = useState<boolean>(false);
  const [edit, setEdit] = useState<Transaction | null>(null);

  // form
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(""); // YYYY-MM-DD
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState<string>(""); // em reais
  const [categoryId, setCategoryId] = useState<string>("");

  const periodOptions = useMemo(() => {
    const all = txs.data?.transactions ?? [];
    const set = new Set<string>();
    for (const t of all) set.add(ymFromIso(t.date));
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [txs.data?.transactions]);

  useEffect(() => {
    if (periodInitialized) return;
    if (periodOptions.length === 0) return;
    setFilterPeriod(periodOptions[0]);
    setPeriodInitialized(true);
  }, [periodInitialized, periodOptions]);

  const filtered = useMemo(() => {
    const all = txs.data?.transactions ?? [];
    const s = q.trim().toLowerCase();

    const out = all
      .filter((t) => {
        if (s && !t.description.toLowerCase().includes(s)) return false;
        if (filterType !== "ALL" && t.type !== filterType) return false;

        if (filterCategoryId.trim()) {
          const cid = t.categoryId ?? "";
          if (cid !== filterCategoryId.trim()) return false;
        }

        if (filterPeriod.trim()) {
          if (ymFromIso(t.date) !== filterPeriod.trim()) return false;
        }

        return true;
      })
      .slice()
      .sort((a, b) => safeDateMs(b.date) - safeDateMs(a.date));

    return out;
  }, [txs.data?.transactions, q, filterType, filterCategoryId, filterPeriod]);

  useEffect(() => {
    setPage(1);
  }, [q, filterType, filterCategoryId, filterPeriod]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdxExclusive = Math.min(startIdx + pageSize, total);
  const pageItems = filtered.slice(startIdx, endIdxExclusive);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [page, safePage]);

  function resetForm(): void {
    setDescription("");
    setDate("");
    setType("EXPENSE");
    setAmount("");
    setCategoryId("");
    setEdit(null);
  }

  function openNew(): void {
    resetForm();
    setOpen(true);
  }

  function openEdit(t: Transaction): void {
    setEdit(t);
    setDescription(t.description);
    setDate(toISODateInput(t.date));
    setType(t.type);
    setAmount(String((t.amountCents / 100).toFixed(2)).replace(".", ","));
    setCategoryId(t.categoryId ?? "");
    setOpen(true);
  }

  function parseAmountToCents(v: string): number {
    const raw = v.replace(/\./g, "").replace(",", ".").trim();
    const n = Number(raw);
    if (Number.isNaN(n)) return 0;
    return Math.round(n * 100);
  }

  async function onSubmit(): Promise<void> {
    const desc = description.trim();
    if (!desc) return;
    if (!date) return;

    const cents = parseAmountToCents(amount);
    if (cents <= 0) return;

    const cat = categoryId.trim() ? categoryId.trim() : null;

    if (edit) {
      await updateTx({
        variables: { input: { id: edit.id, description: desc, date, type, amountCents: cents, categoryId: cat } },
      });
    } else {
      await createTx({
        variables: { input: { description: desc, date, type, amountCents: cents, categoryId: cat } },
      });
    }

    setOpen(false);
    resetForm();
  }

  async function onDelete(id: string): Promise<void> {
    const ok = window.confirm("Excluir transação?");
    if (!ok) return;
    await deleteTx({ variables: { id } });
  }

  const paginationTokens = useMemo(() => buildPagination(safePage, totalPages), [safePage, totalPages]);

  const loading = txs.loading || cats.loading;
  const errorMsg = (txs.error?.message ?? cats.error?.message) ?? null;

  const isExpense = type === "EXPENSE";
  const isIncome = type === "INCOME";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight text-fg">Transações</h2>
          <p className="mt-1 text-sm text-muted">Gerencie todas as suas transações financeiras</p>
        </div>

        <button
          onClick={openNew}
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg bg-primary px-3 text-sm font-semibold text-primaryFg shadow-sm transition hover:brightness-110 active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" />
          Nova transação
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-fg">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por descrição"
                className="h-11 w-full rounded-xl border border-border bg-bg pl-10 pr-3 text-sm text-fg outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-fg">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TypeFilter)}
              className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            >
              <option value="ALL">Todos</option>
              <option value="INCOME">Entrada</option>
              <option value="EXPENSE">Saída</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-fg">Categoria</label>
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            >
              <option value="">Todas</option>
              {(cats.data?.categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-fg">Período</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            >
              {periodOptions.map((ym) => (
                <option key={ym} value={ym}>
                  {formatPeriodLabel(ym)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted shadow-sm">
          Carregando...
        </div>
      )}

      {errorMsg && !loading && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 shadow-sm">
          Erro: {errorMsg}
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left">
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wide text-muted">Descrição</th>
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wide text-muted">Data</th>
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wide text-muted">Categoria</th>
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wide text-muted">Tipo</th>
              <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted">
                Valor
              </th>
              <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="text-sm text-fg">
            {pageItems.map((t) => {
              const cat = t.category ?? null;
              const vis = getCategoryVisual(cat);
              const Icon = vis.Icon;

              const rowIsIncome = t.type === "INCOME";
              const TypeIcon = rowIsIncome ? ArrowUpCircle : ArrowDownCircle;

              return (
                <tr key={t.id} className="border-t border-border/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={["flex h-9 w-9 items-center justify-center rounded-lg", vis.iconWrapClass].join(" ")}>
                        <Icon className={["h-4 w-4", vis.iconClass].join(" ")} />
                      </div>
                      <span className="font-medium text-fg">{t.description}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-muted">{isoToBR(t.date)}</td>

                  <td className="px-5 py-4">
                    {cat ? (
                      <span className={["inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", vis.pillClass].join(" ")}>
                        {cat.title}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={[
                        "inline-flex items-center gap-2 text-xs font-medium",
                        rowIsIncome ? "text-emerald-700" : "text-rose-700",
                      ].join(" ")}
                    >
                      <TypeIcon className="h-4 w-4" />
                      {rowIsIncome ? "Entrada" : "Saída"}
                    </span>
                  </td>

                  <td className={["px-5 py-4 text-right font-semibold", rowIsIncome ? "text-emerald-700" : "text-fg"].join(" ")}>
                    {rowIsIncome ? `+ ${brlFromCents(t.amountCents)}` : `- ${brlFromCents(t.amountCents)}`}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onDelete(t.id)}
                        disabled={deleting}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-60"
                        aria-label="Excluir"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => openEdit(t)}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg text-muted transition hover:bg-card"
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {pageItems.length === 0 && !loading ? (
              <tr className="border-t border-border/70">
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">
                  Nenhuma transação encontrada.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {/* Rodapé: resultados + paginação */}
        <div className="flex flex-col gap-3 border-t border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {total === 0 ? "0 a 0" : `${startIdx + 1} a ${endIdxExclusive}`} | {total} resultados
          </p>

          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg text-muted transition hover:bg-card disabled:opacity-50"
              aria-label="Página anterior"
              title="Anterior"
            >
              ‹
            </button>

            {paginationTokens.map((tok, idx) => {
              if (tok === "…") {
                return (
                  <span key={`dots-${idx}`} className="px-2 text-sm text-muted">
                    …
                  </span>
                );
              }

              const n = tok;
              const active = n === safePage;

              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={[
                    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition",
                    active ? "border-primary bg-primary text-primaryFg" : "border-border bg-bg text-muted hover:bg-card",
                  ].join(" ")}
                >
                  {n}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg text-muted transition hover:bg-card disabled:opacity-50"
              aria-label="Próxima página"
              title="Próxima"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title={edit ? "Editar transação" : "Nova transação"}
        subtitle="Registre sua despesa ou receita"
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">

          {/* Tipo (Despesa/Receita) - tamanho igual ao Figma */}
          <div className="w-full rounded-xl border border-border bg-bg p-[7px]">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("EXPENSE")}
                className={[
                  "inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition",
                  isExpense
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-transparent bg-transparent text-muted hover:bg-card/60 hover:text-fg",
                ].join(" ")}
              >
                <ArrowDownCircle className={["h-4 w-4", isExpense ? "text-rose-600" : "text-muted"].join(" ")} />
                Despesa
              </button>

              <button
                type="button"
                onClick={() => setType("INCOME")}
                className={[
                  "inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition",
                  isIncome
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-transparent bg-transparent text-muted hover:bg-card/60 hover:text-fg",
                ].join(" ")}
              >
                <ArrowUpCircle className={["h-4 w-4", isIncome ? "text-emerald-600" : "text-muted"].join(" ")} />
                Receita
              </button>
            </div>
          </div>
          {/* Campos */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-fg">Descrição</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex. Almoço no restaurante"
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg outline-none transition placeholder:text-muted focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-fg">Data</label>
                <input
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  type="date"
                  className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-fg">Valor</label>
                <div className="flex h-11 items-center rounded-xl border border-border bg-bg px-3 transition focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
                  <span className="mr-2 inline-flex items-center text-sm text-muted">R$</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                    className="h-full w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-fg">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Selecione</option>
                {(cats.data?.categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botão salvar (igual imagem) */}
          <button
            onClick={onSubmit}
            disabled={creating || updating}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primaryFg shadow-sm transition hover:brightness-110 disabled:opacity-60"
            type="button"
          >
            {creating || updating ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}