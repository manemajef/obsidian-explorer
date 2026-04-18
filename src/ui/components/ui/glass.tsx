import { forwardRef } from "react";
import {
  ActionGroup,
  ActionGroupItem,
  ActionItem,
  type ActionGroupProps,
  type ActionGroupItemProps,
  type ActionItemProps,
} from "./action";

export type GlassItemProps = Omit<ActionItemProps, "glass">;
export type GlassGroupProps = Omit<ActionGroupProps, "glass">;
export type GlassGroupItemProps = Omit<ActionGroupItemProps, "glass">;

export const GlassItem = forwardRef<HTMLButtonElement, GlassItemProps>(
  (props, ref) => <ActionItem ref={ref} glass {...props} />,
);
GlassItem.displayName = "GlassItem";

export const GlassGroup = forwardRef<HTMLDivElement, GlassGroupProps>(
  (props, ref) => <ActionGroup ref={ref} glass {...props} />,
);
GlassGroup.displayName = "GlassGroup";

export const GlassGroupItem = forwardRef<
  HTMLButtonElement,
  GlassGroupItemProps
>((props, ref) => <ActionGroupItem ref={ref} {...props} />);
GlassGroupItem.displayName = "GlassGroupItem";
