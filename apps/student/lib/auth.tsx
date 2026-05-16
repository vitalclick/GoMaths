/**
 * Auth client for the Student app.
 *
 * Stores tokens via the secure-storage wrapper. Exposes a small auth
 * context + hook so screens read the current session without prop drilling.
 * Refreshes the access token transparently on 401s in `authFetch`.
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

const ACCESS_KEY = "gomaths.access";
const REFRESH_KEY = "gomaths.refresh";
const USER_KEY = "gomaths.user";

export interface PublicUser {
  id: string;
  email: string;
  role: string;
  displayName: string;
  grade?: number;
  language?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: PublicUser;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  grade: number;
  birthYear: number;
  parentalConsentToken?: string;
}

export interface ParentalConsentRequestResult {
  id: string;
  inviteUrl: string;
  expiresAt: string;
}

export interface ParentalConsentPollResult {
  status: "PENDING" | "CONFIRMED" | "CONSUMED" | "EXPIRED";
  receiptToken?: string;
  expiresAt?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  requestParentalConsent: (
    parentEmail: string,
    studentEmail: string,
  ) => Promise<ParentalConsentRequestResult>;
  pollParentalConsent: (id: string, studentEmail: string) => Promise<ParentalConsentPollResult>;
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

  const persistSession = useCallback(async (session: AuthSession) => {
    await Promise.all([
      storage.setItem(ACCESS_KEY, session.accessToken),
      storage.setItem(REFRESH_KEY, session.refreshToken),
      storage.setItem(USER_KEY, JSON.stringify(session.user)),
    ]);
    setUser(session.user);

    // Best-effort push registration. Skipped on simulator / web; never blocks
    // sign-in.
    void import("./push").then(({ registerForPush }) => registerForPush());
  }, []);

  const register = useCallback(
    async (input: RegisterInput) => {
      if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not set");
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await readError(res));
      const session = (await res.json()) as AuthSession;
      await persistSession(session);
    },
    [persistSession],
  );

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
      await persistSession(session);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    await Promise.all([
      storage.removeItem(ACCESS_KEY),
      storage.removeItem(REFRESH_KEY),
      storage.removeItem(USER_KEY),
    ]);
    setUser(null);
  }, []);

  const requestParentalConsent = useCallback(
    async (parentEmail: string, studentEmail: string): Promise<ParentalConsentRequestResult> => {
      if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not set");
      const res = await fetch(`${apiUrl}/api/auth/parental-consent/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parentEmail, studentEmail }),
      });
      if (!res.ok) throw new Error(await readError(res));
      return (await res.json()) as ParentalConsentRequestResult;
    },
    [],
  );

  const pollParentalConsent = useCallback(
    async (id: string, studentEmail: string): Promise<ParentalConsentPollResult> => {
      if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not set");
      const res = await fetch(`${apiUrl}/api/auth/parental-consent/poll`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, studentEmail }),
      });
      if (!res.ok) throw new Error(await readError(res));
      return (await res.json()) as ParentalConsentPollResult;
    },
    [],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      register,
      login,
      logout,
      requestParentalConsent,
      pollParentalConsent,
    }),
    [user, loading, register, login, logout, requestParentalConsent, pollParentalConsent],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/**
 * Authenticated fetch. Attaches the current access token and transparently
 * refreshes on a single 401.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not set");

  const accessToken = await storage.getItem(ACCESS_KEY);
  const headers = new Headers(init.headers ?? {});
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  let res = await fetch(`${apiUrl}${input}`, { ...init, headers });
  if (res.status !== 401) return res;

  // Try to refresh once.
  const refreshed = await tryRefresh();
  if (!refreshed) return res;

  headers.set("authorization", `Bearer ${refreshed}`);
  res = await fetch(`${apiUrl}${input}`, { ...init, headers });
  return res;
}

async function tryRefresh(): Promise<string | null> {
  if (!apiUrl) return null;
  const refreshToken = await storage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  const res = await fetch(`${apiUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  const session = (await res.json()) as AuthSession;
  await Promise.all([
    storage.setItem(ACCESS_KEY, session.accessToken),
    storage.setItem(REFRESH_KEY, session.refreshToken),
    storage.setItem(USER_KEY, JSON.stringify(session.user)),
  ]);
  return session.accessToken;
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
