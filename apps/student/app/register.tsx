import { Button, Card } from "@gomaths/ui";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradePicker, type GradeValue } from "../components/GradePicker";
import { useAuth } from "../lib/auth";

type Step = "details" | "grade" | "consent";

interface FormState {
  displayName: string;
  email: string;
  password: string;
  birthYear: string;
  grade: GradeValue | null;
  parentEmail: string;
  parentName: string;
  consentAcknowledged: boolean;
}

const currentYear = new Date().getFullYear();

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState<FormState>({
    displayName: "",
    email: "",
    password: "",
    birthYear: "",
    grade: null,
    parentEmail: "",
    parentName: "",
    consentAcknowledged: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patch = (p: Partial<FormState>) => setForm((prev) => ({ ...prev, ...p }));
  const age = form.birthYear ? Math.max(0, currentYear - Number(form.birthYear)) : null;
  const isMinor = age !== null && age < 18;

  const validateDetails = (): string | null => {
    if (!form.displayName.trim()) return "Tell us your name.";
    if (!form.email.includes("@")) return "Enter a valid email address.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    const yr = Number(form.birthYear);
    if (!Number.isInteger(yr) || yr < currentYear - 100 || yr > currentYear) {
      return "Enter a valid birth year.";
    }
    return null;
  };

  const validateConsent = (): string | null => {
    if (!isMinor) return null;
    if (!form.parentEmail.includes("@")) return "We need a parent or guardian email.";
    if (!form.parentName.trim()) return "We need a parent or guardian name.";
    if (!form.consentAcknowledged) return "Please tick the consent box to continue.";
    return null;
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      // POPIA Phase 0+: we send a stub `parentalConsentToken` when the
      // learner is a minor. Phase 1 must replace this with a real
      // out-of-band consent flow (email the parent a confirmation link
      // that mints a token, then submit THAT token here).
      const parentalConsentToken = isMinor
        ? `stub:${encodeURIComponent(form.parentEmail.trim().toLowerCase())}`
        : undefined;

      await register({
        email: form.email.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
        grade: typeof form.grade === "number" ? form.grade : 1,
        parentalConsentToken,
      });
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
        <StepIndicator current={step} isMinor={isMinor} />

        {step === "details" && (
          <View className="mt-6">
            <Text className="font-display text-2xl font-bold text-foreground">
              Create your account
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              We just need a few details to set up your profile.
            </Text>

            <View className="mt-6 gap-4">
              <Field
                label="Your name"
                value={form.displayName}
                onChange={(v) => patch({ displayName: v })}
              />
              <Field
                label="Email"
                value={form.email}
                onChange={(v) => patch({ email: v })}
                keyboard="email-address"
              />
              <Field
                label="Password (min 8 characters)"
                value={form.password}
                onChange={(v) => patch({ password: v })}
                secure
              />
              <Field
                label="Year of birth"
                value={form.birthYear}
                onChange={(v) => patch({ birthYear: v.replace(/[^0-9]/g, "").slice(0, 4) })}
                keyboard="numeric"
              />
            </View>

            {error && <Text className="mt-4 text-sm text-destructive">{error}</Text>}

            <View className="mt-8 gap-3">
              <Button
                label="Next: pick a grade"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => {
                  const v = validateDetails();
                  if (v) {
                    setError(v);
                    return;
                  }
                  setError(null);
                  setStep("grade");
                }}
              />
              <Link href="/login" asChild>
                <Button label="I already have an account" variant="ghost" size="md" fullWidth />
              </Link>
            </View>
          </View>
        )}

        {step === "grade" && (
          <View className="mt-6">
            <Text className="font-display text-2xl font-bold text-foreground">
              Which grade are you in?
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              We use this to pick the right lessons.
            </Text>

            <View className="mt-6">
              <GradePicker value={form.grade} onChange={(g) => patch({ grade: g })} />
            </View>

            {error && <Text className="mt-4 text-sm text-destructive">{error}</Text>}

            <View className="mt-8 gap-3">
              <Button
                label={isMinor ? "Next: parent consent" : "Create account"}
                variant="primary"
                size="lg"
                fullWidth
                disabled={form.grade === null}
                onPress={() => {
                  if (form.grade === null) return;
                  setError(null);
                  if (isMinor) setStep("consent");
                  else submit();
                }}
              />
              <Button
                label="Back"
                variant="ghost"
                size="md"
                fullWidth
                onPress={() => setStep("details")}
              />
            </View>
          </View>
        )}

        {step === "consent" && (
          <View className="mt-6">
            <Text className="font-display text-2xl font-bold text-foreground">
              Parent or guardian
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              You're under 18, so South African law (POPIA) needs a parent or guardian to give
              permission before we can keep your data.
            </Text>

            <View className="mt-6 gap-4">
              <Field
                label="Parent / guardian name"
                value={form.parentName}
                onChange={(v) => patch({ parentName: v })}
              />
              <Field
                label="Parent / guardian email"
                value={form.parentEmail}
                onChange={(v) => patch({ parentEmail: v })}
                keyboard="email-address"
              />
            </View>

            <Pressable
              onPress={() => patch({ consentAcknowledged: !form.consentAcknowledged })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: form.consentAcknowledged }}
              className="mt-5 flex-row items-start gap-3 active:opacity-70"
            >
              <View
                className={`mt-0.5 h-5 w-5 items-center justify-center rounded border-2 ${
                  form.consentAcknowledged ? "border-primary bg-primary" : "border-border"
                }`}
              >
                {form.consentAcknowledged && (
                  <Text className="text-xs font-bold text-primary-foreground">✓</Text>
                )}
              </View>
              <Text className="flex-1 text-sm text-foreground">
                My parent or guardian has agreed I can use GoMaths and has read our{" "}
                <Text className="underline">privacy notice</Text>.
              </Text>
            </Pressable>

            <Card className="mt-5">
              <Text className="text-xs text-muted-foreground">
                We'll email your parent or guardian a confirmation link. Your account stays in a
                limited state until they confirm — you can still browse lessons but progress data
                won't be stored.
              </Text>
            </Card>

            {error && <Text className="mt-4 text-sm text-destructive">{error}</Text>}

            <View className="mt-8 gap-3">
              <Button
                label={submitting ? "Creating…" : "Create account"}
                variant="primary"
                size="lg"
                fullWidth
                disabled={submitting}
                onPress={() => {
                  const v = validateConsent();
                  if (v) {
                    setError(v);
                    return;
                  }
                  submit();
                }}
              />
              <Button
                label="Back"
                variant="ghost"
                size="md"
                fullWidth
                onPress={() => setStep("grade")}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StepIndicator({ current, isMinor }: { current: Step; isMinor: boolean }) {
  const steps: { id: Step; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "grade", label: "Grade" },
  ];
  if (isMinor) steps.push({ id: "consent", label: "Consent" });

  return (
    <View className="flex-row gap-2">
      {steps.map((s) => (
        <View
          key={s.id}
          className={`h-1.5 flex-1 rounded-full ${current === s.id ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </View>
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
