import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
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

  const [q, setQ] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [edit, setEdit] = useState<Transaction | null>(null);

  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(""); // YYYY-MM-DD
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState<string>(""); // em reais
  const [categoryId, setCategoryId] = useState<string>("");

  const list = useMemo(() => {
    const all = txs.data?.transactions ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter((t) => t.description.toLowerCase().includes(s));
  }, [txs.data?.transactions, q]);

  const summary = useMemo(() => {
    const all = txs.data?.transactions ?? [];
    const income = all.filter((t) => t.type === "INCOME").reduce((acc, t) => acc + t.amountCents, 0);
    const expense = all.filter((t) => t.type === "EXPENSE").reduce((acc, t) => acc + t.amountCents, 0);
    return { income, expense, balance: income - expense };
  }, [txs.data?.transactions]);

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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-tight">Transações</h2>
          <p className="text-sm text-muted">Controle de entradas e saídas.</p>
        </div>

        <div className="sm:ml-auto flex w-full gap-2 sm:w-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="w-full sm:w-72 rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none backdrop-blur focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />

          <button
            onClick={openNew}
            className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primaryFg shadow-lg shadow-primary/15 transition hover:brightness-110"
            type="button"
          >
            Nova
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-border/25 bg-card/35 p-4 backdrop-blur">
          <p className="text-xs font-bold text-muted">Entradas</p>
          <p className="mt-1 text-lg font-black text-emerald-300">{brlFromCents(summary.income)}</p>
        </div>

        <div className="rounded-3xl border border-border/25 bg-card/35 p-4 backdrop-blur">
          <p className="text-xs font-bold text-muted">Saídas</p>
          <p className="mt-1 text-lg font-black text-rose-300">{brlFromCents(summary.expense)}</p>
        </div>

        <div className="rounded-3xl border border-border/25 bg-card/35 p-4 backdrop-blur">
          <p className="text-xs font-bold text-muted">Saldo</p>
          <p className="mt-1 text-lg font-black text-fg">{brlFromCents(summary.balance)}</p>
        </div>
      </div>

      {(txs.loading || cats.loading) && (
        <div className="rounded-3xl border border-border/25 bg-card/30 p-4 text-sm text-muted">
          Carregando...
        </div>
      )}

      {(txs.error || cats.error) && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          Erro: {(txs.error?.message ?? cats.error?.message) ?? "desconhecido"}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-border/25 bg-card/30 backdrop-blur">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-card/50 text-muted">
            <tr>
              <th className="px-4 py-3 text-left font-extrabold">Descrição</th>
              <th className="px-4 py-3 text-left font-extrabold">Categoria</th>
              <th className="px-4 py-3 text-left font-extrabold">Data</th>
              <th className="px-4 py-3 text-left font-extrabold">Tipo</th>
              <th className="px-4 py-3 text-right font-extrabold">Valor</th>
              <th className="px-4 py-3 text-right font-extrabold">Ações</th>
            </tr>
          </thead>

          <tbody className="text-fg">
            {list.map((t) => (
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
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(t)}
                      className="rounded-2xl border border-border/25 bg-card/40 px-3 py-1.5 text-xs font-semibold text-fg transition hover:bg-card/60"
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      disabled={deleting}
                      className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-60"
                      type="button"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {list.length === 0 && !txs.loading ? (
              <tr className="border-t border-border/20">
                <td className="px-4 py-6 text-muted" colSpan={6}>
                  Nenhuma transação encontrada.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={edit ? "Editar transação" : "Nova transação"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted">Descrição</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted">Data</label>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                className="w-full rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              >
                <option value="INCOME">Entrada</option>
                <option value="EXPENSE">Saída</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted">Valor (R$)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Sem categoria</option>
                {(cats.data?.categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={creating || updating}
            className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primaryFg shadow-lg shadow-primary/15 transition hover:brightness-110 disabled:opacity-60"
            type="button"
          >
            {creating || updating ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}