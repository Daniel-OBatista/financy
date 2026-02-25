import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  type Transaction,
  GET_TRANSACTIONS,
} from "../graphql/ops";
import { brlFromCents, isoToBR } from "../lib/format";

type GetTransactionsData = { transactions: Transaction[] };

type SortKey = "date_desc" | "date_asc" | "az" | "za" | "amount_desc" | "amount_asc";

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

function monthLabel(m: number): string {
  const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return labels[m - 1] ?? String(m);
}

export default function DashboardPage(): ReactElement {
  const txs = useQuery<GetTransactionsData>(GET_TRANSACTIONS);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const all = txs.data?.transactions ?? [];

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const t of all) {
      const parts = ymd(t.date);
      if (parts) set.add(parts.y);
    }
    const arr = Array.from(set).sort((a, b) => b - a);
    if (arr.length === 0) return [currentYear];
    if (!arr.includes(currentYear)) arr.unshift(currentYear);
    return arr;
  }, [all, currentYear]);

  const [year, setYear] = useState<number>(availableYears[0] ?? currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [q, setQ] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("date_desc");

  // mantém year válido quando carregar dados
  useMemo(() => {
    if (!availableYears.includes(year)) setYear(availableYears[0] ?? currentYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableYears.join(","), year, currentYear]);

  const periodTx = useMemo(() => {
    const filteredByPeriod = all.filter((t) => {
      const parts = ymd(t.date);
      if (!parts) return false;
      return parts.y === year && parts.m === month;
    });

    const s = q.trim().toLowerCase();
    const filtered = s
      ? filteredByPeriod.filter((t) => t.description.toLowerCase().includes(s))
      : filteredByPeriod;

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "az") return a.description.localeCompare(b.description);
      if (sort === "za") return b.description.localeCompare(a.description);

      if (sort === "amount_desc") return b.amountCents - a.amountCents;
      if (sort === "amount_asc") return a.amountCents - b.amountCents;

      // date
      const ad = a.date.includes("T") ? a.date : `${a.date}T00:00:00.000Z`;
      const bd = b.date.includes("T") ? b.date : `${b.date}T00:00:00.000Z`;
      const at = new Date(ad).getTime();
      const bt = new Date(bd).getTime();
      return sort === "date_asc" ? at - bt : bt - at;
    });

    return sorted;
  }, [all, year, month, q, sort]);

  const summary = useMemo(() => {
    const income = periodTx
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amountCents, 0);

    const expense = periodTx
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amountCents, 0);

    return { income, expense, balance: income - expense };
  }, [periodTx]);

  const chart = useMemo(() => {
    // Resultado (saldo) por mês no ano selecionado
    const byMonth = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
      const monthTx = all.filter((t) => {
        const parts = ymd(t.date);
        if (!parts) return false;
        return parts.y === year && parts.m === m;
      });

      const inc = monthTx.filter((t) => t.type === "INCOME").reduce((acc, t) => acc + t.amountCents, 0);
      const exp = monthTx.filter((t) => t.type === "EXPENSE").reduce((acc, t) => acc + t.amountCents, 0);
      const net = inc - exp;

      return { m, net };
    });

    const maxAbs = Math.max(1, ...byMonth.map((x) => Math.abs(x.net)));
    return { byMonth, maxAbs };
  }, [all, year]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted">
            Visão do período selecionado (mês/ano), com resumo e gráfico.
          </p>
        </div>

        <div className="sm:ml-auto grid w-full gap-2 sm:w-auto sm:grid-cols-4">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none backdrop-blur focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none backdrop-blur focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar descrição..."
            className="rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none backdrop-blur focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none backdrop-blur focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          >
            <option value="date_desc">Data (mais recente)</option>
            <option value="date_asc">Data (mais antiga)</option>
            <option value="az">Descrição (A-Z)</option>
            <option value="za">Descrição (Z-A)</option>
            <option value="amount_desc">Valor (maior)</option>
            <option value="amount_asc">Valor (menor)</option>
          </select>
        </div>
      </div>

      {txs.loading ? (
        <div className="rounded-3xl border border-border/25 bg-card/30 p-4 text-sm text-muted">
          Carregando...
        </div>
      ) : null}

      {txs.error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          Erro: {txs.error.message}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-border/25 bg-card/35 p-4 backdrop-blur">
          <p className="text-xs font-bold text-muted">Entradas ({monthLabel(month)}/{year})</p>
          <p className="mt-1 text-lg font-black text-emerald-300">{brlFromCents(summary.income)}</p>
        </div>

        <div className="rounded-3xl border border-border/25 bg-card/35 p-4 backdrop-blur">
          <p className="text-xs font-bold text-muted">Saídas ({monthLabel(month)}/{year})</p>
          <p className="mt-1 text-lg font-black text-rose-300">{brlFromCents(summary.expense)}</p>
        </div>

        <div className="rounded-3xl border border-border/25 bg-card/35 p-4 backdrop-blur">
          <p className="text-xs font-bold text-muted">Saldo ({monthLabel(month)}/{year})</p>
          <p className="mt-1 text-lg font-black text-fg">{brlFromCents(summary.balance)}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border/25 bg-card/35 p-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-extrabold">Resultado por mês</p>
            <p className="text-xs text-muted">Saldo (entradas - saídas) em {year}</p>
          </div>
          <span className="rounded-2xl border border-border/25 bg-card/40 px-3 py-1 text-xs font-semibold text-muted">
            {monthLabel(month)} selecionado
          </span>
        </div>

        <div className="mt-4 flex items-end gap-2">
          {chart.byMonth.map((b) => {
            const h = Math.round((Math.abs(b.net) / chart.maxAbs) * 100);
            const isSelected = b.m === month;
            const isPositive = b.net >= 0;

            return (
              <button
                key={b.m}
                type="button"
                onClick={() => setMonth(b.m)}
                className={[
                  "group flex-1 rounded-2xl border px-2 py-2 transition",
                  "border-border/25 bg-card/25 hover:bg-card/40",
                  isSelected ? "ring-4 ring-primary/10 border-primary/35" : "",
                ].join(" ")}
                title={`${monthLabel(b.m)}: ${brlFromCents(b.net)}`}
              >
                <div className="flex h-24 items-end justify-center">
                  <div
                    className={[
                      "w-full rounded-xl transition",
                      isPositive ? "bg-emerald-400/70" : "bg-rose-400/70",
                      isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-90",
                    ].join(" ")}
                    style={{ height: `${Math.max(6, h)}%` }}
                  />
                </div>
                <div className="mt-2 text-center text-[11px] font-bold text-muted">
                  {monthLabel(b.m)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/25 bg-card/30 backdrop-blur">
        <div className="flex items-center justify-between gap-3 border-b border-border/20 px-4 py-3">
          <p className="text-sm font-extrabold">
            Transações ({monthLabel(month)}/{year})
          </p>
          <p className="text-xs text-muted">{periodTx.length} item(ns)</p>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead className="bg-card/50 text-muted">
            <tr>
              <th className="px-4 py-3 text-left font-extrabold">Descrição</th>
              <th className="px-4 py-3 text-left font-extrabold">Categoria</th>
              <th className="px-4 py-3 text-left font-extrabold">Data</th>
              <th className="px-4 py-3 text-left font-extrabold">Tipo</th>
              <th className="px-4 py-3 text-right font-extrabold">Valor</th>
            </tr>
          </thead>

          <tbody className="text-fg">
            {periodTx.map((t) => (
              <tr key={t.id} className="border-t border-border/20">
                <td className="px-4 py-3">{t.description}</td>
                <td className="px-4 py-3 text-muted">{t.category ? t.category.title : "—"}</td>
                <td className="px-4 py-3 text-muted">{isoToBR(t.date)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-2xl border border-border/25 bg-card/45 px-2.5 py-1 text-[11px] font-bold text-muted">
                    {t.type === "INCOME" ? "Entrada" : "Saída"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-extrabold">{brlFromCents(t.amountCents)}</td>
              </tr>
            ))}

            {periodTx.length === 0 && !txs.loading ? (
              <tr className="border-t border-border/20">
                <td className="px-4 py-6 text-muted" colSpan={5}>
                  Nenhuma transação encontrada para este período.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}