/**
 * Edit the two profile fields a learner can change themselves.
 *
 * Grade is the one that actually matters over time — a returning learner
 * moving up a year had no way to reflect that anywhere in the app before
 * this screen existed. Display name comes along for the same UI for free.
 *
 * Email/password and parent/teacher profile editing are deliberately out
 * of scope here — those touch the auth security surface (re-verification)
 * rather than plain profile data, and the parent/teacher apps have no
 * editable fields of their own yet.
 */

import { Button } from "@gomaths/ui";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Field } from "../components/Field";
import { GradePicker, type GradeValue } from "../components/GradePicker";
import { useAuth } from "../lib/auth";

export default function EditProfileScreen() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [grade, setGrade] = useState<GradeValue | null>(
    (user?.grade as GradeValue | undefined) ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // `user` hydrates asynchronously from storage — on a direct nav to this
  // route (a reload, a deep link) it's still null on first render, and the
  // useState initializers above only run once. Sync once it arrives so the
  // form doesn't open with an empty name and no grade selected.
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setGrade((user.grade as GradeValue | undefined) ?? null);
    }
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!user) return null;

  const dirty = displayName.trim() !== user.displayName || grade !== user.grade;

  const save = async () => {
    if (!displayName.trim()) {
      setError("Tell us your name.");
      return;
    }
    if (grade === null) {
      setError("Pick your grade.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await updateProfile({ displayName: displayName.trim(), grade });
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text className="font-display text-2xl font-bold text-foreground">Edit profile</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Moving up a grade? Update it here so your lessons match.
        </Text>

        <View className="mt-6 gap-4">
          <Field label="Your name" value={displayName} onChange={setDisplayName} purpose="name" />
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
            label={submitting ? "Saving…" : "Save"}
            variant="primary"
            size="lg"
            fullWidth
            disabled={submitting || !dirty}
            onPress={save}
          />
          <Button
            label="Cancel"
            variant="ghost"
            size="md"
            fullWidth
            disabled={submitting}
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
