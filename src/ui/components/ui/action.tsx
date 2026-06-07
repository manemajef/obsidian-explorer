/**
 * Shared action controls for the explorer plugin.
 * Visual mode is controlled by the root explorer container classes.
 */
import {
  forwardRef,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type JSX,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { setIcon } from "obsidian";
import { Surface } from "./surface";

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
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    ActionItemVariantProps {}

export function ActionItem({
  icon,
  active,
  shine = true,
  className,
  ...props
}: ActionItemProps): JSX.Element {
  return (
    <Surface
      active={active}
      shine={shine}
      interactive
      radius="circle"
      className={cn(
        "action-item",
        active && "action-item--active",
        className,
      )}
    >
      <button
        type="button"
        className="action-item-button clickable-icon"
        {...props}
      >
        <ActionIcon name={icon} />
      </button>
    </Surface>
  );
}

export interface ActionGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  shine?: boolean;
}

export function ActionGroup({
  children,
  shine = true,
  className,
  ...props
}: ActionGroupProps): JSX.Element {
  return (
    <Surface
      shine={shine}
      radius="pill"
      className={cn("action-group", className)}
      {...props}
    >
      {children}
    </Surface>
  );
}

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
