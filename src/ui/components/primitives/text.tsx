import React, { type HTMLAttributes, type ReactNode } from "react";
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
export type TextDensity = "compact" | "comfortable";

export interface TextScopeProps extends HTMLAttributes<HTMLElement> {
  as?: "span" | "div";
  density?: TextDensity;
  children: ReactNode;
}

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "role"> {
  as?: "span" | "div" | "p";
  role?: TextRole;
  emphasis?: TextEmphasis;
  /** 15% knob: overrides the role weight. */
  weight?: TextWeight;
  /** 15% knob: overrides the role size for narrow responsive cases. */
  size?: TextSize;
}

export function TextScope({
  as: Element = "div",
  density,
  className,
  children,
  ...rest
}: TextScopeProps): React.JSX.Element {
  return (
    <Element
      className={cn("explorer-text-scope", className)}
      data-density={density}
      {...rest}
    >
      {children}
    </Element>
  );
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
