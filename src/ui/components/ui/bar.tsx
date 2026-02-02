import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  PropsWithChildren,
} from "react";
import "./bar.css";

/* ────────────────────────────────
   Context
──────────────────────────────── */

type BarContextValue = {
  width: number;
};

const BarContext = createContext<BarContextValue | null>(null);

export function useBar() {
  return useContext(BarContext);
}

/* ────────────────────────────────
   Bar
──────────────────────────────── */

type BarProps = PropsWithChildren<{
  className?: string;
}>;

export function Bar({ children, className }: BarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const obs = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });

    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <BarContext.Provider value={{ width }}>
      <div ref={ref} className={`bar ${className ?? ""}`}>
        {children}
      </div>
    </BarContext.Provider>
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
