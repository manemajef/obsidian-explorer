import React, { PropsWithChildren } from "react";
import { Spring, type SpringProps } from "./layout";

/* ────────────────────────────────
   Bar
──────────────────────────────── */

type BarProps = PropsWithChildren<{
  className?: string;
}>;

type BarComponent = ((props: BarProps) => React.JSX.Element) & {
  Item: typeof Item;
  Spring: typeof BarSpring;
};

export const Bar = (({ children, className }: BarProps) => {
  return <div className={`bar ${className ?? ""}`}>{children}</div>;
}) as BarComponent;

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

function BarSpring({ className, ...props }: SpringProps): React.JSX.Element {
  return (
    <Spring
      className={`bar-spring ${className ?? ""}`}
      {...props}
    />
  );
}

/* ────────────────────────────────
   Attach subcomponents
──────────────────────────────── */

Bar.Item = Item;
Bar.Spring = BarSpring;

export default Bar;
