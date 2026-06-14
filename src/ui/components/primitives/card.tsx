import React, { type HTMLAttributes } from "react";
import { cn } from "./cn";

export type CardSurface = "base" | "subtle" | "raised" | "control";
export type CardRadius = "card" | "lg" | "md" | "btn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface;
  radius?: CardRadius;
  interactive?: boolean;
}

/** A contained block of content on a surface. */
export function Card({
  surface = "subtle",
  radius = "card",
  interactive,
  className,
  children,
  ...rest
}: CardProps): React.JSX.Element {
  return (
    <div
      className={cn("explorer-ui-card", className)}
      data-surface={surface === "base" ? undefined : surface}
      data-radius={radius}
      data-interactive={interactive || undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
