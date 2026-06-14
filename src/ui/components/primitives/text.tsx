import React, { type HTMLAttributes } from "react";
import { cn } from "./cn";

export type TextVariant = "title" | "metadata" | "body";
export type TextColor = "normal" | "muted" | "faint" | "accent";
export type TextWeight = "light" | "normal" | "medium" | "semibold" | "bold";
export type TextSize =
  | "smallest"
  | "smaller"
  | "small"
  | "text"
  | "ui-smaller"
  | "ui-small"
  | "ui-medium"
  | "ui-large";
export type TextDensity = "tight" | "normal";

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "role"> {
  as?: "span" | "div" | "p";
  variant?: TextVariant;
  color?: TextColor;
  density?: TextDensity;
  weight?: TextWeight;
  size?: TextSize;
}

export function Text({
  as: Element = "span",
  variant = "body",
  color,
  density,
  weight,
  size,
  className,
  ...rest
}: TextProps): React.JSX.Element {
  return (
    <Element
      className={cn("explorer-text", className)}
      data-variant={variant}
      data-color={color}
      data-density={density}
      data-weight={weight}
      data-size={size}
      {...rest}
    />
  );
}
