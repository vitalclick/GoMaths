/**
 * The labelled text input used by every auth form.
 *
 * Was copy-pasted into login, register and complete-profile, which is how
 * the password fields ended up with no way to check what you'd typed. One
 * component means the reveal toggle exists everywhere a password does.
 *
 * The toggle is text ("Show" / "Hide") rather than an eye glyph: it needs
 * no icon asset, states its own meaning, and reads correctly to a screen
 * reader without a label that contradicts the picture.
 *
 * `purpose` is the only knob a caller normally touches. It drives autofill,
 * capitalisation, the keyboard and masking together, because those four
 * always agree — a field that offers to fill a saved password is also the
 * field that should be masked and never auto-capitalised. Setting them
 * one-by-one at each call site is how they drift apart.
 */

import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

export type FieldPurpose =
  | "name"
  | "email"
  | "current-password"
  | "new-password"
  | "birth-year"
  /** Someone else's name/email — shaped the same, but never autofilled. */
  | "other-name"
  | "other-email";

interface PurposeSpec {
  /** Android autofill hint. iOS values differ, hence the split. */
  android: TextInputProps["autoComplete"];
  /** iOS autofill hint. Ignored on Android. */
  ios: TextInputProps["textContentType"];
  keyboard: "default" | "email-address" | "numeric";
  autoCapitalize: "none" | "words";
  secure?: boolean;
}

/**
 * The two hint sets are not interchangeable — Android wants
 * `password` / `password-new`, iOS wants `password` / `newPassword` — so
 * each platform is given a value it actually accepts rather than one
 * spelling being forced on both.
 *
 * The `other-*` purposes exist for the parent/guardian fields. They must
 * not offer the learner's own saved name and email: a consent record
 * autofilled with the child's address is worse than an empty box, so
 * autofill is off while the keyboard and capitalisation still fit.
 */
const PURPOSES: Record<FieldPurpose, PurposeSpec> = {
  name: { android: "name", ios: "name", keyboard: "default", autoCapitalize: "words" },
  email: {
    android: "email",
    ios: "emailAddress",
    keyboard: "email-address",
    autoCapitalize: "none",
  },
  "current-password": {
    android: "password",
    ios: "password",
    keyboard: "default",
    autoCapitalize: "none",
    secure: true,
  },
  "new-password": {
    android: "password-new",
    ios: "newPassword",
    keyboard: "default",
    autoCapitalize: "none",
    secure: true,
  },
  "birth-year": {
    android: "birthdate-year",
    ios: "none",
    keyboard: "numeric",
    autoCapitalize: "none",
  },
  "other-name": { android: "off", ios: "none", keyboard: "default", autoCapitalize: "words" },
  "other-email": {
    android: "off",
    ios: "none",
    keyboard: "email-address",
    autoCapitalize: "none",
  },
};

const NO_PURPOSE: PurposeSpec = {
  android: "off",
  ios: "none",
  keyboard: "default",
  autoCapitalize: "none",
};

export interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** What this field holds. Drives autofill, keyboard, capitalisation, masking. */
  purpose?: FieldPurpose;
}

export function Field({ label, value, onChange, purpose }: FieldProps) {
  const [revealed, setRevealed] = useState(false);
  const spec = purpose ? PURPOSES[purpose] : NO_PURPOSE;
  const secure = spec.secure ?? false;

  return (
    <View>
      <Text className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Text>
      {/* The border moves to this row so the toggle sits inside the field
          rather than next to it — the input keeps its own padding. */}
      <View className="mt-1 flex-row items-center rounded-2xl border border-border bg-card">
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure && !revealed}
          keyboardType={spec.keyboard}
          autoCapitalize={spec.autoCapitalize}
          autoCorrect={false}
          // Left undefined off Android rather than passed through: the
          // accepted values differ per platform, and iOS autofill is driven
          // by textContentType anyway.
          autoComplete={Platform.OS === "android" ? spec.android : undefined}
          textContentType={spec.ios}
          className="flex-1 px-4 py-3 text-base text-foreground"
        />
        {secure && (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            accessibilityRole="button"
            // Says what the tap does, not what the field currently is —
            // "Show password" is the action, and it's what a screen-reader
            // user is choosing between.
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            accessibilityState={{ selected: revealed }}
            hitSlop={8}
            className="px-4 py-3 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-foreground">
              {revealed ? "Hide" : "Show"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
