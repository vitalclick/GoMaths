/**
 * App-wide preferences. Stored in SecureStore (web: localStorage).
 *
 * Keep this small — it's not a settings system, just a few flags the
 * app needs to look up frequently.
 */

import { useEffect, useState } from "react";
import * as storage from "./secure-storage";

const DEBUG_KEY = "gomaths.debug";

let cachedDebug: boolean | null = null;
const subscribers = new Set<() => void>();

async function load(): Promise<boolean> {
  if (cachedDebug !== null) return cachedDebug;
  const raw = await storage.getItem(DEBUG_KEY);
  cachedDebug = raw === "1";
  return cachedDebug;
}

export async function isDebugEnabled(): Promise<boolean> {
  return load();
}

export async function setDebugEnabled(value: boolean): Promise<void> {
  cachedDebug = value;
  await storage.setItem(DEBUG_KEY, value ? "1" : "0");
  for (const fn of subscribers) fn();
}

/** React hook — re-renders when the flag changes via setDebugEnabled. */
export function useDebugEnabled(): boolean {
  const [enabled, setEnabled] = useState(cachedDebug ?? false);
  useEffect(() => {
    let mounted = true;
    load().then((v) => mounted && setEnabled(v));
    const fn = () => setEnabled(cachedDebug ?? false);
    subscribers.add(fn);
    return () => {
      mounted = false;
      subscribers.delete(fn);
    };
  }, []);
  return enabled;
}
