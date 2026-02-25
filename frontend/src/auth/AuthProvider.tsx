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

type UpdateProfilePayload = {
  name: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

type StoredUser = {
  id: string; // ✅ UUID que será o "userId" do backend
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

function uuidV4(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint8Array(16);
    cryptoObj.getRandomValues(buf);

    // version 4
    buf[6] = (buf[6] & 0x0f) | 0x40;
    // variant 10
    buf[8] = (buf[8] & 0x3f) | 0x80;

    const hex = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // fallback (ainda gera formato UUID)
  const rnd = (): string => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${rnd()}${rnd()}-${rnd()}-4${rnd().slice(1)}-${((8 + Math.random() * 4) | 0).toString(16)}${rnd().slice(
    1
  )}-${rnd()}${rnd()}${rnd()}`;
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

function readSessionFromStorage(): { token: string | null; user: AuthUser | null } {
  const t = localStorage.getItem(AUTH_TOKEN_KEY);
  const e = localStorage.getItem(AUTH_EMAIL_KEY);
  const n = localStorage.getItem(AUTH_NAME_KEY);

  if (t && e) {
    return { token: t, user: { email: e, name: n ?? undefined } };
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const session = readSessionFromStorage();
    setToken(session.token);
    setUser(session.user);
  }, []);

  async function refreshUser(): Promise<void> {
    const session = readSessionFromStorage();
    setToken(session.token);
    setUser(session.user);
  }

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

    const userId = uuidV4();

    const newUser: StoredUser = {
      id: userId,
      email,
      password,
      name,
      createdAt: new Date().toISOString(),
    };

    saveUsers([newUser, ...users]);

    // ✅ token agora é o userId (UUID)
    localStorage.setItem(AUTH_TOKEN_KEY, userId);
    localStorage.setItem(AUTH_EMAIL_KEY, email);
    localStorage.setItem(AUTH_NAME_KEY, name);

    setToken(userId);
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

    // ✅ se for usuário antigo sem id, cria um agora e atualiza a base
    let userId = found.id;
    if (!userId) {
      userId = uuidV4();
      const idx = users.findIndex((u) => normalizeEmail(u.email) === email);
      if (idx >= 0) {
        const next = [...users];
        next[idx] = { ...next[idx], id: userId };
        saveUsers(next);
      }
    }

    localStorage.setItem(AUTH_TOKEN_KEY, userId);
    localStorage.setItem(AUTH_EMAIL_KEY, email);
    localStorage.setItem(AUTH_NAME_KEY, found.name);

    setToken(userId);
    setUser({ email, name: found.name });
  }

  async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
    const email = normalizeEmail(payload.email);
    const newPassword = payload.newPassword;

    if (!email.includes("@") || email.length < 5) throw new Error("Informe um e-mail válido.");
    if (newPassword.length < 8) throw new Error("A senha deve ter no mínimo 8 caracteres.");

    const users = loadUsers();
    const idx = users.findIndex((u) => normalizeEmail(u.email) === email);

    if (idx < 0) throw new Error("E-mail não encontrado.");

    const updated: StoredUser = { ...users[idx], password: newPassword };
    const next = [...users];
    next[idx] = updated;
    saveUsers(next);
  }

  async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
    const trimmed = payload.name.trim();
    if (trimmed.length < 2) throw new Error("Nome inválido.");

    const current = readSessionFromStorage();
    if (!current.user?.email) throw new Error("Não autenticado.");

    const email = normalizeEmail(current.user.email);

    // ✅ atualiza lista local
    const users = loadUsers();
    const idx = users.findIndex((u) => normalizeEmail(u.email) === email);
    if (idx >= 0) {
      const updated: StoredUser = { ...users[idx], name: trimmed };
      const next = [...users];
      next[idx] = updated;
      saveUsers(next);
    }

    // ✅ atualiza sessão
    localStorage.setItem(AUTH_NAME_KEY, trimmed);

    setUser({ email, name: trimmed });
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
      updateProfile,
      refreshUser,
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