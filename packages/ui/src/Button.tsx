import { cva, type VariantProps } from "class-variance-authority";
import { Pressable, Text, type PressableProps } from "react-native";
import { cn } from "./cn";

const buttonVariants = cva(
  "items-center justify-center rounded-2xl active:opacity-80",
  {
    variants: {
      variant: {
        primary: "bg-primary",
        secondary: "bg-secondary",
        accent: "bg-accent",
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
  className?: string;
}

export function Button({ label, variant, size, fullWidth, className, ...rest }: ButtonProps) {
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
      <Text className={labelVariants({ variant, size })}>{label}</Text>
    </Pressable>
  );
}
