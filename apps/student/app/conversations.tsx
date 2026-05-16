import { Card } from "@gomaths/ui";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listConversations, type ConversationSummary } from "../lib/tutor";

export default function ConversationsScreen() {
  const [items, setItems] = useState<ConversationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listConversations()
        .then((r) => !cancelled && setItems(r))
        .catch((e) => !cancelled && setError(e.message));
      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 pt-8">
        <Text className="text-base text-destructive">Couldn't load conversations: {error}</Text>
      </SafeAreaView>
    );
  }

  if (!items) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-display text-2xl font-bold text-foreground">
            No conversations yet
          </Text>
          <Text className="mt-2 text-center text-base text-muted-foreground">
            Start a chat with Maya and it will show up here.
          </Text>
          <Link href="/tutor" asChild>
            <Pressable className="mt-6 rounded-full bg-accent px-5 py-3 active:opacity-80">
              <Text className="font-display text-base font-bold text-accent-foreground">
                Chat with Maya
              </Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text className="mb-2 font-display text-2xl font-bold text-foreground">
          Your conversations
        </Text>
        {items.map((c) => (
          <Link key={c.id} href={{ pathname: "/tutor", params: { conversationId: c.id } }} asChild>
            <Pressable className="active:opacity-80">
              <Card>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs uppercase tracking-wider text-muted-foreground">
                    {new Date(c.updatedAt).toLocaleString()}
                  </Text>
                  {c.topicId ? (
                    <View className="rounded-full bg-primary-soft px-2 py-0.5">
                      <Text className="text-[10px] font-semibold text-primary">{c.topicId}</Text>
                    </View>
                  ) : null}
                </View>
                <Text className="mt-1 text-sm text-foreground" numberOfLines={2}>
                  {c.preview || "(empty conversation)"}
                </Text>
                <Text className="mt-2 text-xs text-muted-foreground">
                  {c.turnCount} {c.turnCount === 1 ? "turn" : "turns"}
                </Text>
              </Card>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
