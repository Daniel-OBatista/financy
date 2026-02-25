"use client";

import { NavLink } from "react-router-dom";
import { cn } from "@/components/financy/cn";

type NavItem = {
  href: string;
  label: string;
};

type TopNavProps = {
  userInitials?: string;
  items?: NavItem[];
};

const DEFAULT_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transacoes", label: "Transações" },
  { href: "/categorias", label: "Categorias" },
];

export default function TopNav({
  userInitials = "CT",
  items = DEFAULT_ITEMS,
}: TopNavProps): JSX.Element {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-financy-border bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 ring-1 ring-emerald-200">
            <span className="text-sm font-extrabold text-emerald-700">F</span>
          </div>
          <span className="text-sm font-extrabold tracking-tight text-emerald-800">
            FINANCY
          </span>
        </NavLink>

        <nav className="mx-auto hidden items-center gap-6 md:flex">
          {items.map((it) => (
            <NavLink
              key={it.href}
              to={it.href}
              className={({ isActive }) =>
                cn(
                  "text-sm font-semibold transition",
                  isActive
                    ? "text-emerald-800"
                    : "text-slate-500 hover:text-slate-800"
                )
              }
              end
            >
              {it.label}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to="/conta"
          className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600 ring-1 ring-financy-border transition hover:bg-slate-200"
          aria-label="Conta"
          title="Conta"
        >
          {userInitials}
        </NavLink>
      </div>

      <div className="border-t border-financy-border bg-white md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-4 py-2">
          {items.map((it) => (
            <NavLink
              key={it.href}
              to={it.href}
              className={({ isActive }) =>
                cn(
                  "rounded-xl px-3 py-2 text-xs font-semibold transition",
                  isActive
                    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )
              }
              end
            >
              {it.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}