import React, { type HTMLAttributes } from "react";
import { cn } from "./cn";

export interface ListRowProps extends HTMLAttributes<HTMLDivElement> {
  /** Class for the outer shell (inline padding sits there so the
   * separator hairline stays inset). */
  shellClassName?: string;
  interactive?: boolean;
  last?: boolean;
}

export function ListRow({
  shellClassName,
  interactive,
  last,
  className,
  children,
  ...rest
}: ListRowProps): React.JSX.Element {
  return (
    <div className={cn("explorer-list-row-shell", shellClassName)}>
      <div
        className={cn("explorer-list-row", className)}
        data-interactive={interactive || undefined}
        data-last={last || undefined}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}
