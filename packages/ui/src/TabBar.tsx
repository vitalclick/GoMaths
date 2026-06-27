import { colors } from "@gomaths/design-tokens";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

const c = colors.light;

export interface TabItem {
  id: string;
  label: string;
  /** Marks the raised centre action (design1's green camera FAB). */
  center?: boolean;
}

export const DEFAULT_TABS: TabItem[] = [
  { id: "home", label: "Home" },
  { id: "learn", label: "Learn" },
  { id: "solve", label: "Solve", center: true },
  { id: "tutor", label: "Tutor" },
  { id: "profile", label: "Profile" },
];

export interface TabBarProps {
  /** id of the active tab. */
  active: string;
  onTab?: (id: string) => void;
  items?: TabItem[];
  /**
   * Optional icon renderer. Kept as a prop so the shared lib stays
   * icon-agnostic (no react-native-svg dependency yet — see ADR-008).
   * When omitted, tabs render their label only.
   */
  renderIcon?: (item: TabItem, active: boolean) => ReactNode;
}

/**
 * TabBar — presentational floating bottom navigation, ported from
 * design1's `GMTabBar` (ADR-008). The centre item renders as a raised
 * FAB. This is the visual primitive only; wiring it to Expo Router's
 * `Tabs` navigator is screen-level work (tracked separately).
 */
export function TabBar({ active, onTab, items = DEFAULT_TABS, renderIcon }: TabBarProps) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "flex-end",
        backgroundColor: c.card,
        borderTopWidth: 1,
        borderTopColor: c.border,
        paddingTop: 8,
        paddingBottom: 30,
      }}
    >
      {items.map((item) => {
        const isActive = item.id === active;

        if (item.center) {
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => onTab?.(item.id)}
              style={{ alignItems: "center", transform: [{ translateY: -14 }] }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: c.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: c.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                {renderIcon ? (
                  <View>{renderIcon(item, isActive)}</View>
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11 }}>
                    {item.label}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => onTab?.(item.id)}
            style={{ alignItems: "center", gap: 3, paddingVertical: 6, paddingHorizontal: 12 }}
          >
            {renderIcon ? <View>{renderIcon(item, isActive)}</View> : null}
            <Text
              style={{
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 0.3,
                color: isActive ? c.primary : c.mutedForeground,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
