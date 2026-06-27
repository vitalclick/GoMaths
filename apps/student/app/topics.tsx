import { Card, Icon, type IconName } from "@gomaths/ui";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listTopics, type TopicSummary } from "../lib/curriculum";

export default function TopicsScreen() {
  const [topics, setTopics] = useState<TopicSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTopics(9)
      .then(setTopics)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 pt-8">
        <Text className="text-base text-destructive">Couldn't load topics: {error}</Text>
      </SafeAreaView>
    );
  }

  if (!topics) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <FlatList
        contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 40 }}
        data={topics}
        keyExtractor={(t) => t.topicId}
        ListHeaderComponent={
          <View className="mb-2">
            <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
              Grade 9
            </Text>
            <Text className="mt-1 font-display text-2xl font-extrabold tracking-tight text-foreground">
              Choose a topic
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={{ pathname: "/topic/[id]", params: { id: item.topicId } }} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.title}
              className="active:opacity-80"
            >
              <Card className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft">
                  <Icon name={iconForArea(item.contentArea)} size={22} color="#008a3e" />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    {formatContentArea(item.contentArea)} · {item.capsReference}
                  </Text>
                  <Text className="mt-0.5 font-display text-base font-extrabold text-foreground">
                    {item.title}
                  </Text>
                  <View className="mt-1.5 flex-row items-center gap-1">
                    <Icon name="clock" size={12} color="#8B9590" />
                    <Text className="text-xs text-muted-foreground">
                      ~{item.estimatedMinutes} min
                    </Text>
                  </View>
                </View>
                <Icon name="arrow-right" size={16} color="#8B9590" />
              </Card>
            </Pressable>
          </Link>
        )}
      />
    </SafeAreaView>
  );
}

function iconForArea(area: string): IconName {
  switch (area) {
    case "patterns_functions_algebra":
      return "graph";
    case "space_and_shape":
      return "star";
    case "measurement":
      return "chart";
    case "data_handling":
      return "chart";
    case "numbers":
      return "bolt";
    default:
      return "book";
  }
}

function formatContentArea(area: string): string {
  return area.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
