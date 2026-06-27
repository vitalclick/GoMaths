import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";
import { cn } from "./cn";

const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-2xl active:opacity-80",
  {
    variants: {
      variant: {
        primary: "bg-primary",
        secondary: "bg-secondary",
        accent: "bg-accent",
        ai: "bg-ai",
        ghost: "bg-transparent",
        destructive: "bg-destructive",
      },
      size: {
        sm: "px-3 py-2",
        md: "px-4 py-3",
        lg: "px-6 py-4",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

const labelVariants = cva("font-semibold font-sans text-center", {
  variants: {
    variant: {
      primary: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      accent: "text-accent-foreground",
      ai: "text-ai-foreground",
      ghost: "text-foreground",
      destructive: "text-destructive-foreground",
    },
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export interface ButtonProps
  extends Omit<PressableProps, "children">,
    VariantProps<typeof buttonVariants> {
  label: string;
  /** Optional leading node (e.g. an icon). Keeps the lib icon-agnostic. */
  icon?: ReactNode;
  className?: string;
}

export function Button({ label, icon, variant, size, fullWidth, className, ...rest }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      // Mirror the visible label as accessibilityLabel so role+name matchers
      // (Playwright's getByRole, screen readers, etc.) find the Pressable
      // itself rather than only the inner Text node.
      accessibilityLabel={label}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {icon ? <View>{icon}</View> : null}
      <Text className={labelVariants({ variant, size })}>{label}</Text>
    </Pressable>
  );
}
