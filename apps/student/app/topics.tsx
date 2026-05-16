import { Card } from "@gomaths/ui";
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
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        contentContainerStyle={{ padding: 20, gap: 12 }}
        data={topics}
        keyExtractor={(t) => t.topicId}
        ListHeaderComponent={
          <Text className="mb-2 font-display text-2xl font-bold text-foreground">
            Choose a topic
          </Text>
        }
        renderItem={({ item }) => (
          <Link href={{ pathname: "/topic/[id]", params: { id: item.topicId } }} asChild>
            <Pressable className="active:opacity-80">
              <Card>
                <Text className="text-xs uppercase tracking-wider text-muted-foreground">
                  {formatContentArea(item.contentArea)} · {item.capsReference}
                </Text>
                <Text className="mt-1 font-display text-lg font-bold text-foreground">
                  {item.title}
                </Text>
                <View className="mt-2 flex-row items-center gap-2">
                  <Text className="text-xs text-muted-foreground">
                    ~{item.estimatedMinutes} min
                  </Text>
                </View>
              </Card>
            </Pressable>
          </Link>
        )}
      />
    </SafeAreaView>
  );
}

function formatContentArea(area: string): string {
  return area.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
