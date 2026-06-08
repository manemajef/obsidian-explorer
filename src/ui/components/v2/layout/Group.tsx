import React from "react";
import { cn } from "../utils/cn";

type Align = "start" | "center" | "end" | "stretch";
type Justify = "start" | "center" | "end" | "between";
type Gap = "none" | "xs" | "sm" | "md" | "lg";

type GroupProps = {
  align?: Align;
  justify?: Justify;
  gap?: Gap;
  wrap?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function Group({
  align = "center",
  justify = "start",
  gap = "sm",
  wrap = false,
  className,
  children,
}: GroupProps): React.JSX.Element {
  return (
    <div
      className={cn("ex-group", className)}
      data-align={align}
      data-gap={gap}
      data-justify={justify}
      data-wrap={wrap || undefined}
    >
      {children}
    </div>
  );
}
