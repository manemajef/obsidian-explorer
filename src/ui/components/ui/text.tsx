import React, { type HTMLAttributes, type ReactNode } from "react";

type SmallTone = "muted" | "faint" | "normal" | "accent";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export interface SmallProps extends HTMLAttributes<HTMLElement> {
  as?: "span" | "div";
  children: ReactNode;
  tone?: SmallTone;
}

/** Small print: smaller, lighter, tighter, muted by default. */
export function Small({
  as: Element = "span",
  children,
  className,
  tone = "muted",
  ...props
}: SmallProps): React.JSX.Element {
  return (
    <Element
      className={cn("explorer-small", `explorer-small--${tone}`, className)}
      {...props}
    >
      {children}
    </Element>
  );
}
