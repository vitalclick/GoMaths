import { Text, View } from "react-native";

/**
 * Persistent pre-release banner.
 *
 * Renders only when `EXPO_PUBLIC_PREVIEW_BANNER` is truthy. Sits above
 * the Stack header on every screen, so anyone visiting the preview URL
 * knows the curriculum and dataset are placeholders.
 *
 * Keep the copy tight — this strip is on every screen. The full
 * disclaimer lives in the README of the preview environment.
 */
export function PreviewBanner() {
  if (!isPreview()) return null;
  return (
    <View
      style={{
        backgroundColor: "#FFE066",
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
      accessibilityRole="alert"
    >
      <Text style={{ fontSize: 12, color: "#3a2a00", textAlign: "center" }}>
        Pre-release · curriculum limited to 2 Grade 9 topics · do not use real personal data
      </Text>
    </View>
  );
}

function isPreview(): boolean {
  const v = process.env.EXPO_PUBLIC_PREVIEW_BANNER;
  return v === "1" || v === "true";
}
