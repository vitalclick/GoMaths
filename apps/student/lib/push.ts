/**
 * Push notification registration.
 *
 * Flow:
 *   1. After sign-in, call `registerForPush()` once.
 *   2. It asks for permission, fetches an Expo push token, and POSTs it
 *      to the backend's /api/notifications/tokens.
 *   3. Failure modes (permission denied, simulator, no device) are
 *      logged but never throw — push is best-effort, not blocking.
 *
 * Phase 1 hardening:
 *   - Refresh the token when the user opens the app (Expo can reissue)
 *   - Revoke on logout via DELETE /api/notifications/tokens/:token
 *   - Surface a settings UI for the user to opt out of categories
 *     (streak, weekly digest, parent forwards)
 */

import { Platform } from "react-native";
import { authFetch } from "./auth";

const APP_SLUG = "student";

export async function registerForPush(): Promise<void> {
  try {
    const Notifications = await import("expo-notifications");
    const Device = await import("expo-device");

    if (!Device.isDevice) {
      // Simulator / emulator — no push.
      return;
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const ask = await Notifications.requestPermissionsAsync();
      status = ask.status;
    }
    if (status !== "granted") return;

    // The Expo projectId is required to fetch a token. It's set via app.json
    // at `expo.extra.eas.projectId` once the EAS project is created.
    const projectId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await import("expo-constants")).default.expoConfig?.extra?.eas?.projectId;

    const tokenResp = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const platform: "ios" | "android" | "web" =
      Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

    await authFetch("/api/notifications/tokens", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: tokenResp.data,
        platform,
        appSlug: APP_SLUG,
        deviceName: Device.deviceName ?? undefined,
      }),
    });
  } catch (err) {
    // Best-effort: no throw on failure, just log.
    // eslint-disable-next-line no-console
    console.warn("push registration failed:", (err as Error).message);
  }
}
