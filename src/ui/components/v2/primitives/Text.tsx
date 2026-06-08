import React from "react";
import { cn } from "../utils/cn";

type TextProps = {
  as?: "span" | "div" | "p";
  variant?: "body" | "small" | "muted" | "faint" | "strong" | "lead";
  truncate?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function Text({
  as: Element = "span",
  variant = "body",
  truncate = false,
  className,
  children,
}: TextProps): React.JSX.Element {
  return (
    <Element
      className={cn("ex-text", className)}
      data-truncate={truncate || undefined}
      data-variant={variant}
    >
      {children}
    </Element>
  );
}
