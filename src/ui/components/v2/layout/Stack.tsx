import React from "react";
import { cn } from "../utils/cn";

type Align = "start" | "center" | "end" | "stretch";
type Justify = "start" | "center" | "end" | "between";
type Gap = "none" | "xs" | "sm" | "md" | "lg";

type StackProps = {
  align?: Align;
  justify?: Justify;
  gap?: Gap;
  className?: string;
  children?: React.ReactNode;
};

export function Stack({
  align = "stretch",
  justify = "start",
  gap = "sm",
  className,
  children,
}: StackProps): React.JSX.Element {
  return (
    <div
      className={cn("ex-stack", className)}
      data-align={align}
      data-gap={gap}
      data-justify={justify}
    >
      {children}
    </div>
  );
}
