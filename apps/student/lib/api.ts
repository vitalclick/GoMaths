/**
 * Singleton typed backend client.
 *
 * Wraps `@gomaths/api-client.createClient` with the app's auth token
 * getter so every screen just imports `api` and calls
 * `api.GET("/api/...")`. 401-then-refresh logic stays in `lib/auth`'s
 * `authFetch` for now — Phase 1 should fold it into this client's
 * `onResponse` middleware once we've stress-tested cancellation.
 */

import { createClient, type GoMathsClient } from "@gomaths/api-client";
import * as storage from "./secure-storage";

const ACCESS_KEY = "gomaths.access";

let cached: GoMathsClient | null = null;

export function getClient(): GoMathsClient | null {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) return null;
  if (cached) return cached;
  cached = createClient({
    baseUrl: apiUrl,
    getAccessToken: () => storage.getItem(ACCESS_KEY),
  });
  return cached;
}
