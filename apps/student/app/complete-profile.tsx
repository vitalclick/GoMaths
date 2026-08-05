/**
 * The second half of a social sign-up.
 *
 * Google and Apple tell us who someone is, not what grade they're in or
 * how old they are — and POPIA won't let us store a minor's data without a
 * parent's say-so. So a first-time social sign-in lands here with a signup
 * ticket, and the account only exists once this form is submitted.
 *
 * The consent leg is the same three-state machine as /register: collect
 * the parent's email → wait for them to click the emailed link → redeem
 * the receipt. Kept in step with register.tsx.
 */

import { Button, Card } from "@gomaths/ui";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Field } from "../components/Field";
import { GradePicker, type GradeValue } from "../components/GradePicker";
import { PrivacyNoticeLink } from "../components/PrivacyNoticeLink";
import { useAuth } from "../lib/auth";
import { clearPendingSignup, getPendingSignup } from "../lib/pending-signup";

type Step = "profile" | "consent";
type ConsentPhase = "collect" | "awaiting-parent" | "ready";

const currentYear = new Date().getFullYear();

export default function CompleteProfileScreen() {
  const { completeSocialSignup, requestParentalConsent, pollParentalConsent } = useAuth();
  const router = useRouter();

  // Captured once, on mount. Re-reading this every render meant it
  // evaporated the moment the ticket aged out — mid-form, mid-consent — and
  // the effect below then bounced the learner home, silently binning
  // everything they'd entered, including the consent they'd just chased
  // their parent for. Holding it makes expiry surface where it should: as a
  // visible error from the server when they submit.
  const [pending] = useState(getPendingSignup);

  const [step, setStep] = useState<Step>("profile");
  const [grade, setGrade] = useState<GradeValue | null>(null);
  const [birthYear, setBirthYear] = useState("");
  const [displayName, setDisplayName] = useState(pending?.displayName ?? "");
  // Only asked for when the provider withheld it (an Apple user can decline).
  const [email, setEmail] = useState(pending?.email ?? "");
  const [parentEmail, setParentEmail] = useState("");
  const [parentName, setParentName] = useState("");
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  const [consentPhase, setConsentPhase] = useState<ConsentPhase>("collect");
  const [consentId, setConsentId] = useState<string | null>(null);
  const [receiptToken, setReceiptToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const age = birthYear ? Math.max(0, currentYear - Number(birthYear)) : null;
  const isMinor = age !== null && age < 18;
  const providerEmail = pending?.email;

  // Reachable only via a social sign-in. A direct hit (deep link, reload on
  // web) never had a ticket to redeem, so send them back. An expired ticket
  // is no longer lumped in with that: it belongs to someone mid-signup, and
  // they get told rather than teleported.
  useEffect(() => {
    if (!pending) router.replace("/");
  }, [pending, router]);

  if (!pending) return null;

  const validateProfile = (): string | null => {
    if (!displayName.trim()) return "Tell us your name.";
    if (!providerEmail && !email.includes("@")) return "Enter a valid email address.";
    if (grade === null) return "Pick your grade.";
    const yr = Number(birthYear);
    if (!Number.isInteger(yr) || yr < currentYear - 100 || yr > currentYear) {
      return "Enter a valid birth year.";
    }
    return null;
  };

  const consentEmail = (providerEmail ?? email).trim().toLowerCase();

  const sendConsentInvite = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await requestParentalConsent(parentEmail.trim(), consentEmail);
      setConsentId(result.id);
      setConsentPhase("awaiting-parent");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const checkConsent = async () => {
    if (!consentId) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await pollParentalConsent(consentId, consentEmail);
      if (result.status === "CONFIRMED" && result.receiptToken) {
        setReceiptToken(result.receiptToken);
        setConsentPhase("ready");
      } else if (result.status === "EXPIRED") {
        setError("The consent invite expired. Please ask your parent to confirm again.");
        setConsentPhase("collect");
      } else {
        setError(
          "Still waiting on your parent. Please make sure they've clicked the link in their email.",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    // Can't happen via the UI (validateProfile gates the only path here),
    // but narrowing it explicitly beats defaulting a real learner into the
    // wrong grade if a future edit opens another route to submit.
    if (grade === null) {
      setError("Pick your grade.");
      setStep("profile");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await completeSocialSignup({
        signupToken: pending.signupToken,
        grade,
        birthYear: Number(birthYear),
        displayName: displayName.trim(),
        email: providerEmail ? undefined : email.trim(),
        parentalConsentToken: isMinor ? (receiptToken ?? undefined) : undefined,
      });
      clearPendingSignup();
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
        {step === "profile" && (
          <View>
            <Text className="font-display text-2xl font-bold text-foreground">Almost there</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              {providerEmail
                ? `We've got you as ${providerEmail}. We just need a couple more things to pick the right lessons.`
                : "We just need a couple more things to pick the right lessons."}
            </Text>

            <View className="mt-6 gap-4">
              <Field
                label="Your name"
                value={displayName}
                onChange={setDisplayName}
                purpose="name"
              />
              {!providerEmail && (
                <Field label="Email" value={email} onChange={setEmail} purpose="email" />
              )}
              <Field
                label="Year of birth"
                value={birthYear}
                onChange={(v) => setBirthYear(v.replace(/[^0-9]/g, "").slice(0, 4))}
                purpose="birth-year"
              />
            </View>

            <Text className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">
              Which grade are you in?
            </Text>
            <View className="mt-2">
              <GradePicker value={grade} onChange={setGrade} />
            </View>

            {error && <Text className="mt-4 text-sm text-destructive">{error}</Text>}

            <View className="mt-8 gap-3">
              <Button
                label={
                  submitting ? "Setting up…" : isMinor ? "Next: parent consent" : "Start learning"
                }
                variant="primary"
                size="lg"
                fullWidth
                disabled={submitting}
                onPress={() => {
                  const v = validateProfile();
                  if (v) {
                    setError(v);
                    return;
                  }
                  setError(null);
                  if (isMinor) setStep("consent");
                  else submit();
                }}
              />
              <Button
                label="Cancel"
                variant="ghost"
                size="md"
                fullWidth
                disabled={submitting}
                onPress={() => {
                  clearPendingSignup();
                  router.replace("/");
                }}
              />
            </View>
          </View>
        )}

        {step === "consent" && consentPhase === "collect" && (
          <View>
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
                value={parentName}
                onChange={setParentName}
                purpose="other-name"
              />
              <Field
                label="Parent / guardian email"
                value={parentEmail}
                onChange={setParentEmail}
                purpose="other-email"
              />
            </View>

            <Pressable
              onPress={() => setConsentAcknowledged(!consentAcknowledged)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consentAcknowledged }}
              className="mt-5 flex-row items-start gap-3 active:opacity-70"
            >
              <View
                className={`mt-0.5 h-5 w-5 items-center justify-center rounded border-2 ${
                  consentAcknowledged ? "border-primary bg-primary" : "border-border"
                }`}
              >
                {consentAcknowledged && (
                  <Text className="text-xs font-bold text-primary-foreground">✓</Text>
                )}
              </View>
              <Text className="flex-1 text-sm text-foreground">
                My parent or guardian has agreed I can use GoMaths and has read our privacy notice.
              </Text>
            </Pressable>

            <PrivacyNoticeLink className="ml-8" />

            {error && <Text className="mt-4 text-sm text-destructive">{error}</Text>}

            <View className="mt-8 gap-3">
              <Button
                label={submitting ? "Sending…" : "Email my parent"}
                variant="primary"
                size="lg"
                fullWidth
                disabled={submitting}
                onPress={() => {
                  if (!parentEmail.includes("@")) {
                    setError("We need a parent or guardian email.");
                    return;
                  }
                  if (!parentName.trim()) {
                    setError("We need a parent or guardian name.");
                    return;
                  }
                  if (!consentAcknowledged) {
                    setError("Please tick the consent box to continue.");
                    return;
                  }
                  sendConsentInvite();
                }}
              />
              <Button
                label="Back"
                variant="ghost"
                size="md"
                fullWidth
                disabled={submitting}
                onPress={() => setStep("profile")}
              />
            </View>
          </View>
        )}

        {step === "consent" && consentPhase === "awaiting-parent" && (
          <View>
            <Text className="font-display text-2xl font-bold text-foreground">
              Waiting for your parent
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              We've emailed <Text className="font-semibold">{parentEmail.trim()}</Text> a
              confirmation link. Ask them to open it, then tap the button below.
            </Text>

            <Card className="mt-5">
              <Text className="text-xs text-muted-foreground">
                The link expires after 7 days. Once your parent clicks it, this screen will let you
                finish setting up.
              </Text>
            </Card>

            {error && <Text className="mt-4 text-sm text-destructive">{error}</Text>}

            <View className="mt-8 gap-3">
              <Button
                label={submitting ? "Checking…" : "I've confirmed — check now"}
                variant="primary"
                size="lg"
                fullWidth
                disabled={submitting}
                onPress={checkConsent}
              />
              <Button
                label="Use a different email"
                variant="ghost"
                size="md"
                fullWidth
                disabled={submitting}
                onPress={() => setConsentPhase("collect")}
              />
            </View>
          </View>
        )}

        {step === "consent" && consentPhase === "ready" && (
          <View>
            <Text className="font-display text-2xl font-bold text-foreground">All set</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Your parent's confirmation is on file. Finish setting up to start learning.
            </Text>

            {error && <Text className="mt-4 text-sm text-destructive">{error}</Text>}

            <View className="mt-8 gap-3">
              <Button
                label={submitting ? "Setting up…" : "Start learning"}
                variant="primary"
                size="lg"
                fullWidth
                disabled={submitting}
                onPress={submit}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
