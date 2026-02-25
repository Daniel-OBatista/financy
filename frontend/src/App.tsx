import type { ReactElement } from "react";
import { Route, Routes, Navigate, NavLink } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import TransactionsPage from "./pages/TransactionsPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./auth/AuthProvider";

function NavItem({
  to,
  label,
}: {
  to: string;
  label: string;
}): ReactElement {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "rounded-2xl border px-4 py-2 text-sm font-semibold transition",
          "focus:outline-none focus:ring-4 focus:ring-primary/15",
          isActive
            ? "border-primary/35 bg-primary/10 text-fg"
            : "border-border/25 bg-card/40 text-muted hover:bg-card/60 hover:text-fg",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

function Header(): ReactElement | null {
  const { isAuthenticated, user, signOut } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-6 border-b border-border/20 bg-bg/70 px-4 py-4 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <img
              src="/financy.png"
              alt="Financy"
              className="h-10 w-10 rounded-2xl border border-border/30 bg-card/60 object-contain p-2"
            />

            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Financy
              </h1>
              <p className="text-xs text-muted sm:text-sm">
                Prisma + SQLite no backend • Apollo no front
              </p>
            </div>
          </div>

          <div className="sm:ml-auto flex flex-wrap items-center gap-2">
            {user?.email ? (
              <span className="mr-1 inline-flex items-center rounded-2xl border border-border/25 bg-card/40 px-3 py-2 text-xs font-semibold text-muted">
                {user.email}
              </span>
            ) : null}

            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/transactions" label="Transações" />
            <NavItem to="/categories" label="Categorias" />

            <button
              onClick={signOut}
              type="button"
              className="rounded-2xl border border-border/25 bg-card/40 px-4 py-2 text-sm font-semibold text-muted transition hover:bg-card/60 hover:text-fg focus:outline-none focus:ring-4 focus:ring-primary/15"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App(): ReactElement {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-dvh bg-bg text-fg font-sans antialiased">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10">
        <Header />

        <main>
          <Routes>
            <Route
              path="/"
              element={
                <Navigate
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  replace
                />
              }
            />

            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}