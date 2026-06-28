import { Icon, type IconName, TabBar, type TabItem } from "@gomaths/ui";
import { Tabs } from "expo-router";

/**
 * design1 bottom-tab navigation. The five main destinations live in this
 * route group; `(tabs)` is invisible in the URL, so the public paths
 * (`/`, `/topics`, `/solver`, `/tutor`, `/progress`) are unchanged and all
 * existing Links keep working. Detail screens (topic/practice/conversations)
 * stay on the root Stack and push over the tabs.
 */

const ITEMS: TabItem[] = [
  { id: "index", label: "Home" },
  { id: "topics", label: "Learn" },
  { id: "solver", label: "Solve", center: true },
  { id: "tutor", label: "Tutor" },
  { id: "profile", label: "Profile" },
];

const ICONS: Record<string, IconName> = {
  index: "home",
  topics: "book",
  solver: "camera",
  tutor: "chat",
  profile: "profile",
  // `progress` is still a routable tab screen (reached from Home/Profile),
  // just not shown in the bar — keep an icon for completeness.
  progress: "chart",
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => {
        const activeName = state.routes[state.index]?.name ?? "index";
        return (
          <TabBar
            active={activeName}
            items={ITEMS}
            onTab={(id) => navigation.navigate(id as never)}
            renderIcon={(item, isActive) => (
              <Icon
                name={ICONS[item.id] ?? "home"}
                size={24}
                color={item.center ? "#ffffff" : isActive ? "#008a3e" : "#8B9590"}
                strokeWidth={isActive ? 2.4 : 2}
              />
            )}
          />
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="topics" />
      <Tabs.Screen name="solver" />
      <Tabs.Screen name="tutor" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="progress" />
    </Tabs>
  );
}
