"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

export type TransactionType = "entrada" | "saida";

export type CategoryOption = {
  id: string;
  title: string;
};

export type NewTransactionPayload = {
  type: TransactionType;
  description: string;
  date: string; // YYYY-MM-DD
  amount: number; // numeric(12,2)
  category_id: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: NewTransactionPayload) => void;
  categories: CategoryOption[];
};

function parseAmountToNumber(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "") // remove separador milhar
    .replace(",", "."); // decimal pt-BR

  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export default function NovaTransacaoModal({
  open,
  onClose,
  onSave,
  categories,
}: Props) {
  const [type, setType] = useState<TransactionType>("saida");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [amountRaw, setAmountRaw] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");

  const canSave = useMemo(() => {
    const amount = parseAmountToNumber(amountRaw);
    return description.trim().length > 0 && date.trim().length > 0 && amount !== null;
  }, [description, date, amountRaw]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-label="Fechar modal"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Nova transação</h3>
            <p className="mt-1 text-xs text-gray-500">Registre sua despesa ou receita</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* tabs */}
        <div className="mt-5 rounded-xl border border-gray-200 p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setType("saida")}
              className={[
                "h-10 rounded-lg text-sm font-semibold transition",
                type === "saida"
                  ? "border border-red-200 bg-red-50 text-red-600"
                  : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              Despesa
            </button>

            <button
              type="button"
              onClick={() => setType("entrada")}
              className={[
                "h-10 rounded-lg text-sm font-semibold transition",
                type === "entrada"
                  ? "border border-green-200 bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              Receita
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700">Descrição</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex. Almoço no restaurante"
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-700">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Valor</label>
              <input
                value={amountRaw}
                onChange={(e) => setAmountRaw(e.target.value)}
                placeholder="Ex: 89,90"
                inputMode="decimal"
                className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              const amount = parseAmountToNumber(amountRaw);
              if (amount === null) return;

              onSave({
                type,
                description: description.trim(),
                date: date.trim(),
                amount,
                category_id: categoryId ? categoryId : null,
              });
            }}
            className={[
              "mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition",
              canSave
                ? "bg-brand-base hover:bg-brand-dark focus:outline-none focus:ring-4 focus:ring-brand-base/20"
                : "cursor-not-allowed bg-gray-300",
            ].join(" ")}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}