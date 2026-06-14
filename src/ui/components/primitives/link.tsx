import React, { useEffect, useRef, type AnchorHTMLAttributes } from "react";
import { setTooltip } from "obsidian";
import { cn } from "./cn";
import type {
  TextColor,
  TextDensity,
  TextSize,
  TextVariant,
  TextWeight,
} from "./text";

export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "role" | "href"> {
  path: string;
  variant?: TextVariant;
  color?: TextColor;
  density?: TextDensity;
  weight?: TextWeight;
  size?: TextSize;
  underline?: "none" | "hover" | "always";
  tooltip?: string;
  unresolved?: boolean;
}

/** An internal-link anchor that participates in the text recipe. */
export function Link({
  path,
  variant,
  color,
  density,
  weight,
  size,
  underline = "hover",
  tooltip,
  unresolved,
  className,
  children,
  ...rest
}: LinkProps): React.JSX.Element {
  const ref = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (ref.current && tooltip) {
      setTooltip(ref.current, tooltip, { placement: "top" });
    }
  }, [tooltip]);

  return (
    <a
      ref={ref}
      className={cn(
        "internal-link",
        "explorer-link",
        "explorer-text",
        unresolved && "is-unresolved",
        className,
      )}
      data-variant={variant ?? "body"}
      data-color={color}
      data-density={density}
      data-weight={weight}
      data-size={size}
      data-underline={underline}
      data-href={path}
      href={path}
      data-tooltip-position="top"
      {...rest}
    >
      {children}
    </a>
  );
}
