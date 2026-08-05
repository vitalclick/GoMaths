import { Button } from "@gomaths/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Field } from "../components/Field";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { TextLink } from "../components/TextLink";
import { useAuth } from "../lib/auth";
import { useSocialSignIn } from "../lib/use-social-signin";

export default function LoginScreen() {
  const { login } = useAuth();
  const social = useSocialSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.replace("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text className="font-display text-2xl font-bold text-foreground">Welcome back</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Sign in to continue where you left off.
        </Text>

        {/* Providers first — the fastest way back in for most learners. */}
        <View className="mt-6">
          <SocialAuthButtons mode="in" onPress={social.start} busy={social.busy} />
        </View>

        {social.error && (
          <Text className="mt-4 text-center text-sm text-destructive">{social.error}</Text>
        )}

        <View className="mt-7 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-border" />
          <Text className="text-xs uppercase tracking-wider text-muted-foreground">
            or use your email
          </Text>
          <View className="h-px flex-1 bg-border" />
        </View>

        <View className="mt-6 gap-4">
          <Field label="Email" value={email} onChange={setEmail} keyboard="email-address" />
          <Field label="Password" value={password} onChange={setPassword} secure />
        </View>

        {error && <Text className="mt-4 text-sm text-destructive">{error}</Text>}

        <View className="mt-6">
          <Button
            label={submitting ? "Signing in…" : "Sign in with email"}
            variant="secondary"
            size="md"
            fullWidth
            disabled={submitting || !email || !password}
            onPress={submit}
          />
        </View>

        <View className="mt-8">
          <TextLink href="/register" prefix="New to GoMaths?" label="Create an account" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
