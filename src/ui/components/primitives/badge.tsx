import React, { type HTMLAttributes } from "react";
import { cn } from "./cn";

export type BadgeVariant = "plain" | "filled" | "bordered";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function Badge({
  variant = "plain",
  size = "sm",
  className,
  children,
  ...rest
}: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cn("explorer-badge", className)}
      data-variant={variant}
      data-size={size}
      {...rest}
    >
      {children}
    </span>
  );
}
