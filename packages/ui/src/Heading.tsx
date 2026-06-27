import { Pressable, Text, View } from "react-native";
import { cn } from "./cn";

export interface HeadingProps {
  /** Section title. */
  children: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  /** Optional trailing action label (e.g. "See all"). */
  action?: string;
  onActionPress?: () => void;
  className?: string;
}

/**
 * Heading — a section header with optional eyebrow + trailing action,
 * ported from design1's `GMHeading` (ADR-008).
 */
export function Heading({ children, eyebrow, action, onActionPress, className }: HeadingProps) {
  return (
    <View className={cn("mb-3 flex-row items-end justify-between", className)}>
      <View className="flex-1">
        {eyebrow ? (
          <Text className="mb-1 font-display text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </Text>
        ) : null}
        <Text className="font-display text-xl font-extrabold tracking-tight text-foreground">
          {children}
        </Text>
      </View>
      {action ? (
        <Pressable
          accessibilityRole={onActionPress ? "button" : undefined}
          accessibilityLabel={action}
          onPress={onActionPress}
          className="active:opacity-60"
        >
          <Text className="font-display text-sm font-extrabold text-primary">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
