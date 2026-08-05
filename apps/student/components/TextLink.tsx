/**
 * A quiet inline link — the demoted counterpart to `Button`.
 *
 * Used for the email sign-in / sign-up routes now that Google and Apple
 * own the primary buttons. The Pressable wrapper (rather than a bare
 * `Text` inside `<Link asChild>`) is what gives it a real tap target and
 * a stable `role="link"` with an accessible name, which is also what the
 * e2e helpers match on.
 */

import { Link, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";

export interface TextLinkProps {
  href: Href;
  label: string;
  /** Plain text shown before the link, e.g. "Already have an account?". */
  prefix?: string;
}

export function TextLink({ href, label, prefix }: TextLinkProps) {
  return (
    <View className="flex-row flex-wrap items-center justify-center gap-x-1">
      {prefix ? <Text className="text-sm text-muted-foreground">{prefix}</Text> : null}
      <Link href={href} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={label}
          className="px-1 py-2 active:opacity-70"
        >
          <Text className="text-sm font-semibold text-foreground underline">{label}</Text>
        </Pressable>
      </Link>
    </View>
  );
}
