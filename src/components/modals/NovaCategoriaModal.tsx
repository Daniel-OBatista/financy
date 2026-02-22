"use client";

import { useMemo, useState } from "react";
import {
  X,
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

export type CategoryColor =
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "orange"
  | "yellow";

export type CategoryIcon =
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

export type NewCategoryPayload = {
  titulo: string;
  descricao: string;
  icone: CategoryIcon;
  cor: CategoryColor;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: NewCategoryPayload) => void;
};

const ICONS: CategoryIcon[] = [
  "wallet",
  "car",
  "heart",
  "pig",
  "cart",
  "film",
  "gift",
  "fork",
  "home",
  "tool",
  "book",
  "bag",
];

const COLORS: CategoryColor[] = [
  "green",
  "blue",
  "purple",
  "pink",
  "red",
  "orange",
  "yellow",
];

const ICON_META: Record<CategoryIcon, { label: string; Icon: LucideIcon }> = {
  wallet: { label: "Carteira", Icon: Wallet },
  car: { label: "Carro", Icon: Car },
  heart: { label: "Saúde", Icon: Heart },
  pig: { label: "Investimentos", Icon: PiggyBank },
  cart: { label: "Compras", Icon: ShoppingCart },
  film: { label: "Cinema", Icon: Film },
  gift: { label: "Presentes", Icon: Gift },
  fork: { label: "Alimentação", Icon: Utensils },
  home: { label: "Casa", Icon: Home },
  tool: { label: "Ferramentas", Icon: Wrench },
  book: { label: "Estudos", Icon: BookOpen },
  bag: { label: "Bolsa", Icon: ShoppingBag },
};

function colorClass(c: CategoryColor): string {
  const map: Record<CategoryColor, string> = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
  };
  return map[c];
}

export default function NovaCategoriaModal({ open, onClose, onSave }: Props) {
  const [titulo, setTitulo] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [icone, setIcone] = useState<CategoryIcon>("wallet");
  const [cor, setCor] = useState<CategoryColor>("green");

  const canSave = useMemo(() => titulo.trim().length > 0, [titulo]);

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
            <h3 className="text-sm font-semibold text-gray-900">
              Nova categoria
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Organize suas transações com categorias
            </p>
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

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex. Alimentação"
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Descrição</label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição da categoria"
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/10"
            />
            <p className="mt-2 text-[11px] text-gray-400">Opcional</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Ícone</label>

            <div className="mt-2 grid grid-cols-6 gap-2">
              {ICONS.map((key) => {
                const active = key === icone;
                const meta = ICON_META[key];
                const IconComp = meta.Icon;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcone(key)}
                    aria-label={meta.label}
                    aria-pressed={active}
                    title={meta.label}
                    className={[
                      "flex h-10 items-center justify-center rounded-xl border transition",
                      "focus:outline-none focus:ring-4 focus:ring-brand-base/10",
                      active
                        ? "border-brand-base bg-brand-base/10 text-brand-base"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <IconComp className="h-5 w-5" />
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-[11px] text-gray-400">
              Selecionado:{" "}
              <span className="font-semibold text-gray-700">
                {ICON_META[icone].label}
              </span>
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Cor</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((c) => {
                const active = c === cor;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCor(c)}
                    className={[
                      "h-7 w-10 rounded-lg border p-[3px]",
                      active ? "border-gray-900/20" : "border-gray-200",
                    ].join(" ")}
                    aria-label={`Cor ${c}`}
                    title={c}
                  >
                    <span
                      className={["block h-full w-full rounded-md", colorClass(c)].join(
                        " "
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={!canSave}
            onClick={() =>
              onSave({
                titulo: titulo.trim(),
                descricao: descricao.trim(),
                icone,
                cor,
              })
            }
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