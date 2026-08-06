/**
 * Auth client for the Student app.
 *
 * Stores tokens via the secure-storage wrapper. Exposes a small auth
 * context + hook so screens read the current session without prop drilling.
 * Refreshes the access token transparently on 401s in `authFetch`.
 *
 * Access tokens live 15 minutes, so anything that talks to the API must go
 * through `authFetch` (or `getValidAccessToken` when it needs the raw token,
 * e.g. SSE). Reading the stored token directly means the request starts
 * failing with "Invalid or expired token" a quarter of an hour after sign-in.
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
import { signInWithProvider, type SocialProvider } from "./social-auth";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

const ACCESS_KEY = "gomaths.access";
const REFRESH_KEY = "gomaths.refresh";
const USER_KEY = "gomaths.user";
/** ISO expiry of the stored access token, so we can refresh before using it. */
const EXPIRES_KEY = "gomaths.access.expires";

/** Refresh this far ahead of the printed expiry to absorb clock skew. */
const REFRESH_SKEW_MS = 60_000;

/** Requests that get no response by then are reported as a timeout. */
const DEFAULT_TIMEOUT_MS = 30_000;

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

/**
 * Outcome of a social sign-in. A returning learner is straight in;
 * a new one still owes us a grade and birth year (and, if they're under
 * 18, parental consent), so the backend hands back a short-lived
 * `signupToken` for the /complete-profile screen to redeem.
 */
export type SocialSignInResult =
  | { status: "authenticated" }
  | {
      status: "profile_required";
      signupToken: string;
      email?: string;
      displayName?: string;
      expiresAt: string;
    };

export interface CompleteSocialSignupInput {
  signupToken: string;
  grade: number;
  birthYear: number;
  displayName?: string;
  email?: string;
  parentalConsentToken?: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  grade?: number;
}

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  signInWithSocial: (provider: SocialProvider) => Promise<SocialSignInResult>;
  completeSocialSignup: (input: CompleteSocialSignupInput) => Promise<void>;
  logout: () => Promise<void>;
  requestParentalConsent: (
    parentEmail: string,
    studentEmail: string,
  ) => Promise<ParentalConsentRequestResult>;
  pollParentalConsent: (id: string, studentEmail: string) => Promise<ParentalConsentPollResult>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
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

  const persistSession = useCallback(async (session: AuthSession) => {
    await storeSession(session);
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

  const signInWithSocial = useCallback(
    async (provider: SocialProvider): Promise<SocialSignInResult> => {
      if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not set");

      // Runs the native provider sheet. Throws SocialAuthCancelled if the
      // learner backs out — callers treat that as a no-op, not an error.
      const credential = await signInWithProvider(provider);

      const res = await fetch(`${apiUrl}/api/auth/oauth`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: credential.provider,
          idToken: credential.idToken,
          nonce: credential.nonce,
          displayName: credential.displayName,
        }),
      });
      if (!res.ok) throw new Error(await readError(res));

      const body = (await res.json()) as
        | { status: "authenticated"; session: AuthSession }
        | {
            status: "profile_required";
            signupToken: string;
            email?: string;
            displayName?: string;
            expiresAt: string;
          };

      if (body.status === "profile_required") return body;

      await persistSession(body.session);
      return { status: "authenticated" };
    },
    [persistSession],
  );

  const completeSocialSignup = useCallback(
    async (input: CompleteSocialSignupInput) => {
      if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not set");
      const res = await fetch(`${apiUrl}/api/auth/oauth/complete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await readError(res));
      const body = (await res.json()) as { status: "authenticated"; session: AuthSession };
      await persistSession(body.session);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    await clearStoredSession();
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

  const updateProfile = useCallback(async (input: UpdateProfileInput): Promise<void> => {
    const res = await authFetch("/api/users/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await readError(res));
    const updated = (await res.json()) as PublicUser;
    await storage.setItem(USER_KEY, JSON.stringify(updated));
    setUser(updated);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      register,
      login,
      signInWithSocial,
      completeSocialSignup,
      logout,
      requestParentalConsent,
      pollParentalConsent,
      updateProfile,
    }),
    [
      user,
      loading,
      register,
      login,
      signInWithSocial,
      completeSocialSignup,
      logout,
      requestParentalConsent,
      pollParentalConsent,
      updateProfile,
    ],
  );

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
 * `TypeError: Network request failed`, which is meaningless to a learner on
 * a patchy mobile connection, so screens get this instead.
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export interface AuthFetchInit extends RequestInit {
  /**
   * Give up after this many ms. Defaults to 30s; the scan upload passes a
   * longer one because OCR + solve runs before the API answers.
   */
  timeoutMs?: number;
}

/**
 * Authenticated fetch. Refreshes the access token when the stored one is
 * expired (or about to be), retries once on a 401, and clears the session
 * when the refresh token itself is rejected.
 */
export async function authFetch(input: string, init: AuthFetchInit = {}): Promise<Response> {
  if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not set");

  const headers = new Headers(init.headers ?? {});
  const accessToken = await getValidAccessToken();
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  let res = await fetchWithTimeout(`${apiUrl}${input}`, { ...init, headers });
  if (res.status !== 401) return res;

  // The token was accepted by our own expiry check but rejected by the API
  // (clock skew, a secret rotation, a token minted before a redeploy).
  // Refresh once and replay.
  const refreshed = await tryRefresh();
  if (refreshed.status !== "ok") {
    if (refreshed.status === "rejected") await expireSession();
    return res;
  }

  headers.set("authorization", `Bearer ${refreshed.accessToken}`);
  res = await fetchWithTimeout(`${apiUrl}${input}`, { ...init, headers });
  // A fresh token that still 401s means this session is done.
  if (res.status === 401) await expireSession();
  return res;
}

/**
 * The current access token, refreshed first when it has expired or is within
 * `REFRESH_SKEW_MS` of expiring. Use this for the few call sites that can't
 * go through `authFetch` (the SSE tutor stream sets its own headers).
 */
export async function getValidAccessToken(): Promise<string | null> {
  const [accessToken, expiresAt] = await Promise.all([
    storage.getItem(ACCESS_KEY),
    storage.getItem(EXPIRES_KEY),
  ]);
  if (!accessToken) return null;

  // Sessions stored by an older build have no expiry recorded — fall back to
  // the reactive 401-then-refresh path rather than refreshing on every call.
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
  // Refresh endpoint unreachable — send the stale token and let the API
  // decide, so a flaky network doesn't look like a sign-out.
  return accessToken;
}

type RefreshOutcome =
  | { status: "ok"; accessToken: string }
  /** The API said no: the refresh token is expired, rotated, or revoked. */
  | { status: "rejected" }
  /** Couldn't ask (offline, 5xx). The session may well still be valid. */
  | { status: "unavailable" };

/**
 * The refresh currently in flight, if any.
 *
 * Refresh tokens rotate, and the API treats a second use of an already-spent
 * token as theft: it revokes every session the learner has. Two screens
 * refreshing at once (the home tab loads progress and gamification in
 * parallel) would do exactly that, so concurrent callers share one request.
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
    // having a bad day and must not sign the learner out.
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

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(", ");
    return body.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}
