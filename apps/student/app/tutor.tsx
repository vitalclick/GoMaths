import { Card } from "@gomaths/ui";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextWithMath } from "../components/TextWithMath";
import { useAuth } from "../lib/auth";
import { useDebugEnabled } from "../lib/prefs";
import { getConversation, streamTutorMessage } from "../lib/tutor";

interface ChatMessage {
  id: string;
  role: "user" | "maya";
  text: string;
  validated?: boolean;
  streaming?: boolean;
  verifiedClaims?: number;
  totalClaims?: number;
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  provider?: string;
  model?: string;
}

const SUGGESTED_PROMPTS = [
  "Help me solve a linear equation",
  "What are the laws of exponents?",
  "Explain step by step, please",
  "I'm stuck — can you help?",
];

let nextId = 1;
const makeId = () => `m_${nextId++}`;

export default function TutorScreen() {
  const { user } = useAuth();
  const { topicId, conversationId: initialConvId } = useLocalSearchParams<{
    topicId?: string;
    conversationId?: string;
  }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConvId);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(Boolean(initialConvId));
  const debug = useDebugEnabled();

  const scrollRef = useRef<ScrollView | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  // Load conversation history when an existing conversationId is supplied.
  useEffect(() => {
    if (!initialConvId) return;
    let cancelled = false;
    setLoadingHistory(true);
    getConversation(initialConvId)
      .then((conv) => {
        if (cancelled) return;
        setMessages(
          conv.turns.map((t) => ({
            id: makeId(),
            role: t.role,
            text: t.text,
            validated: t.role === "maya" ? t.validated : undefined,
          })),
        );
        setConversationId(conv.id);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoadingHistory(false));
    return () => {
      cancelled = true;
    };
  }, [initialConvId]);

  useEffect(() => {
    // Defer to next tick so the new content is laid out before scrolling.
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 30);
    return () => clearTimeout(t);
  }, [messages.length, sending]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      const userMsg: ChatMessage = { id: makeId(), role: "user", text: trimmed };
      const mayaId = makeId();
      const mayaPlaceholder: ChatMessage = {
        id: mayaId,
        role: "maya",
        text: "",
        streaming: true,
        verifiedClaims: 0,
        totalClaims: 0,
      };

      setMessages((prev) => [...prev, userMsg, mayaPlaceholder]);
      setInput("");
      setSending(true);
      setError(null);

      const updateMaya = (patch: Partial<ChatMessage>) =>
        setMessages((prev) => prev.map((m) => (m.id === mayaId ? { ...m, ...patch } : m)));

      const cancel = streamTutorMessage(
        { message: trimmed, topicId, conversationId },
        {
          onMeta: ({ conversationId: convId }) => setConversationId(convId),
          onDelta: (delta) =>
            setMessages((prev) =>
              prev.map((m) => (m.id === mayaId ? { ...m, text: m.text + delta } : m)),
            ),
          onClaim: (claim) =>
            setMessages((prev) =>
              prev.map((m) =>
                m.id === mayaId
                  ? {
                      ...m,
                      totalClaims: (m.totalClaims ?? 0) + 1,
                      verifiedClaims: (m.verifiedClaims ?? 0) + (claim.ok ? 1 : 0),
                    }
                  : m,
              ),
            ),
          onDone: (final) => {
            updateMaya({
              text: final.reply,
              validated: final.validated,
              streaming: false,
              inputTokens: final.inputTokens,
              outputTokens: final.outputTokens,
              cachedTokens: final.cachedTokens,
              provider: final.provider,
              model: final.model,
            });
            setSending(false);
            abortRef.current = null;
          },
          onError: (err) => {
            setError(err.message);
            updateMaya({
              text: "Sorry — I couldn't reach the tutor service. Please try again.",
              streaming: false,
            });
            setSending(false);
            abortRef.current = null;
          },
        },
      );
      abortRef.current = cancel;
    },
    [conversationId, sending, topicId],
  );

  const abort = () => {
    abortRef.current?.();
    abortRef.current = null;
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false, text: m.text + " …" } : m)),
    );
    setSending(false);
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-center text-base text-muted-foreground">
          Sign in to chat with Maya.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <Stack.Screen options={{ title: "Maya · AI Tutor" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        {topicId ? (
          <View className="border-b border-border bg-primary-soft px-5 py-2">
            <Text className="text-xs font-semibold text-primary">Topic context: {topicId}</Text>
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          className="flex-1 bg-muted/40"
          contentContainerStyle={{ padding: 16, gap: 10 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && <EmptyState topicId={topicId} />}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} debug={debug} />
          ))}

          {sending && <TypingBubble />}
        </ScrollView>

        {error && <Text className="px-5 py-1 text-xs text-destructive">{error}</Text>}

        {messages.length === 0 && !sending && (
          <View className="border-t border-border bg-background">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
            >
              {SUGGESTED_PROMPTS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => send(p)}
                  className="rounded-full border border-border bg-card px-3 py-2 active:opacity-70"
                >
                  <Text className="text-xs font-medium text-muted-foreground">{p}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="border-t border-border bg-background px-4 py-3">
          <View className="flex-row items-center gap-2 rounded-full border border-border bg-card pl-4 pr-1">
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send(input)}
              placeholder="Ask Maya anything…"
              returnKeyType="send"
              editable={!sending}
              className="flex-1 py-3 text-base text-foreground"
              autoCorrect
            />
            {sending ? (
              <Pressable
                accessibilityLabel="Stop"
                onPress={abort}
                className="h-10 w-10 items-center justify-center rounded-full bg-destructive"
              >
                <Text className="font-display text-base font-bold text-destructive-foreground">
                  ■
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityLabel="Send"
                disabled={!input.trim()}
                onPress={() => send(input)}
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  !input.trim() ? "bg-muted" : "bg-primary"
                }`}
              >
                <Text
                  className={`font-display text-lg font-bold ${
                    !input.trim() ? "text-muted-foreground" : "text-primary-foreground"
                  }`}
                >
                  ↑
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message, debug }: { message: ChatMessage; debug: boolean }) {
  const isUser = message.role === "user";
  return (
    <View className={`flex-row ${isUser ? "justify-end" : "justify-start"}`}>
      <View className={`max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <View
          className={`rounded-2xl px-4 py-2.5 ${
            isUser ? "rounded-br-sm bg-primary" : "rounded-bl-sm bg-card"
          }`}
        >
          {isUser ? (
            <Text className="text-sm text-primary-foreground">{message.text}</Text>
          ) : (
            <View className="flex-row flex-wrap items-baseline">
              <TextWithMath
                text={message.text || (message.streaming ? "" : " ")}
                fontSize={14}
                style={{ color: "#0E1A14" }}
              />
              {message.streaming && (
                <Text className="font-display text-base text-primary" accessibilityLabel="typing">
                  ▋
                </Text>
              )}
            </View>
          )}
        </View>
        {!isUser && message.streaming && (message.totalClaims ?? 0) > 0 && (
          <View className="mt-1 flex-row items-center gap-1 px-2">
            <View className="h-1.5 w-1.5 rounded-full bg-primary" />
            <Text className="text-[10px] text-muted-foreground">
              Verifying maths: {message.verifiedClaims}/{message.totalClaims}
            </Text>
          </View>
        )}
        {!isUser && !message.streaming && message.validated !== undefined && (
          <View className="mt-1 flex-row items-center gap-1 px-2">
            <View
              className={`h-1.5 w-1.5 rounded-full ${
                message.validated ? "bg-success" : "bg-muted-foreground"
              }`}
            />
            <Text className="text-[10px] text-muted-foreground">
              {message.validated ? "Maths verified" : "Reply not fully verified"}
            </Text>
          </View>
        )}
        {debug && !isUser && !message.streaming && message.inputTokens !== undefined && (
          <Text className="mt-0.5 px-2 text-[10px] font-mono text-muted-foreground">
            {message.provider}/{message.model}
            {" · "}
            in {message.inputTokens} (cached {message.cachedTokens ?? 0}){" · out "}
            {message.outputTokens}
          </Text>
        )}
      </View>
    </View>
  );
}

function TypingBubble() {
  return (
    <View className="flex-row justify-start">
      <View className="rounded-2xl rounded-bl-sm bg-card px-4 py-3">
        <View className="flex-row gap-1">
          <View className="h-2 w-2 rounded-full bg-muted-foreground" />
          <View className="h-2 w-2 rounded-full bg-muted-foreground opacity-70" />
          <View className="h-2 w-2 rounded-full bg-muted-foreground opacity-40" />
        </View>
      </View>
    </View>
  );
}

function EmptyState({ topicId }: { topicId?: string }) {
  return (
    <Card>
      <Text className="font-display text-lg font-bold text-foreground">Hi, I'm Maya</Text>
      <Text className="mt-1 text-sm text-muted-foreground">
        {topicId
          ? `I have the lesson for ${topicId} in front of me. Ask me anything about it — or just start with one of the prompts below.`
          : "Your maths buddy. Pick a topic from the home screen for me to focus on, or start with one of the prompts below."}
      </Text>
    </Card>
  );
}
