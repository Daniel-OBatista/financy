import type { ReactNode } from "react";
import AppTopbar from "@/components/AppTopbar";
import AuthGate from "@/components/AuthGate";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-dvh bg-app-bg">
        <AppTopbar />
        <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
      </div>
    </AuthGate>
  );
}