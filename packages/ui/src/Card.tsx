import { View, type ViewProps } from "react-native";
import { cn } from "./cn";

export interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, ...rest }: CardProps) {
  return (
    <View
      className={cn("rounded-2xl border border-border bg-card p-4", className)}
      {...rest}
    />
  );
}
