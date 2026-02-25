import type { ReactElement, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthUser = {
  email: string;
  name?: string;
};

type SignInPayload = {
  email: string;
  password: string;
};

type SignUpPayload = {
  name: string;
  email: string;
  password: string;
};

type ResetPasswordPayload = {
  email: string;
  newPassword: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
  signOut: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

type StoredUser = {
  email: string;
  password: string; // ✅ local-dev somente
  name: string;
  createdAt: string;
};

const AUTH_TOKEN_KEY = "financy_token";
const AUTH_EMAIL_KEY = "financy_email";
const AUTH_NAME_KEY = "financy_name";
const AUTH_USERS_KEY = "financy_users";

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredUser[];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function createFakeToken(email: string): string {
  return `dev_${btoa(`${email}:${Date.now()}`)}`;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const t = localStorage.getItem(AUTH_TOKEN_KEY);
    const e = localStorage.getItem(AUTH_EMAIL_KEY);
    const n = localStorage.getItem(AUTH_NAME_KEY);

    if (t && e) {
      setToken(t);
      setUser({ email: e, name: n ?? undefined });
    }
  }, []);

  async function signUp(payload: SignUpPayload): Promise<void> {
    const name = payload.name.trim();
    const email = normalizeEmail(payload.email);
    const password = payload.password;

    if (name.length < 3) throw new Error("Informe seu nome completo.");
    if (!email.includes("@") || email.length < 5) throw new Error("Informe um e-mail válido.");
    if (password.length < 8) throw new Error("A senha deve ter no mínimo 8 caracteres.");

    const users = loadUsers();
    const alreadyExists = users.some((u) => normalizeEmail(u.email) === email);
    if (alreadyExists) throw new Error("Este e-mail já está cadastrado. Faça login.");

    const newUser: StoredUser = {
      email,
      password,
      name,
      createdAt: new Date().toISOString(),
    };

    saveUsers([newUser, ...users]);

    const fakeToken = createFakeToken(email);
    localStorage.setItem(AUTH_TOKEN_KEY, fakeToken);
    localStorage.setItem(AUTH_EMAIL_KEY, email);
    localStorage.setItem(AUTH_NAME_KEY, name);

    setToken(fakeToken);
    setUser({ email, name });
  }

  async function signIn(payload: SignInPayload): Promise<void> {
    const email = normalizeEmail(payload.email);
    const password = payload.password;

    if (!email.includes("@") || password.length < 3) {
      throw new Error("Informe e-mail e senha válidos.");
    }

    const users = loadUsers();
    const found = users.find((u) => normalizeEmail(u.email) === email);

    if (!found || found.password !== password) {
      throw new Error("E-mail ou senha inválidos.");
    }

    const fakeToken = createFakeToken(email);
    localStorage.setItem(AUTH_TOKEN_KEY, fakeToken);
    localStorage.setItem(AUTH_EMAIL_KEY, email);
    localStorage.setItem(AUTH_NAME_KEY, found.name);

    setToken(fakeToken);
    setUser({ email, name: found.name });
  }

  async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
    const email = normalizeEmail(payload.email);
    const newPassword = payload.newPassword;

    if (!email.includes("@") || email.length < 5) throw new Error("Informe um e-mail válido.");
    if (newPassword.length < 8) throw new Error("A senha deve ter no mínimo 8 caracteres.");

    const users = loadUsers();
    const idx = users.findIndex((u) => normalizeEmail(u.email) === email);

    if (idx < 0) {
      throw new Error("E-mail não encontrado.");
    }

    const updated: StoredUser = { ...users[idx], password: newPassword };
    const next = [...users];
    next[idx] = updated;
    saveUsers(next);
  }

  function signOut(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EMAIL_KEY);
    localStorage.removeItem(AUTH_NAME_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      token,
      isAuthenticated: Boolean(token),
      signIn,
      signUp,
      resetPassword,
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