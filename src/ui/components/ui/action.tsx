/**
 * Action UI components for the explorer plugin.
 * Self-contained — renders icons via Obsidian's setIcon.
 * Pair with action-bar.css (imported via index.css).
 */
import {
  forwardRef,
  useEffect,
  useRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { setIcon } from "obsidian";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function ActionIcon({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (ref.current) setIcon(ref.current, name);
  }, [name]);
  return <span ref={ref} className="action-icon" />;
}

export interface ActionItemProps extends Omit<
  HTMLAttributes<HTMLButtonElement>,
  "children"
> {
  icon: string;
  active?: boolean;
}

export const ActionItem = forwardRef<HTMLButtonElement, ActionItemProps>(
  ({ icon, active, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cx(
        "clickable-icon clickable-icon-normal action-item circle hover-scale",
        active && "action-item--active",
        className,
      )}
      {...props}
    >
      <ActionIcon name={icon} />
    </button>
  ),
);
ActionItem.displayName = "ActionItem";

export interface ActionGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const ActionGroup = forwardRef<HTMLDivElement, ActionGroupProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cx("action-group pill hover-scale", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
ActionGroup.displayName = "ActionGroup";

export interface ActionGroupItemProps extends Omit<
  HTMLAttributes<HTMLButtonElement>,
  "children"
> {
  icon: string;
  active?: boolean;
}

export const ActionGroupItem = forwardRef<
  HTMLButtonElement,
  ActionGroupItemProps
>(({ icon, active, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cx(
      "clickable-icon clickable-icon-normal action-group-item",
      active && "action-group-item--active",
      className,
    )}
    {...props}
  >
    <ActionIcon name={icon} />
  </button>
));
ActionGroupItem.displayName = "ActionGroupItem";
