/**
 * Parent-app push registration. Identical to the Student app's flow
 * except `APP_SLUG = "parent"` — so the backend can target weekly
 * digests, streak forwards, etc. only at parents.
 */

import { Platform } from "react-native";

const APP_SLUG = "parent";
const ACCESS_KEY = "gomaths.parent.access";

export async function registerForPush(): Promise<void> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) return;

    const Notifications = await import("expo-notifications");
    const Device = await import("expo-device");
    if (!Device.isDevice) return;

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") return;

    const projectId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await import("expo-constants")).default.expoConfig?.extra?.eas?.projectId;
    const tokenResp = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const { getItem } = await import("./secure-storage");
    const accessToken = await getItem(ACCESS_KEY);

    const platform: "ios" | "android" | "web" =
      Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

    await fetch(`${apiUrl}/api/notifications/tokens`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        token: tokenResp.data,
        platform,
        appSlug: APP_SLUG,
        deviceName: Device.deviceName ?? undefined,
      }),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("parent push registration failed:", (err as Error).message);
  }
}
