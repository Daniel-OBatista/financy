import { Outlet } from "react-router-dom";
import AuthShell from "@/components/financy/AuthShell";

export default function AuthLayout(): JSX.Element {
  return (
    <AuthShell>
      <Outlet />
    </AuthShell>
  );
}