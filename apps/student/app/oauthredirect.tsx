/**
 * Landing route for a provider's OAuth redirect.
 *
 * Google's consent redirect (`com.gomaths.mathai:/oauthredirect`) comes back
 * as a real deep link. expo-auth-session's listener resolves the pending
 * sign-in promise from it, but expo-router's linking listener sees the same
 * URL and tries to navigate to `/oauthredirect` — and with no route by that
 * name the learner lands on "Unmatched Route" the moment consent completes.
 *
 * So the route exists purely to absorb that navigation: close the auth
 * session and step back to the screen that started sign-in, which is still
 * mounted and owns the real result (it routes on to `/` or
 * `/complete-profile` once the backend answers).
 *
 * Apple needs nothing here — `expo-apple-authentication` presents a native
 * sheet and returns the credential in-process, so no URL ever re-enters the
 * app. This only matters for providers that round-trip through a browser.
 */

import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function OAuthRedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
    // A deep link can reset the stack rather than push onto it, so there
    // isn't always somewhere to go back to. Home is the safe landing either
    // way: it renders the signed-out screen or the dashboard to match
    // whatever the sign-in ends up resolving to.
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator />
    </View>
  );
}
