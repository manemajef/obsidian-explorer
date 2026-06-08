import React from "react";
import { cn } from "../utils/cn";

type BadgeProps = {
  variant?: "neutral" | "filled" | "soft" | "danger";
  size?: "sm" | "md";
  children?: React.ReactNode;
  className?: string;
};

export function Badge({
  variant = "neutral",
  size = "sm",
  children,
  className,
}: BadgeProps): React.JSX.Element {
  return (
    <span className={cn("ex-badge", className)} data-size={size} data-variant={variant}>
      {children}
    </span>
  );
}
