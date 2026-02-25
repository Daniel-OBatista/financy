import { Outlet } from "react-router-dom";
import AppShell from "@/components/financy/AppShell";

export default function AppLayout(): JSX.Element {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}