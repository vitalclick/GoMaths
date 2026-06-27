import { View } from "react-native";

export type MaxiMood = "happy" | "wow";

export interface MaxiProps {
  /** Pixel size of the (square) mascot. */
  size?: number;
  /** Facial expression. */
  mood?: MaxiMood;
}

/**
 * Maxi — the GoMaths mascot, rendered with plain Views (no SVG dependency).
 *
 * Faithful port of `UI/design1/tokens.jsx`'s `Maxi` component, promoted
 * from the student onboarding flow into the shared library so every screen
 * draws the same mascot (ADR-008). Brand colours are fixed; the green
 * squircle is design1's identity, so it does not theme.
 *
 * NOTE on naming: design1 calls the mascot "Maxi", while the AI tutor
 * persona is "Maya". Reconciling the two is an open product decision
 * (ADR-008) — this component keeps design1's source name until then.
 */
export function Maxi({ size = 64, mood = "happy" }: MaxiProps) {
  const eyeY = size * 0.38;
  const eyeSize = size * 0.14;
  const eyeOffset = size * 0.18;

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* body */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#008a3e",
          borderRadius: size * 0.38,
          shadowColor: "#004d1e",
          shadowOffset: { width: 0, height: size * 0.04 },
          shadowOpacity: 0.35,
          shadowRadius: size * 0.08,
          elevation: 6,
        }}
      />
      {/* cheek highlight */}
      <View
        style={{
          position: "absolute",
          top: size * 0.2,
          left: size * 0.18,
          width: size * 0.28,
          height: size * 0.22,
          backgroundColor: "rgba(255,255,255,0.35)",
          borderRadius: size * 0.14,
        }}
      />
      {/* left eye */}
      <View
        style={{
          position: "absolute",
          top: eyeY,
          left: eyeOffset,
          width: eyeSize,
          height: eyeSize,
          backgroundColor: "#0a140f",
          borderRadius: eyeSize / 2,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: "15%",
            left: "15%",
            width: "40%",
            height: "40%",
            backgroundColor: "#fff",
            borderRadius: 99,
          }}
        />
      </View>
      {/* right eye */}
      <View
        style={{
          position: "absolute",
          top: eyeY,
          right: eyeOffset,
          width: eyeSize,
          height: eyeSize,
          backgroundColor: "#0a140f",
          borderRadius: eyeSize / 2,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: "15%",
            left: "15%",
            width: "40%",
            height: "40%",
            backgroundColor: "#fff",
            borderRadius: 99,
          }}
        />
      </View>
      {/* mouth */}
      {mood === "happy" ? (
        <View
          style={{
            position: "absolute",
            bottom: size * 0.22,
            left: size * 0.32,
            width: size * 0.36,
            height: size * 0.18,
            borderBottomWidth: size * 0.05,
            borderBottomColor: "#0a140f",
            borderBottomLeftRadius: 99,
            borderBottomRightRadius: 99,
          }}
        />
      ) : (
        // "wow" — small open O
        <View
          style={{
            position: "absolute",
            bottom: size * 0.2,
            left: size * 0.42,
            width: size * 0.16,
            height: size * 0.2,
            backgroundColor: "#0a140f",
            borderRadius: 99,
          }}
        />
      )}
    </View>
  );
}
