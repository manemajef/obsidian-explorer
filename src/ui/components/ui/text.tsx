import React, {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type SmallTone = "normal" | "muted" | "faint" | "accent";
type SmallSize = "xs" | "sm" | "md";
type SmallElement = "div" | "span";

type SmallStyle = CSSProperties & {
  "--explorer-small-opacity"?: number | string;
};

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export interface SmallProps extends HTMLAttributes<HTMLElement> {
  as?: SmallElement;
  children: ReactNode;
  opacity?: number;
  size?: SmallSize;
  tone?: SmallTone;
  truncate?: boolean;
  hover?: boolean;
}

export function Small({
  as: Element = "span",
  children,
  className,
  hover = false,
  opacity,
  size = "sm",
  style,
  tone = "muted",
  truncate = false,
  ...props
}: SmallProps): React.JSX.Element {
  const smallStyle: SmallStyle = {
    ...(opacity != null && { "--explorer-small-opacity": opacity }),
    ...style,
  };

  return (
    <Element
      className={cn(
        "explorer-small",
        `explorer-small--${tone}`,
        `explorer-small--${size}`,
        hover && "explorer-small--hover",
        truncate && "explorer-small--truncate",
        className,
      )}
      style={smallStyle}
      {...props}
    >
      {children}
    </Element>
  );
}
