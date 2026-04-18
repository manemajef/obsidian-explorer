/**
 * Shared action controls for the explorer plugin.
 * Toggle the glass variant with the `glass` prop.
 */
import {
  forwardRef,
  useEffect,
  useRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { setIcon } from "obsidian";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function ActionIcon({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (ref.current) setIcon(ref.current, name);
  }, [name]);
  return <span ref={ref} className="action-icon" />;
}

type ActionItemVariantProps = {
  icon: string;
  active?: boolean;
  glass?: boolean;
};

export interface ActionItemProps extends Omit<
  HTMLAttributes<HTMLButtonElement>,
  "children"
>,
  ActionItemVariantProps {}

export const ActionItem = forwardRef<HTMLButtonElement, ActionItemProps>(
  ({ icon, active, glass = false, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "clickable-icon clickable-icon-normal action-item circle hover-scale",
        glass && "glass",
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
  glass?: boolean;
}

export const ActionGroup = forwardRef<HTMLDivElement, ActionGroupProps>(
  ({ children, glass = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("action-group pill hover-scale", glass && "glass", className)}
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
    className={cn(
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
