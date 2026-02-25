import type { ReactNode } from "react";
import TopNav from "@/components/financy/TopNav";

type AppShellProps = {
  children: ReactNode;
  userInitials?: string;
};

export default function AppShell({
  children,
  userInitials,
}: AppShellProps): JSX.Element {
  return (
    <div className="min-h-dvh bg-financy-bg">
      <TopNav userInitials={userInitials} />
      <div className="financy-page">{children}</div>
    </div>
  );
}