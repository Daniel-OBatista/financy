import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Plus,
  Trash2,
  Pencil,
  Tag,
  ArrowUpDown,
  Wallet,
  UtensilsCrossed,
  Film,
  PiggyBank,
  ShoppingCart,
  BadgeDollarSign,
  HeartPulse,
  Car,
  PlugZap,
  Home,
  Gift,
  Wrench,
  BookOpen,
  Monitor,
  CreditCard,
  FileText,
  Share2,
  type LucideIcon,
} from "lucide-react";
import Modal from "../components/Modal";
import {
  type Category,
  GET_CATEGORIES,
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
} from "../graphql/ops";

type GetCategoriesData = { categories: Category[] };

type CreateCategoryVars = {
  input: { title: string; description?: string | null; icon: string; color: string };
};

type UpdateCategoryVars = {
  input: { id: string; title?: string; description?: string | null; icon?: string; color?: string };
};

type DeleteCategoryVars = { id: string };

// ✅ Query leve só pra montar os cards/estatísticas (counts + mais usada)
const GET_TRANSACTIONS_FOR_CATEGORY_STATS = gql`
  query GetTransactionsForCategoryStats {
    transactions {
      id
      category {
        id
      }
    }
  }
`;

type TxForStats = {
  id: string;
  category: { id: string } | null;
};

type GetTransactionsForStatsData = {
  transactions: TxForStats[];
};

type ColorStyle = {
  iconBg: string;
  iconFg: string;
  pillBg: string;
  pillFg: string;
};

const COLOR_STYLES: Record<string, ColorStyle> = {
  blue: {
    iconBg: "bg-blue-500/10",
    iconFg: "text-blue-600",
    pillBg: "bg-blue-500/10",
    pillFg: "text-blue-700",
  },
  pink: {
    iconBg: "bg-pink-500/10",
    iconFg: "text-pink-600",
    pillBg: "bg-pink-500/10",
    pillFg: "text-pink-700",
  },
  green: {
    iconBg: "bg-emerald-500/10",
    iconFg: "text-emerald-600",
    pillBg: "bg-emerald-500/10",
    pillFg: "text-emerald-700",
  },
  orange: {
    iconBg: "bg-orange-500/10",
    iconFg: "text-orange-600",
    pillBg: "bg-orange-500/10",
    pillFg: "text-orange-700",
  },
  yellow: {
    iconBg: "bg-amber-500/12",
    iconFg: "text-amber-600",
    pillBg: "bg-amber-500/12",
    pillFg: "text-amber-700",
  },
  purple: {
    iconBg: "bg-violet-500/10",
    iconFg: "text-violet-600",
    pillBg: "bg-violet-500/10",
    pillFg: "text-violet-700",
  },
  red: {
    iconBg: "bg-rose-500/10",
    iconFg: "text-rose-600",
    pillBg: "bg-rose-500/10",
    pillFg: "text-rose-700",
  },
};

const DEFAULT_STYLE: ColorStyle = {
  iconBg: "bg-slate-500/10",
  iconFg: "text-slate-600",
  pillBg: "bg-slate-500/10",
  pillFg: "text-slate-700",
};

const ICONS: Record<string, LucideIcon> = {
  wallet: Wallet,
  home: Home,
  health: HeartPulse,
  heart: HeartPulse,
  investment: PiggyBank,
  piggy: PiggyBank,
  market: ShoppingCart,
  cart: ShoppingCart,
  entertainment: Film,
  film: Film,
  gift: Gift,
  food: UtensilsCrossed,
  utensils: UtensilsCrossed,
  utilities: PlugZap,
  energy: PlugZap,
  salary: BadgeDollarSign,
  money: BadgeDollarSign,
  transport: Car,
  car: Car,
  tools: Wrench,
  book: BookOpen,
  monitor: Monitor,
  card: CreditCard,
  file: FileText,
  share: Share2,
};

type MostUsed = { category: Category; count: number } | null;

type IconOption = { key: string; Icon: LucideIcon };
const ICON_OPTIONS: IconOption[] = [
  { key: "wallet", Icon: Wallet },
  { key: "card", Icon: CreditCard },
  { key: "health", Icon: HeartPulse },
  { key: "investment", Icon: PiggyBank },
  { key: "market", Icon: ShoppingCart },
  { key: "entertainment", Icon: Film },
  { key: "gift", Icon: Gift },
  { key: "food", Icon: UtensilsCrossed },
  { key: "share", Icon: Share2 },
  { key: "home", Icon: Home },
  { key: "salary", Icon: BadgeDollarSign },
  { key: "tools", Icon: Wrench },
  { key: "book", Icon: BookOpen },
  { key: "monitor", Icon: Monitor },
  { key: "utilities", Icon: PlugZap },
  { key: "file", Icon: FileText },
];

