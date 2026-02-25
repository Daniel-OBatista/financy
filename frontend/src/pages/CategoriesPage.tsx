import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
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

export default function CategoriesPage(): ReactElement {
  const { data, loading, error } = useQuery<GetCategoriesData>(GET_CATEGORIES);

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

  const [q, setQ] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [edit, setEdit] = useState<Category | null>(null);

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [icon, setIcon] = useState<string>("wallet");
  const [color, setColor] = useState<string>("green");

  const list = useMemo(() => {
    const all = data?.categories ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter((c) => c.title.toLowerCase().includes(s));
  }, [data?.categories, q]);

  function resetForm(): void {
    setTitle("");
    setDescription("");
    setIcon("wallet");
    setColor("green");
    setEdit(null);
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

    setOpen(false);
    resetForm();
  }

  async function onDelete(id: string): Promise<void> {
    const ok = window.confirm("Excluir categoria?");
    if (!ok) return;
    await deleteCategory({ variables: { id } });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-tight">Categorias</h2>
          <p className="text-sm text-muted">Gerencie suas categorias.</p>
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

      {loading && (
        <div className="rounded-3xl border border-border/25 bg-card/30 p-4 text-sm text-muted">
          Carregando...
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          Erro: {error.message}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <div
            key={c.id}
            className="rounded-3xl border border-border/25 bg-card/35 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_25px_60px_rgba(0,0,0,0.25)] backdrop-blur"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-fg truncate">{c.title}</p>
                <p className="mt-1 text-xs text-muted truncate">{c.description ?? "Sem descrição"}</p>
              </div>

              <span className="shrink-0 rounded-2xl border border-border/25 bg-card/40 px-2.5 py-1 text-[11px] font-semibold text-muted">
                {c.icon} • {c.color}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => openEdit(c)}
                className="flex-1 rounded-2xl border border-border/25 bg-card/40 px-3 py-2 text-xs font-semibold text-fg transition hover:bg-card/60"
                type="button"
              >
                Editar
              </button>

              <button
                onClick={() => onDelete(c.id)}
                disabled={deleting}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-60"
                type="button"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}

        {list.length === 0 && !loading ? (
          <div className="rounded-3xl border border-border/25 bg-card/30 p-6 text-sm text-muted sm:col-span-2 lg:col-span-3">
            Nenhuma categoria encontrada.
          </div>
        ) : null}
      </div>

      <Modal
        open={open}
        title={edit ? "Editar categoria" : "Nova categoria"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted">Ícone</label>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                placeholder="wallet, home, car..."
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted">Cor</label>
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                placeholder="green, blue, yellow..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted">Descrição</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-border/25 bg-card/40 px-4 py-2.5 text-sm text-fg outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                placeholder="opcional"
              />
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