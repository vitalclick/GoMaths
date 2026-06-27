import { colors } from "@gomaths/design-tokens";
import { View, type ViewStyle } from "react-native";

const c = colors.light;

export interface ProgressBarProps {
  /** Fill amount, 0–1 (clamped). */
  value: number;
  /** Track height in px. */
  height?: number;
  /** Fill colour (defaults to GoMaths green). */
  color?: string;
  /** Track colour. */
  trackColor?: string;
  style?: ViewStyle;
}

/**
 * ProgressBar — rounded fill bar, ported from design1's `GMProgress`
 * (ADR-008). Exposes accessibility progressbar semantics.
 */
export function ProgressBar({
  value,
  height = 10,
  color = c.primary,
  trackColor = c.muted,
  style,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={{
        height,
        borderRadius: 999,
        backgroundColor: trackColor,
        overflow: "hidden",
        ...style,
      }}
    >
      <View
        style={{
          width: `${pct * 100}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: 999,
        }}
      />
    </View>
  );
}
