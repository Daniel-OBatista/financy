import type { ReactElement } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import TransactionsPage from "./pages/TransactionsPage";
import LoginPage from "./pages/LoginPage";
import CriarContaPage from "./pages/CriarContaPage";
import RecuperarSenhaPage from "./pages/RecuperarSenhaPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./auth/AuthProvider";
import AppHeader from "./components/AppHeader";

export default function App(): ReactElement {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isAuthRoute =
    location.pathname === "/login" ||
    location.pathname === "/criar-conta" ||
    location.pathname === "/recuperar-senha";

  // ✅ AuthLayout (sem header)
  if (isAuthRoute) {
    return (
      <main className="min-h-dvh bg-app-bg">
        <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-10">
          <div className="flex items-center justify-center">
            <img
              src="/financy.png"
              alt="Financy"
              width={134}
              height={32}
              draggable={false}
              className="h-8 w-[134px] select-none object-contain"
            />
          </div>

          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />

            <Route
              path="/criar-conta"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <CriarContaPage />}
            />

            <Route
              path="/recuperar-senha"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <RecuperarSenhaPage />
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </main>
    );
  }

  // ✅ App normal (header global + páginas)
  return (
    <div className="min-h-dvh bg-bg text-fg font-sans antialiased">
      <AppHeader />

      <div className="mx-auto w-full max-w-[1280px] px-12 pb-10 pt-6">
        <main>
          <Routes>
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

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

            {/* ✅ NOVA ROTA */}
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <ProfilePage />
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