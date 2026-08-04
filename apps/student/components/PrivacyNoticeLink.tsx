/**
 * Opens the public privacy notice in the device browser.
 *
 * Deliberately a sibling of the consent checkbox rather than a link
 * inside its label: nesting a pressable inside the checkbox's own
 * Pressable makes tapping the link also tick the box, which is the
 * opposite of informed consent. A separate row also gives the link a
 * real tap target.
 */

import { Linking, Pressable, Text } from "react-native";
import { PRIVACY_URL } from "../lib/links";

export function PrivacyNoticeLink({ className = "" }: { className?: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Read the privacy notice"
      onPress={() => {
        void Linking.openURL(PRIVACY_URL);
      }}
      className={`self-start py-2 active:opacity-70 ${className}`}
    >
      <Text className="text-sm font-semibold text-foreground underline">
        Read the privacy notice
      </Text>
    </Pressable>
  );
}