type ColorOption = { key: string; fillClass: string };
const COLOR_OPTIONS: ColorOption[] = [
  { key: "green", fillClass: "bg-emerald-500" },
  { key: "blue", fillClass: "bg-blue-500" },
  { key: "purple", fillClass: "bg-violet-500" },
  { key: "pink", fillClass: "bg-pink-500" },
  { key: "red", fillClass: "bg-rose-500" },
  { key: "orange", fillClass: "bg-orange-500" },
  { key: "yellow", fillClass: "bg-amber-500" },
];

function itensLabel(n: number): string {
  return n === 1 ? "1 item" : `${n} itens`;
}

function getStyle(color: string | null | undefined): ColorStyle {
  const key = (color ?? "").trim().toLowerCase();
  return COLOR_STYLES[key] ?? DEFAULT_STYLE;
}

function getIcon(icon: string | null | undefined): LucideIcon {
  const key = (icon ?? "").trim().toLowerCase();
  return ICONS[key] ?? Tag;
}

function StatBlock({
  icon: Icon,
  iconClassName,
  title,
  subtitle,
  rightDivider,
}: {
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  subtitle: string;
  rightDivider?: boolean;
}): ReactElement {
  return (
    <div
      className={[
        "flex items-center gap-3 p-5",
        rightDivider === true ? "md:border-r md:border-border/25" : "",
      ].join(" ")}
    >
      <span className={["inline-flex h-9 w-9 items-center justify-center rounded-xl", iconClassName].join(" ")}>
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0">
        <div className="text-2xl font-black tracking-tight text-fg">{title}</div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted">{subtitle}</div>
      </div>
    </div>
  );
}

