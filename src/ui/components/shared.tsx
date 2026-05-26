import React, { useEffect, useRef } from "react";
import { setIcon } from "obsidian";

export function InternalLink(props: {
  path: string;
  text?: string;
  className?: string;
  additionalClasses?: string[];
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  children?: React.ReactNode;
  draggable?: boolean;
}): React.JSX.Element {
  const {
    path,
    text,
    className,
    additionalClasses,
    onClick,
    children,
    draggable,
  } = props;
  const classes = ["internal-link", className, ...(additionalClasses ?? [])]
    .filter(Boolean)
    .join(" ");

  return (
    <a
      className={classes}
      data-href={path}
      href={path}
      data-tooltip-position="top"
      onClick={onClick}
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
