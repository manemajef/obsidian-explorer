import React, { type HTMLAttributes } from "react";
import { cn } from "./cn";

export type TextRole = "title" | "body" | "description" | "metadata" | "label";
export type TextEmphasis =
  | "primary"
  | "secondary"
  | "tertiary"
  | "faint"
  | "accent";
export type TextWeight = "medium" | "bold";
export type TextSize = "xs" | "sm" | "md" | "lg";

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "role"> {
  as?: "span" | "div" | "p";
  role?: TextRole;
  emphasis?: TextEmphasis;
  /** 15% knob: overrides the role weight. */
  weight?: TextWeight;
  /** 15% knob: bumps description text one step (large cards). */
  size?: TextSize;
}

export function Text({
  as: Element = "span",
  role = "body",
  emphasis,
  weight,
  size,
  className,
  ...rest
}: TextProps): React.JSX.Element {
  return (
    <Element
      className={cn("explorer-text", className)}
      data-role={role}
      data-emphasis={emphasis}
      data-weight={weight}
      data-size={size}
      {...rest}
    />
  );
}