export default function CategoriesPage(): ReactElement {
  const { data, loading, error } = useQuery<GetCategoriesData>(GET_CATEGORIES);
  const {
    data: txData,
    loading: txLoading,
    error: txError,
  } = useQuery<GetTransactionsForStatsData>(GET_TRANSACTIONS_FOR_CATEGORY_STATS);

  const [createCategory, { loading: creating }] = useMutation<
    { createCategory: Category },
    CreateCategoryVars
  >(CREATE_CATEGORY, { refetchQueries: [{ query: GET_CATEGORIES }] });

  const [updateCategory, { loading: updating }] = useMutation<
    { updateCategory: Category },
    UpdateCategoryVars
  >(UPDATE_CATEGORY, { refetchQueries: [{ query: GET_CATEGORIES }] });

  const [deleteCategory, { loading: deleting }] = useMutation<
    { deleteCategory: boolean },
    DeleteCategoryVars
  >(DELETE_CATEGORY, { refetchQueries: [{ query: GET_CATEGORIES }] });

  const [open, setOpen] = useState<boolean>(false);
  const [edit, setEdit] = useState<Category | null>(null);

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [icon, setIcon] = useState<string>("wallet");
  const [color, setColor] = useState<string>("green");

  const categories = data?.categories ?? [];
  const txs = txData?.transactions ?? [];

  const countsByCategoryId = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of txs) {
      const id = t.category?.id;
      if (!id) continue;
      m.set(id, (m.get(id) ?? 0) + 1);
    }
    return m;
  }, [txs]);

  const totalCategories = categories.length;
  const totalTransactions = txs.length;

  const mostUsed: MostUsed = useMemo(() => {
    if (categories.length === 0) return null;

    let best: Category | null = null;
    let bestCount = -1;

    for (const c of categories) {
      const n = countsByCategoryId.get(c.id) ?? 0;
      if (n > bestCount) {
        bestCount = n;
        best = c;
      }
    }

    if (best == null || bestCount <= 0) return null;
    return { category: best, count: bestCount };
  }, [categories, countsByCategoryId]);

  function resetForm(): void {
    setTitle("");
    setDescription("");
    setIcon("wallet");
    setColor("green");
    setEdit(null);
  }

  function closeModal(): void {
    setOpen(false);
    resetForm();
  }

  function openNew(): void {
    resetForm();
    setOpen(true);
  }

  function openEdit(c: Category): void {
    setEdit(c);
    setTitle(c.title);
    setDescription(c.description ?? "");
    setIcon(c.icon);
    setColor(c.color);
    setOpen(true);
  }

  async function onSubmit(): Promise<void> {
    const t = title.trim();
    if (!t) return;

    const desc = description.trim() ? description.trim() : null;

    if (edit) {
      await updateCategory({
        variables: { input: { id: edit.id, title: t, description: desc, icon, color } },
      });
    } else {
      await createCategory({
        variables: { input: { title: t, description: desc, icon, color } },
      });
    }

    closeModal();
  }

  async function onDelete(id: string): Promise<void> {
    const ok = window.confirm("Excluir categoria?");
    if (!ok) return;
    await deleteCategory({ variables: { id } });
  }

  const pageError = error?.message ?? txError?.message ?? null;
  const pageLoading = loading || txLoading;

  const MostIcon: LucideIcon = mostUsed ? getIcon(mostUsed.category.icon) : Tag;
  const mostStyle = mostUsed ? getStyle(mostUsed.category.color) : DEFAULT_STYLE;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-tight text-fg">Categorias</h2>
          <p className="text-sm text-muted">Organize suas transações por categorias</p>
        </div>

        <button
          onClick={openNew}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
          type="button"
        >
          <Plus className="h-4 w-4" />
          Nova categoria
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/25 bg-card/40 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="grid md:grid-cols-3">
          <StatBlock
            icon={Tag}
            iconClassName="bg-slate-500/10 text-slate-700"
            title={String(totalCategories)}
            subtitle="TOTAL DE CATEGORIAS"
            rightDivider
          />

          <StatBlock
            icon={ArrowUpDown}
            iconClassName="bg-violet-500/10 text-violet-700"
            title={String(totalTransactions)}
            subtitle="TOTAL DE TRANSAÇÕES"
            rightDivider
          />

          <div className="flex items-center gap-3 p-5">
            <span
              className={[
                "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                mostUsed ? mostStyle.iconBg : "bg-slate-500/10",
                mostUsed ? mostStyle.iconFg : "text-slate-700",
              ].join(" ")}
            >
              <MostIcon className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <div className="truncate text-lg font-black tracking-tight text-fg sm:text-2xl">
                {mostUsed ? mostUsed.category.title : "—"}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted">
                CATEGORIA MAIS UTILIZADA
              </div>
            </div>
          </div>
        </div>
      </div>

      {pageLoading && (
        <div className="rounded-2xl border border-border/25 bg-card/30 p-4 text-sm text-muted">
          Carregando...
        </div>
      )}

      {pageError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          Erro: {pageError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => {
          const n = countsByCategoryId.get(c.id) ?? 0;
          const style = getStyle(c.color);
          const Icon = getIcon(c.icon);

          return (
            <div
              key={c.id}
              className="rounded-2xl border border-border/25 bg-card/35 p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={[
                    "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                    style.iconBg,
                    style.iconFg,
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDelete(c.id)}
                    disabled={deleting}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-600 transition hover:bg-rose-500/15 disabled:opacity-60"
                    type="button"
                    aria-label="Excluir"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => openEdit(c)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border/25 bg-card/40 text-muted transition hover:bg-card/60 hover:text-fg"
                    type="button"
                    aria-label="Editar"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-sm font-extrabold text-fg">{c.title}</p>
                <p className="mt-1 min-h-[32px] text-xs leading-snug text-muted">
                  {c.description ?? "Sem descrição"}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold",
                    style.pillBg,
                    style.pillFg,
                  ].join(" ")}
                >
                  {c.title}
                </span>

                <span className="text-xs text-muted">{itensLabel(n)}</span>
              </div>
            </div>
          );
        })}

        {categories.length === 0 && !pageLoading ? (
          <div className="rounded-2xl border border-border/25 bg-card/30 p-6 text-sm text-muted sm:col-span-2 lg:col-span-4">
            Nenhuma categoria encontrada.
          </div>
        ) : null}
      </div>

      {/* ✅ Modal no padrão da imagem (SEM header interno e SEM segundo X) */}
      <Modal
        open={open}
        title={edit ? "Editar categoria" : "Nova categoria"}
        subtitle="Organize suas transações com categorias"
        onClose={closeModal}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-fg">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Alimentação"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-fg outline-none placeholder:text-muted focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-fg">Descrição</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da categoria"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-fg outline-none placeholder:text-muted focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
            />
            <div className="text-xs text-muted">Opcional</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-fg">Ícone</label>
            <div className="grid grid-cols-8 gap-2">
              {ICON_OPTIONS.map(({ key, Icon }) => {
                const selected = icon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    className={[
                      "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition",
                      "focus:outline-none focus:ring-4 focus:ring-emerald-500/15",
                      selected
                        ? "border-emerald-600 bg-emerald-500/10 text-emerald-700"
                        : "border-border bg-bg text-fg hover:bg-black/5",
                    ].join(" ")}
                    aria-label={`Selecionar ícone ${key}`}
                    title={key}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-fg">Cor</label>
            <div className="flex flex-wrap gap-3">
              {COLOR_OPTIONS.map((c) => {
                const selected = color === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColor(c.key)}
                    className={[
                      "h-8 w-12 rounded-xl border bg-bg p-1 transition",
                      "focus:outline-none focus:ring-4 focus:ring-emerald-500/15",
                      selected ? "border-emerald-600" : "border-border hover:bg-black/5",
                    ].join(" ")}
                    aria-label={`Selecionar cor ${c.key}`}
                    title={c.key}
                  >
                    <span className={["block h-full w-full rounded-lg", c.fillClass].join(" ")} />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={creating || updating}
            className="w-full rounded-xl bg-emerald-800 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-60"
            type="button"
          >
            {creating || updating ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}