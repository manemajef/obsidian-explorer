import React from "react";
import { cn } from "../utils/cn";

type BoxProps = {
  as?: "div" | "span" | "section";
  className?: string;
  children?: React.ReactNode;
};

export function Box({
  as: Element = "div",
  className,
  children,
}: BoxProps): React.JSX.Element {
  return <Element className={cn("ex-box", className)}>{children}</Element>;
}
