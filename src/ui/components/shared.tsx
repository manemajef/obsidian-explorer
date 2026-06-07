import React, { useEffect, useRef } from "react";
import { setIcon, setTooltip } from "obsidian";

type LinkVariant = "default" | "note-title" | "folder" | "card-title";
type LinkTone = "default" | "normal" | "muted" | "accent" | "inherit";
type LinkWeight = "default" | "normal" | "medium" | "bold" | "inherit";
type LinkDecoration = "default" | "none" | "hover" | "always";

export function InternalLink(props: {
  path: string;
  text?: string;
  className?: string;
  additionalClasses?: string[];
  variant?: LinkVariant;
  tone?: LinkTone;
  weight?: LinkWeight;
  decoration?: LinkDecoration;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onMouseOver?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  children?: React.ReactNode;
  draggable?: boolean;
  tooltip?: string;
}): React.JSX.Element {
  const {
    path,
    text,
    className,
    additionalClasses,
    variant = "default",
    tone = "default",
    weight = "default",
    decoration = "default",
    onClick,
    onMouseOver,
    children,
    draggable,
    tooltip,
  } = props;
  const ref = useRef<HTMLAnchorElement | null>(null);
  const managed =
    variant !== "default" ||
    tone !== "default" ||
    weight !== "default" ||
    decoration !== "default";
  const classes = [
    "internal-link",
    managed && "explorer-link",
    managed && `explorer-link--${variant}`,
    className,
    ...(additionalClasses ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (ref.current && tooltip) {
      setTooltip(ref.current, tooltip, { placement: "top" });
    }
  }, [tooltip]);

  return (
    <a
      ref={ref}
      className={classes}
      data-explorer-link={managed || undefined}
      data-link-decoration={decoration}
      data-link-tone={tone}
      data-link-variant={variant}
      data-link-weight={weight}
      data-href={path}
      href={path}
      data-tooltip-position="top"
      onClick={onClick}
      onMouseOver={onMouseOver}
      draggable={draggable}
    >
      {children ?? text}
    </a>
  );
}

export function Icon(props: {
  name: string;
  className?: string;
}): React.JSX.Element {
  const { name, className } = props;
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      setIcon(ref.current, name);
    }
  }, [name]);

  return <span ref={ref} className={className} />;
}
