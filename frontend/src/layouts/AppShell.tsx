import type { ReactElement } from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "../components/AppHeader";

export default function AppShell(): ReactElement {
  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}