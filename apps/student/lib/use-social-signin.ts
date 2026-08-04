/**
 * Drives a Google/Apple sign-in from any screen: runs the provider sheet,
 * then either lands the learner on the home screen (returning account) or
 * routes to /complete-profile to collect the grade, birth year and — for
 * under-18s — parental consent that the provider can't give us.
 *
 * Backing out of the provider sheet is a normal thing to do, so a
 * cancellation resets state without surfacing an error.
 */

import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useAuth } from "./auth";
import { setPendingSignup } from "./pending-signup";
import { SocialAuthCancelled, type SocialProvider } from "./social-auth";

export function useSocialSignIn() {
  const { signInWithSocial } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (provider: SocialProvider) => {
      setError(null);
      setBusy(provider);
      try {
        const result = await signInWithSocial(provider);
        if (result.status === "authenticated") {
          router.replace("/");
          return;
        }
        setPendingSignup({
          signupToken: result.signupToken,
          email: result.email,
          displayName: result.displayName,
          expiresAt: result.expiresAt,
        });
        router.push("/complete-profile");
      } catch (e) {
        if (e instanceof SocialAuthCancelled) return;
        setError((e as Error).message);
      } finally {
        setBusy(null);
      }
    },
    [signInWithSocial, router],
  );

  return { start, busy, error, clearError: () => setError(null) };
}
