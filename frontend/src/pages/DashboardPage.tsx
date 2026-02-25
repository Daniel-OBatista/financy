import type { ReactElement } from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import {
  type Transaction,
  GET_TRANSACTIONS,
} from "../graphql/ops";
import { brlFromCents } from "../lib/format";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronRight,
  UtensilsCrossed,
  Car,
  ShoppingCart,
  Film,
  Wrench,
  TrendingUp,
  Tag,
} from "lucide-react";

type GetTransactionsData = { transactions: Transaction[] };

function ymd(isoLike: string): { y: number; m: number; d: number } | null {
  // suporta "YYYY-MM-DD" e ISO com hora
  const s = isoLike.includes("T") ? isoLike.slice(0, 10) : isoLike;
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return { y, m, d };
}

function dateMs(isoLike: string): number {
  // garante ordenação consistente
  const hasTime = isoLike.includes("T");
  const s = hasTime ? isoLike : `${isoLike}T00:00:00.000Z`;
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : 0;
}

function isoToBRShort(isoLike: string): string {
  const parts = ymd(isoLike);
  if (!parts) return "—";
  const dd = String(parts.d).padStart(2, "0");
  const mm = String(parts.m).padStart(2, "0");
  const yy = String(parts.y).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

type BadgeStyle = {
  pillBg: string;
  pillText: string;
  iconBg: string;
  iconText: string;
  icon: ReactElement;
};

function categoryStyle(titleRaw: string | null | undefined): BadgeStyle {
  const title = (titleRaw ?? "Outros").trim().toLowerCase();

  if (title.includes("aliment")) {
    return {
      pillBg: "bg-blue-50",
      pillText: "text-blue-700",
      iconBg: "bg-blue-50",
      iconText: "text-blue-700",
      icon: <UtensilsCrossed className="h-4 w-4" />,
    };
  }

  if (title.includes("transport") || title.includes("gas")) {
    return {
      pillBg: "bg-violet-50",
      pillText: "text-violet-700",
      iconBg: "bg-violet-50",
      iconText: "text-violet-700",
      icon: <Car className="h-4 w-4" />,
    };
  }

  if (title.includes("mercad") || title.includes("compr")) {
    return {
      pillBg: "bg-orange-50",
      pillText: "text-orange-700",
      iconBg: "bg-orange-50",
      iconText: "text-orange-700",
      icon: <ShoppingCart className="h-4 w-4" />,
    };
  }

  if (title.includes("entreten") || title.includes("lazer")) {
    return {
      pillBg: "bg-pink-50",
      pillText: "text-pink-700",
      iconBg: "bg-pink-50",
      iconText: "text-pink-700",
      icon: <Film className="h-4 w-4" />,
    };
  }

  if (title.includes("util") || title.includes("conta") || title.includes("casa")) {
    return {
      pillBg: "bg-yellow-50",
      pillText: "text-yellow-800",
      iconBg: "bg-yellow-50",
      iconText: "text-yellow-800",
      icon: <Wrench className="h-4 w-4" />,
    };
  }

  if (title.includes("invest")) {
    return {
      pillBg: "bg-emerald-50",
      pillText: "text-emerald-700",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-700",
      icon: <TrendingUp className="h-4 w-4" />,
    };
  }

  if (title.includes("receit") || title.includes("sal")) {
    return {
      pillBg: "bg-emerald-50",
      pillText: "text-emerald-700",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-700",
      icon: <Tag className="h-4 w-4" />,
    };
  }

  return {
    pillBg: "bg-slate-100",
    pillText: "text-slate-700",
    iconBg: "bg-slate-100",
    iconText: "text-slate-700",
    icon: <Tag className="h-4 w-4" />,
  };
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconText,
}: {
  label: string;
  value: string;
  icon: ReactElement;
  iconBg: string;
  iconText: string;
}): ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={["grid h-9 w-9 place-items-center rounded-xl", iconBg].join(" ")}>
          <div className={iconText}>{icon}</div>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage(): ReactElement {
  const txs = useQuery<GetTransactionsData>(GET_TRANSACTIONS);

  const all = txs.data?.transactions ?? [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const totals = useMemo(() => {
    const incomeAll = all
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amountCents, 0);

    const expenseAll = all
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amountCents, 0);

    const balanceAll = incomeAll - expenseAll;

    const monthTx = all.filter((t) => {
      const parts = ymd(t.date);
      if (!parts) return false;
      return parts.y === currentYear && parts.m === currentMonth;
    });

    const incomeMonth = monthTx
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amountCents, 0);

    const expenseMonth = monthTx
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amountCents, 0);

    return { balanceAll, incomeMonth, expenseMonth };
  }, [all, currentYear, currentMonth]);

  const recentTx = useMemo(() => {
    return [...all].sort((a, b) => dateMs(b.date) - dateMs(a.date)).slice(0, 5);
  }, [all]);

  type CatAgg = { title: string; count: number; totalCents: number };

  const categories = useMemo((): CatAgg[] => {
    const map = new Map<string, CatAgg>();

    for (const t of all) {
      // no dashboard do print, categorias = gastos (despesas)
      if (t.type !== "EXPENSE") continue;

      const title = t.category?.title?.trim() || "Outros";
      const key = title.toLowerCase();

      const prev = map.get(key);
      if (!prev) {
        map.set(key, { title, count: 1, totalCents: t.amountCents });
      } else {
        map.set(key, {
          title: prev.title,
          count: prev.count + 1,
          totalCents: prev.totalCents + t.amountCents,
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.totalCents - a.totalCents)
      .slice(0, 5);
  }, [all]);

  return (
    <div className="space-y-5">
      {txs.loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Carregando...
        </div>
      ) : null}

      {txs.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Erro: {txs.error.message}
        </div>
      ) : null}

      {/* Top cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Saldo total"
          value={brlFromCents(totals.balanceAll)}
          icon={<Wallet className="h-4 w-4" />}
          iconBg="bg-violet-50"
          iconText="text-violet-700"
        />

        <StatCard
          label="Receitas do mês"
          value={brlFromCents(totals.incomeMonth)}
          icon={<ArrowUpRight className="h-4 w-4" />}
          iconBg="bg-emerald-50"
          iconText="text-emerald-700"
        />

        <StatCard
          label="Despesas do mês"
          value={brlFromCents(totals.expenseMonth)}
          icon={<ArrowDownRight className="h-4 w-4" />}
          iconBg="bg-rose-50"
          iconText="text-rose-700"
        />
      </div>

      {/* Bottom: Recent tx + Categories */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent transactions */}
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Transações recentes
            </p>

            <Link
              to="/transactions"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Ver todas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTx.map((t) => {
              const catTitle = t.category?.title ?? (t.type === "INCOME" ? "Receita" : "Outros");
              const st = categoryStyle(catTitle);

              const isIncome = t.type === "INCOME";
              const sign = isIncome ? "+" : "-";
              const amountText = `${sign} ${brlFromCents(t.amountCents)}`;

              return (
                <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                  <div
                    className={[
                      "grid h-10 w-10 place-items-center rounded-xl",
                      st.iconBg,
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    <div className={st.iconText}>{st.icon}</div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {t.description}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {isoToBRShort(t.date)}
                    </p>
                  </div>

                  <span
                    className={[
                      "hidden sm:inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                      st.pillBg,
                      st.pillText,
                    ].join(" ")}
                  >
                    {catTitle}
                  </span>

                  <div className="flex items-center gap-3">
                    <p
                      className={[
                        "text-sm font-semibold tabular-nums",
                        isIncome ? "text-emerald-700" : "text-slate-700",
                      ].join(" ")}
                    >
                      {amountText}
                    </p>

                    <span
                      className={[
                        "grid h-6 w-6 place-items-center rounded-full border",
                        isIncome ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      {isIncome ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </div>
                </div>
              );
            })}

            {recentTx.length === 0 && !txs.loading ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                Nenhuma transação encontrada ainda.
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-100 px-5 py-4">
            <Link
              to="/transactions"
              className="mx-auto inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <Plus className="h-4 w-4" />
              Nova transação
            </Link>
          </div>
        </div>

        {/* Categories */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Categorias
            </p>

            <Link
              to="/categories"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Gerenciar <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {categories.map((c) => {
              const st = categoryStyle(c.title);
              const itens = c.count === 1 ? "item" : "itens";

              return (
                <div key={c.title} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-5 py-4">
                  <span
                    className={[
                      "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold",
                      st.pillBg,
                      st.pillText,
                    ].join(" ")}
                  >
                    {c.title}
                  </span>

                  <span className="text-sm text-slate-500">
                    {c.count} {itens}
                  </span>

                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                    {brlFromCents(c.totalCents)}
                  </span>
                </div>
              );
            })}

            {categories.length === 0 && !txs.loading ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                Nenhuma categoria com despesas ainda.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}