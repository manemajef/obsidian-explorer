import React, { forwardRef, type ElementType, type ComponentPropsWithoutRef } from "react";
import { cn } from "./action";

export type GlassSurfaceProps<T extends ElementType = "div"> = {
  as?: T;
  shine?: boolean;
  interactive?: boolean;
  radius?: "pill" | "md" | "lg" | "circle" | string;
  className?: string;
  children?: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export const GlassSurface = forwardRef(
  <T extends ElementType = "div">(
    props: GlassSurfaceProps<T>,
    ref: any
  ) => {
    const {
      as: Component = "div",
      shine = true,
      interactive = false,
      radius,
      className,
      children,
      style,
      ...rest
    } = props;

    const radiusMap = {
      pill: "var(--explorer-radius-pill)",
      md: "var(--explorer-radius-md)",
      lg: "var(--explorer-radius-lg)",
      circle: "50%",
    };

    const resolvedRadius = radius ? (radiusMap[radius as keyof typeof radiusMap] ?? radius) : undefined;

    const finalStyle = {
      ...style,
      ...(resolvedRadius && { "--explorer-glass-radius": resolvedRadius }),
    };

    return (
      <Component
        ref={ref}
        className={cn(
          "glass-surface",
          shine && "glass-surface--shine",
          interactive && "glass-surface--interactive",
          className
        )}
        style={finalStyle}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);

GlassSurface.displayName = "GlassSurface";
