import React, { useEffect, useRef } from "react";
import { setIcon } from "obsidian";
import { cn } from "../utils/cn";

type IconProps = {
  name: string;
  size?: "sm" | "md" | "lg";
  muted?: boolean;
  className?: string;
};

export function Icon({
  name,
  size = "md",
  muted = false,
  className,
}: IconProps): React.JSX.Element {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (ref.current) setIcon(ref.current, name);
  }, [name]);

  return (
    <span
      ref={ref}
      className={cn("ex-icon", className)}
      data-muted={muted || undefined}
      data-size={size}
    />
  );
}
