import type { ReactElement, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthUser = {
  email: string;
};

type SignInPayload = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AUTH_TOKEN_KEY = "financy_token";
const AUTH_EMAIL_KEY = "financy_email";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const t = localStorage.getItem(AUTH_TOKEN_KEY);
    const e = localStorage.getItem(AUTH_EMAIL_KEY);

    if (t && e) {
      setToken(t);
      setUser({ email: e });
    }
  }, []);

  async function signIn(payload: SignInPayload): Promise<void> {
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;

    if (email.length < 5 || password.length < 3) {
      throw new Error("Informe e-mail e senha válidos.");
    }

    const fakeToken = `dev_${btoa(`${email}:${Date.now()}`)}`;

    localStorage.setItem(AUTH_TOKEN_KEY, fakeToken);
    localStorage.setItem(AUTH_EMAIL_KEY, email);

    setToken(fakeToken);
    setUser({ email });
  }

  function signOut(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EMAIL_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      token,
      isAuthenticated: Boolean(token),
      signIn,
      signOut,
    };
  }, [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}