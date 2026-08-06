/**
 * Teacher-app auth.
 *
 * Same backend, same JWT shape as the rest of the apps; storage keys
 * are scoped to `gomaths.teacher.*` so a device shared between a
 * teacher and a parent / student doesn't cross-pollute sessions.
 *
 * Access tokens live 15 minutes, so anything that talks to the API must go
 * through `authFetch`. Reading the stored token directly means the request
 * starts failing with "Invalid or expired token" a quarter of an hour after
 * sign-in — see apps/student/lib/auth.tsx, which this mirrors.
 *
 * Phase 1 work this skeleton makes ready for:
 *  - Roster fetch (GET /api/teachers/me/classes — not yet built)
 *  - Per-class progress (GET /api/teachers/classes/:id/progress)
 *  - Assignment CRUD
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
/** ISO expiry of the stored access token, so we can refresh before using it. */
const EXPIRES_KEY = "gomaths.teacher.access.expires";

/** Refresh this far ahead of the printed expiry to absorb clock skew. */
const REFRESH_SKEW_MS = 60_000;

/** Requests that get no response by then are reported as a timeout. */
const DEFAULT_TIMEOUT_MS = 30_000;

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

  // The refresh token can be rejected mid-session (expired, rotated away,
  // revoked). `authFetch` clears storage when that happens; without this the
  // UI would keep rendering a signed-in shell whose every request 401s.
  useEffect(() => onSessionExpired(() => setUser(null)), []);

  const persist = useCallback(async (session: AuthSession) => {
    await storeSession(session);
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
    await clearStoredSession();
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

/**
 * A request that never reached the API — no connection, DNS failure, TLS
 * error, or a timeout. React Native surfaces all of these as a bare
 * `TypeError: Network request failed`, which is meaningless to a teacher on
 * a patchy mobile connection, so screens get this instead.
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export interface AuthFetchInit extends RequestInit {
  /** Give up after this many ms. Defaults to 30s. */
  timeoutMs?: number;
}

/**
 * Authenticated fetch for the teacher app. Refreshes the access token when
 * the stored one is expired (or about to be), retries once on a 401, and
 * clears the session when the refresh token itself is rejected.
 */
export async function authFetch(path: string, init: AuthFetchInit = {}): Promise<Response> {
  if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not set");

  const headers = new Headers(init.headers ?? {});
  const accessToken = await getValidAccessToken();
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  let res = await fetchWithTimeout(`${apiUrl}${path}`, { ...init, headers });
  if (res.status !== 401) return res;

  const refreshed = await tryRefresh();
  if (refreshed.status !== "ok") {
    if (refreshed.status === "rejected") await expireSession();
    return res;
  }

  headers.set("authorization", `Bearer ${refreshed.accessToken}`);
  res = await fetchWithTimeout(`${apiUrl}${path}`, { ...init, headers });
  if (res.status === 401) await expireSession();
  return res;
}

/**
 * The current access token, refreshed first when it has expired or is within
 * `REFRESH_SKEW_MS` of expiring.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const [accessToken, expiresAt] = await Promise.all([
    storage.getItem(ACCESS_KEY),
    storage.getItem(EXPIRES_KEY),
  ]);
  if (!accessToken) return null;

  if (!expiresAt) return accessToken;

  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs) || expiresAtMs - Date.now() > REFRESH_SKEW_MS) {
    return accessToken;
  }

  const refreshed = await tryRefresh();
  if (refreshed.status === "ok") return refreshed.accessToken;
  if (refreshed.status === "rejected") {
    await expireSession();
    return null;
  }
  return accessToken;
}

type RefreshOutcome =
  | { status: "ok"; accessToken: string }
  /** The API said no: the refresh token is expired, rotated, or revoked. */
  | { status: "rejected" }
  /** Couldn't ask (offline, 5xx). The session may well still be valid. */
  | { status: "unavailable" };

/**
 * The refresh currently in flight, if any. Refresh tokens rotate, and the
 * API treats a second use of an already-spent token as theft: it revokes
 * every session the teacher has. Concurrent callers share one request.
 */
let inFlightRefresh: Promise<RefreshOutcome> | null = null;

function tryRefresh(): Promise<RefreshOutcome> {
  if (!inFlightRefresh) {
    inFlightRefresh = requestRefresh().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

async function requestRefresh(): Promise<RefreshOutcome> {
  if (!apiUrl) return { status: "unavailable" };
  const refreshToken = await storage.getItem(REFRESH_KEY);
  if (!refreshToken) return { status: "rejected" };

  let res: Response;
  try {
    res = await fetchWithTimeout(`${apiUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return { status: "unavailable" };
  }

  if (!res.ok) {
    // Only a 4xx is the server rejecting the token; a 5xx is the server
    // having a bad day and must not sign the teacher out.
    return res.status >= 400 && res.status < 500
      ? { status: "rejected" }
      : { status: "unavailable" };
  }

  const session = (await res.json()) as AuthSession;
  await storeSession(session);
  return { status: "ok", accessToken: session.accessToken };
}

async function fetchWithTimeout(url: string, init: AuthFetchInit): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new NetworkError("That took too long. Check your connection and try again.");
    }
    throw new NetworkError("Couldn't reach GoMaths. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
}

async function storeSession(session: AuthSession): Promise<void> {
  await Promise.all([
    storage.setItem(ACCESS_KEY, session.accessToken),
    storage.setItem(REFRESH_KEY, session.refreshToken),
    storage.setItem(USER_KEY, JSON.stringify(session.user)),
    storage.setItem(EXPIRES_KEY, session.expiresAt),
  ]);
}

async function clearStoredSession(): Promise<void> {
  await Promise.all([
    storage.removeItem(ACCESS_KEY),
    storage.removeItem(REFRESH_KEY),
    storage.removeItem(USER_KEY),
    storage.removeItem(EXPIRES_KEY),
  ]);
}

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/** Subscribe to "this session is no longer usable". Returns an unsubscribe. */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

/** Drop the stored session and tell the UI, so screens fall back to sign-in. */
async function expireSession(): Promise<void> {
  await clearStoredSession();
  for (const listener of sessionExpiredListeners) listener();
}

export interface TeacherClass {
  id: string;
  name: string;
  grade: number;
  studentCount: number;
}

export interface RosterStudent {
  id: string;
  displayName: string;
  grade: number;
  enrolledAt: string;
}

export async function fetchClasses(): Promise<TeacherClass[]> {
  const res = await authFetch("/api/teachers/me/classes");
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as TeacherClass[];
}

export async function fetchRoster(classId: string): Promise<RosterStudent[]> {
  const res = await authFetch(`/api/teachers/me/classes/${encodeURIComponent(classId)}/roster`);
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as RosterStudent[];
}

export interface ClassProgressEntry {
  studentId: string;
  displayName: string;
  grade: number;
  topicsAttempted: number;
  averageMastery: number;
}

export async function fetchClassProgress(classId: string): Promise<ClassProgressEntry[]> {
  const res = await authFetch(`/api/teachers/me/classes/${encodeURIComponent(classId)}/progress`);
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as ClassProgressEntry[];
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
