/**
 * The primary sign-in affordance: Google and Apple, full-bleed, above the
 * fold. Email is deliberately demoted to a text link by the screens that
 * render this — one tap versus a form is the whole point.
 *
 * Both marks are drawn inline rather than shipped as image assets so they
 * stay crisp at any size and don't add a network/bundle round trip.
 *
 * Button styling follows each provider's brand rules (white with a hairline
 * border for Google, solid black for Apple) rather than the GoMaths palette
 * — these are the shapes learners already recognise, and both providers
 * require it. Sizing/radius still matches `@gomaths/ui` Button `size="lg"`.
 */

import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { isAppleAvailable, isGoogleConfigured, type SocialProvider } from "../lib/social-auth";

export interface SocialAuthButtonsProps {
  /** "in" on the sign-in screen, "up" on the create-account screen. */
  mode?: "in" | "up";
  onPress: (provider: SocialProvider) => void;
  /** Which provider is mid-flight, if any. */
  busy?: SocialProvider | null;
  disabled?: boolean;
}

export function SocialAuthButtons({
  mode = "in",
  onPress,
  busy = null,
  disabled = false,
}: SocialAuthButtonsProps) {
  const [appleReady, setAppleReady] = useState(false);
  const googleReady = isGoogleConfigured();

  useEffect(() => {
    let active = true;
    isAppleAvailable().then((ok) => {
      if (active) setAppleReady(ok);
    });
    return () => {
      active = false;
    };
  }, []);

  const verb = mode === "up" ? "Sign up" : "Sign in";

  // A provider with no client ID configured, or Apple off iOS, would only
  // ever produce an error — so it isn't rendered at all.
  if (!googleReady && !appleReady) {
    return (
      <Text className="text-center text-sm text-muted-foreground">
        Social sign-in isn't available in this build — use your email below.
      </Text>
    );
  }

  return (
    <View className="w-full gap-3">
      {googleReady && (
        <ProviderButton
          label={`${verb} with Google`}
          onPress={() => onPress("google")}
          busy={busy === "google"}
          disabled={disabled || busy !== null}
          tone="light"
          icon={<GoogleMark />}
        />
      )}
      {appleReady && (
        <ProviderButton
          label={`${verb} with Apple`}
          onPress={() => onPress("apple")}
          busy={busy === "apple"}
          disabled={disabled || busy !== null}
          tone="dark"
          icon={<AppleMark />}
        />
      )}
    </View>
  );
}

function ProviderButton({
  label,
  onPress,
  busy,
  disabled,
  tone,
  icon,
}: {
  label: string;
  onPress: () => void;
  busy: boolean;
  disabled: boolean;
  tone: "light" | "dark";
  icon: React.ReactNode;
}) {
  const light = tone === "light";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      className={[
        "w-full flex-row items-center justify-center gap-3 rounded-2xl px-6 py-4 active:opacity-80",
        light ? "border border-border bg-card" : "bg-black",
        disabled ? "opacity-60" : "",
      ].join(" ")}
      style={
        // Lift the primary CTAs off the background. Elevation is Android's
        // knob; iOS/web use the shadow triplet.
        Platform.select({
          android: { elevation: 2 },
          default: {
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          },
        })
      }
    >
      {busy ? (
        <ActivityIndicator size="small" color={light ? "#3C4043" : "#FFFFFF"} />
      ) : (
        <View>{icon}</View>
      )}
      <Text
        className={`font-sans text-lg font-semibold ${light ? "text-foreground" : "text-white"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Google's four-colour "G". Path data from the official brand assets. */
function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <Path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <Path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <Path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </Svg>
  );
}

/** Apple's mark, white for use on the required black button. */
function AppleMark({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#FFFFFF"
        d="M17.05 12.54c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.61-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.75-.78-2.87-.76-1.48.02-2.84.86-3.6 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.75 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.19-.02 1.94-1.08 2.66-2.14.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.32-.89-2.34-3.5zM14.9 5.6c.6-.74 1.01-1.76.9-2.78-.87.04-1.93.58-2.56 1.31-.56.65-1.05 1.7-.92 2.7.97.08 1.96-.49 2.58-1.23z"
      />
    </Svg>
  );
}
