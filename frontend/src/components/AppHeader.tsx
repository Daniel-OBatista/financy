import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

type NavItem = {
  to: string;
  label: string;
};

type AppHeaderProps = {
  items?: NavItem[];
};

function getEmail(user: unknown): string | null {
  if (!user || typeof user !== "object") return null;
  const rec = user as Record<string, unknown>;
  const email = rec.email;
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function initialsFromEmail(email: string | null): string {
  if (!email) return "CT";
  const left = email.split("@")[0] ?? "";
  const parts = left
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const a = parts[0]?.[0] ?? "C";
  const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "T";
  return `${a}${b}`.toUpperCase();
}

function NavItemLink({ to, label }: NavItem): ReactElement {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "relative h-5 text-[13px] leading-5 transition",
          "text-slate-500 hover:text-slate-900",
          isActive ? "font-semibold text-emerald-700" : "font-medium",
          isActive
            ? "after:absolute after:-bottom-3 after:left-1/2 after:h-[2px] after:w-7 after:-translate-x-1/2 after:rounded-full after:bg-emerald-600"
            : "",
          "focus:outline-none focus:ring-4 focus:ring-emerald-500/15 rounded",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function AppHeader({ items }: AppHeaderProps): ReactElement | null {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  const email = useMemo(() => getEmail(user), [user]);
  const initials = useMemo(() => initialsFromEmail(email), [email]);

  const navItems = useMemo<NavItem[]>(
    () =>
      items ?? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/transactions", label: "Transações" },
        { to: "/categories", label: "Categorias" },
      ],
    [items]
  );

  const [open, setOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent): void {
      const el = menuRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }

    function onEsc(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  if (!isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-30 h-[69px] w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center px-12">
        <div className="grid h-9 w-full grid-cols-[100px_1fr_36px] items-center">
          <Link to="/dashboard" className="flex h-6 w-[100px] items-center" aria-label="Financy">
            <img
              src="/financy.png"
              alt="Financy"
              className="h-6 w-[100px] select-none object-contain"
              draggable={false}
            />
          </Link>

          <nav className="mx-auto flex h-5 w-[263px] items-center justify-center gap-6">
            {navItems.map((it) => (
              <NavItemLink key={it.to} to={it.to} label={it.label} />
            ))}
          </nav>

          <div className="flex items-center justify-end">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-300 text-[12px] font-extrabold text-gray-800"
                aria-haspopup="menu"
                aria-expanded={open}
                title={email ?? "Conta"}
              >
                {initials}
              </button>

              {open ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
                >
                  <div className="px-4 py-3">
                    <p className="text-xs font-semibold text-slate-500">Conta</p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                      {email ?? "—"}
                    </p>
                  </div>

                  <div className="border-t border-slate-100" />

                  {/* ✅ PERFIL */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate("/perfil");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    role="menuitem"
                  >
                    <User className="h-4 w-4" />
                    Perfil
                  </button>

                  <div className="border-t border-slate-100" />

                  {/* ✅ SAIR */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}