/**
 * Teacher-app auth.
 *
 * Same backend, same JWT shape as the rest of the apps; storage keys
 * are scoped to `gomaths.teacher.*` so a device shared between a
 * teacher and a parent / student doesn't cross-pollute sessions.
 *
 * Phase 1 work this skeleton makes ready for:
 *  - Roster fetch (GET /api/teachers/me/classes — not yet built)
 *  - Per-class progress (GET /api/teachers/classes/:id/progress)
 *  - Assignment CRUD
 *
 * The skeleton ships login + sign-out only; the rest lands as the
 * curriculum / progress modules expose teacher-scoped endpoints.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as storage from "./secure-storage";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

const ACCESS_KEY = "gomaths.teacher.access";
const REFRESH_KEY = "gomaths.teacher.refresh";
const USER_KEY = "gomaths.teacher.user";

export interface PublicUser {
  id: string;
  email: string;
  role: string;
  displayName: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: PublicUser;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.getItem(USER_KEY);
        if (stored) setUser(JSON.parse(stored) as PublicUser);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (session: AuthSession) => {
    await Promise.all([
      storage.setItem(ACCESS_KEY, session.accessToken),
      storage.setItem(REFRESH_KEY, session.refreshToken),
      storage.setItem(USER_KEY, JSON.stringify(session.user)),
    ]);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not set");
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await readError(res));
      const session = (await res.json()) as AuthSession;
      await persist(session);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    await Promise.all([
      storage.removeItem(ACCESS_KEY),
      storage.removeItem(REFRESH_KEY),
      storage.removeItem(USER_KEY),
    ]);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(", ");
    return body.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}
