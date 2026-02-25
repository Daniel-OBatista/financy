import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

export default function AuthShell({ children }: AuthShellProps): JSX.Element {
  return (
    <main className="min-h-dvh bg-financy-bg px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 ring-1 ring-emerald-200">
            <span className="text-sm font-extrabold text-emerald-700">F</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-emerald-800">
            FINANCY
          </span>
        </div>

        <div className="financy-card w-full p-6 sm:p-7">{children}</div>
      </div>
    </main>
  );
}