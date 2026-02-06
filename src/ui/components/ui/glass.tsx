/**
 * Glass UI components for the explorer plugin.
 * Self-contained — renders icons via Obsidian's setIcon.
 * Pair with shared.css (imported via index.css).
 */
import {
  forwardRef,
  useEffect,
  useRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { setIcon } from "obsidian";

/* ---- Utility ---- */
function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ---- GlassIcon — renders an Obsidian icon into a span ---- */
function GlassIcon({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (ref.current) setIcon(ref.current, name);
  }, [name]);
  return <span ref={ref} className="glass-icon" />;
}

/* ---- GlassItem — standalone glass circle button ---- */
export interface GlassItemProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, "children"> {
  icon: string;
  active?: boolean;
}

export const GlassItem = forwardRef<HTMLButtonElement, GlassItemProps>(
  ({ icon, active, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cx(
        "clickable-icon glass glass-item circle hover-scale",
        active && "glass-item--active",
        className,
      )}
      {...props}
    >
      <GlassIcon name={icon} />
    </button>
  ),
);
GlassItem.displayName = "GlassItem";

/* ---- GlassGroup — shared glass surface for multiple items ---- */
export interface GlassGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const GlassGroup = forwardRef<HTMLDivElement, GlassGroupProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cx("glass glass-group pill hover-scale", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
GlassGroup.displayName = "GlassGroup";

/* ---- GlassGroupItem — flat icon button inside a group ---- */
export interface GlassGroupItemProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, "children"> {
  icon: string;
  active?: boolean;
}

export const GlassGroupItem = forwardRef<HTMLButtonElement, GlassGroupItemProps>(
  ({ icon, active, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cx(
        "clickable-icon glass-group-item",
        active && "glass-group-item--active",
        className,
      )}
      {...props}
    >
      <GlassIcon name={icon} />
    </button>
  ),
);
GlassGroupItem.displayName = "GlassGroupItem";
