import { Button } from "@gomaths/ui";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("9");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    const gradeNum = Number(grade);
    if (!Number.isInteger(gradeNum) || gradeNum < 1 || gradeNum > 12) {
      setError("Grade must be a whole number between 1 and 12.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await register({ email: email.trim(), password, displayName: displayName.trim(), grade: gradeNum });
      router.replace("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="font-display text-2xl font-bold text-foreground">Create your account</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Phase 0+ scaffold — for under-18 learners, Phase 1 will collect parental consent here.
        </Text>

        <View className="mt-6 gap-4">
          <Field label="Your name" value={displayName} onChange={setDisplayName} />
          <Field label="Email" value={email} onChange={setEmail} keyboard="email-address" />
          <Field label="Password (min 8 characters)" value={password} onChange={setPassword} secure />
          <Field label="Grade (1–12)" value={grade} onChange={setGrade} keyboard="numeric" />
        </View>

        {error && (
          <Text className="mt-4 text-sm text-destructive">{error}</Text>
        )}

        <View className="mt-8 gap-3">
          <Button
            label={submitting ? "Creating…" : "Create account"}
            variant="primary"
            size="lg"
            fullWidth
            disabled={submitting || !email || !password || !displayName || !grade}
            onPress={submit}
          />
          <Link href="/login" asChild>
            <Button label="I already have an account" variant="ghost" size="md" fullWidth />
          </Link>
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
  keyboard?: "default" | "email-address" | "numeric";
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
