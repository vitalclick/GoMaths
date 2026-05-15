import { Button } from "@gomaths/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
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
        <Text className="font-display text-2xl font-bold text-foreground">Sign in</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Use your GoMaths teacher account.
        </Text>

        <View className="mt-6 gap-4">
          <Field label="Email" value={email} onChange={setEmail} keyboard="email-address" />
          <Field label="Password" value={password} onChange={setPassword} secure />
        </View>

        {error && <Text className="mt-4 text-sm text-destructive">{error}</Text>}

        <View className="mt-8">
          <Button
            label={submitting ? "Signing in…" : "Sign in"}
            variant="primary"
            size="lg"
            fullWidth
            disabled={submitting}
            onPress={submit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  secure,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  keyboard?: "default" | "email-address";
}) {
  return (
    <View>
      <Text className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        keyboardType={keyboard ?? "default"}
        autoCapitalize="none"
        autoCorrect={false}
        className="mt-1 rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground"
      />
    </View>
  );
}
