import React, {
  PropsWithChildren,
} from "react";

/* ────────────────────────────────
   Bar
──────────────────────────────── */

type BarProps = PropsWithChildren<{
  className?: string;
}>;

export function Bar({ children, className }: BarProps) {
  return (
    <div className={`bar ${className ?? ""}`}>
      {children}
    </div>
  );
}

/* ────────────────────────────────
   Item (fixed)
──────────────────────────────── */

type ItemProps = PropsWithChildren<{
  minWidth?: number;
  className?: string;
}>;

function Item({ children, minWidth = 24, className }: ItemProps) {
  return (
    <div className={`bar-item ${className ?? ""}`} style={{ minWidth }}>
      {children}
    </div>
  );
}

/* ────────────────────────────────
   Spring (flexible)
──────────────────────────────── */

type SpringProps = PropsWithChildren<{
  weight?: number;
  minWidth?: number;
  className?: string;
}>;

function Spring({
  children,
  weight = 1,
  minWidth = 0,
  className,
}: SpringProps) {
  return (
    <div
      className={`bar-spring ${className ?? ""}`}
      style={{
        flexGrow: weight,
        minWidth,
      }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────
   Attach subcomponents
──────────────────────────────── */

Bar.Item = Item;
Bar.Spring = Spring;

export default Bar;
