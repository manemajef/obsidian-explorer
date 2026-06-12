import React, { useEffect, useRef } from "react";
import { setIcon } from "obsidian";
import { cn } from "./cn";

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

  return <span ref={ref} className={cn("explorer-icon", className)} />;
}
