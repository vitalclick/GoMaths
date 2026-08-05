/**
 * The labelled text input used by every auth form.
 *
 * Was copy-pasted into login, register and complete-profile, which is how
 * the password fields ended up with no way to check what you'd typed. One
 * component means the reveal toggle exists everywhere a password does.
 *
 * The toggle is text ("Show" / "Hide") rather than an eye glyph: it needs
 * no icon asset, states its own meaning, and reads correctly to a screen
 * reader without a label that contradicts the picture. It only renders for
 * `secure` fields, so nothing changes for the ordinary ones.
 */

import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Masks the value and adds the show/hide toggle. */
  secure?: boolean;
  keyboard?: "default" | "email-address" | "numeric";
}

export function Field({ label, value, onChange, secure, keyboard }: FieldProps) {
  const [revealed, setRevealed] = useState(false);

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
          keyboardType={keyboard ?? "default"}
          autoCapitalize="none"
          autoCorrect={false}
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
