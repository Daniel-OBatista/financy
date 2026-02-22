"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/services/supabase";

type Props = {
  children: ReactNode;
};

const AUTH_ROUTES: string[] = ["/login", "/criar-conta"];

export default function AuthGate({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    async function check(): Promise<void> {
      const { data } = await supabase.auth.getSession();
      const hasSession = Boolean(data.session);

      const isAuthRoute = AUTH_ROUTES.includes(pathname);

      // se está logado e está em /login ou /criar-conta -> manda pro dashboard
      if (hasSession && isAuthRoute) {
        router.replace("/dashboard");
        return;
      }

      // se NÃO está logado e tentou rota do app -> manda pro login
      if (!hasSession && !isAuthRoute) {
        router.replace("/login");
        return;
      }

      if (mounted) setReady(true);
    }

    void check();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void check();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-dvh bg-app-bg grid place-items-center">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm text-gray-600 shadow-sm">
          Carregando...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}