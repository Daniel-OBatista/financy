"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FinancyLogo from "@/components/FinancyLogo";

type NavItem = {
  href: string;
  label: string;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transacoes", label: "Transações" },
  { href: "/categorias", label: "Categorias" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href;
}

export default function AppTopbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <FinancyLogo />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "text-sm transition",
                  active
                    ? "font-semibold text-brand-base"
                    : "text-gray-600 hover:text-gray-900",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/perfil"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700"
          aria-label="Perfil"
          title="Perfil"
        >
          CT
        </Link>
      </div>
    </header>
  );
}