import {
  type CSSProperties,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
} from "react";

type SurfaceRadius = "sm" | "md" | "lg" | "pill" | "circle";
type SurfaceElevation = "none" | "sm" | "md";
type SurfaceTone = "default" | "subtle" | "raised";

type SurfaceCommonProps = {
  active?: boolean;
  children?: ReactNode;
  className?: string;
  elevation?: SurfaceElevation;
  interactive?: boolean;
  radius?: SurfaceRadius;
  radiusValue?: CSSProperties["borderRadius"];
  shine?: boolean;
  style?: CSSProperties;
  tone?: SurfaceTone;
};

export type SurfaceProps = SurfaceCommonProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof SurfaceCommonProps>;

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const radiusMap = {
  sm: "var(--explorer-radius-sm)",
  md: "var(--explorer-radius-md)",
  lg: "var(--explorer-radius-lg)",
  pill: "var(--explorer-radius-pill)",
  circle: "50%",
};

function surfaceAttrs({
  active = false,
  className,
  elevation = "md",
  interactive = false,
  radius,
  radiusValue,
  shine = true,
  style,
  tone = "default",
}: SurfaceCommonProps) {
  const resolvedRadius =
    radiusValue ?? (radius ? radiusMap[radius] : undefined);
  const finalStyle: CSSProperties & {
    "--explorer-surface-radius"?: CSSProperties["borderRadius"];
  } = {
    ...style,
    ...(resolvedRadius && { "--explorer-surface-radius": resolvedRadius }),
  };
  return {
    className: cn("explorer-surface", className),
    "data-active": active || undefined,
    "data-elevation": elevation,
    "data-interactive": interactive || undefined,
    "data-radius": radius,
    "data-shine": shine || undefined,
    "data-tone": tone,
    style: finalStyle,
  };
}

export function Surface(props: SurfaceProps): JSX.Element {
  const {
    active,
    children,
    className,
    elevation,
    interactive,
    radius,
    radiusValue,
    shine,
    style,
    tone,
    ...divProps
  } = props;

  return (
    <div
      {...divProps}
      {...surfaceAttrs({
        active,
        className,
        elevation,
        interactive,
        radius,
        radiusValue,
        shine,
        style,
        tone,
      })}
    >
      {children}
    </div>
  );
}
