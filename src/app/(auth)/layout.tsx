import type { ReactNode } from "react";
import FinancyLogo from "@/components/FinancyLogo";
import AuthGate from "@/components/AuthGate";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <main className="min-h-dvh bg-app-bg">
        <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-4 py-10">
          <div className="mb-6 flex items-center justify-center">
            <FinancyLogo />
          </div>

          {children}
        </div>
      </main>
    </AuthGate>
  );
}