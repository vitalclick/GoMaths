import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * Google's redirect lands here as a real deep link, and expo-router's own
 * linking listener sees it alongside expo-auth-session's — regardless of
 * which one resolves the pending sign-in promise, the router still needs a
 * matching route or it shows "Unmatched Route". This screen just closes the
 * auth session and steps back to wherever sign-in was started from, which is
 * still mounted and owns the actual result.
 */
export default function OAuthRedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator />
    </View>
  );
}
