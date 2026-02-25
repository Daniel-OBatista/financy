import { useEffect } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  title: string;
  subtitle?: string; // ✅ novo
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ open, title, subtitle, onClose, children }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[448px] overflow-hidden rounded-2xl border border-border bg-card text-fg shadow-2xl">
        {/* ✅ Header sem “buraco” */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-fg">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
            ) : null}
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Fechar"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-bg text-muted transition hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ✅ Conteúdo sobe (sem pt extra) */}
        <div className="px-6 pb-6 pt-4">{children}</div>
      </div>
    </div>
  );
}