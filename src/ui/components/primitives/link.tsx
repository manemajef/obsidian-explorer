import React, { useEffect, useRef, type AnchorHTMLAttributes } from "react";
import { setTooltip } from "obsidian";
import { cn } from "./cn";
import type { TextEmphasis, TextRole, TextWeight } from "./text";

export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "role" | "href"> {
  path: string;
  role?: TextRole;
  emphasis?: TextEmphasis;
  weight?: TextWeight;
  underline?: "none" | "hover" | "always";
  hoverEmphasis?: "primary" | "accent";
  tooltip?: string;
  unresolved?: boolean;
}

/** An internal-link anchor that participates in the text recipe. */
export function Link({
  path,
  role = "body",
  emphasis,
  weight,
  underline = "hover",
  hoverEmphasis,
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
      data-role={role}
      data-emphasis={emphasis}
      data-weight={weight}
      data-underline={underline}
      data-hover-emphasis={hoverEmphasis}
      data-href={path}
      href={path}
      data-tooltip-position="top"
      {...rest}
    >
      {children}
    </a>
  );
}
