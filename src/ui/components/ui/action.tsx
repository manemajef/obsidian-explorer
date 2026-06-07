/**
 * Shared action controls for the explorer plugin.
 * Visual mode is controlled by the root explorer container classes.
 */
import {
  forwardRef,
  useEffect,
  useRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { setIcon } from "obsidian";
import { GlassSurface } from "./glass";

export function cn(...classes: (string | false | null | undefined)[]) {
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
  shine?: boolean;
};

export interface ActionItemProps
  extends
    Omit<HTMLAttributes<HTMLButtonElement>, "children">,
    ActionItemVariantProps {}

export const ActionItem = forwardRef<HTMLButtonElement, ActionItemProps>(
  ({ icon, active, shine = true, className, ...props }, ref) => (
    <GlassSurface
      ref={ref}
      as="button"
      type="button"
      shine={shine}
      interactive
      className={cn(
        "action-item clickable-icon",
        active && "action-item--active",
        className,
      )}
      {...props}
    >
      <ActionIcon name={icon} />
    </GlassSurface>
  ),
);
ActionItem.displayName = "ActionItem";

export interface ActionGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  shine?: boolean;
}

export const ActionGroup = forwardRef<HTMLDivElement, ActionGroupProps>(
  ({ children, shine = true, className, ...props }, ref) => (
    <GlassSurface
      ref={ref}
      as="div"
      shine={shine}
      radius="pill"
      className={cn("action-group", className)}
      {...props}
    >
      {children}
    </GlassSurface>
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
      "clickable-icon action-group-item",
      active && "action-group-item--active",
      className,
    )}
    {...props}
  >
    <ActionIcon name={icon} />
  </button>
));
ActionGroupItem.displayName = "ActionGroupItem";

export const ActionSpace = ({
  minWidth,
  maxWidth,
}: {
  minWidth?: string;
  maxWidth?: string;
}) => {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: minWidth ?? "0px",
        maxWidth: maxWidth ?? "64px",
      }}
    />
  );
};
