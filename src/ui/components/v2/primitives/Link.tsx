import React, { useEffect, useRef } from "react";
import { setTooltip } from "obsidian";
import { cn } from "../utils/cn";

type InternalLinkProps = {
  path: string;
  children: React.ReactNode;
  variant?: "normal" | "strong" | "muted";
  draggable?: boolean;
  tooltip?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  onMouseOver?: React.MouseEventHandler<HTMLAnchorElement>;
  className?: string;
};

export function InternalLink({
  path,
  children,
  variant = "normal",
  draggable = false,
  tooltip,
  onClick,
  onMouseOver,
  className,
}: InternalLinkProps): React.JSX.Element {
  const ref = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (ref.current && tooltip) {
      setTooltip(ref.current, tooltip, { placement: "top" });
    }
  }, [tooltip]);

  return (
    <a
      ref={ref}
      className={cn("internal-link", "ex-link", className)}
      data-href={path}
      data-variant={variant}
      draggable={draggable}
      href={path}
      onClick={onClick}
      onMouseOver={onMouseOver}
    >
      {children}
    </a>
  );
}
