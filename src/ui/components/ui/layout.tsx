import React, {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type Align = "start" | "center" | "end" | "stretch" | "baseline";
type GapAxis = "auto" | "x" | "y";
type Justify = "start" | "center" | "between" | "end" | "around" | "evenly";
type Space = number | string;

type FlexSelfProps = {
  grow?: boolean | number;
  shrink?: boolean | number;
  basis?: CSSProperties["flexBasis"];
  minWidth?: CSSProperties["minWidth"];
  maxWidth?: CSSProperties["maxWidth"];
};

type LayoutProps = FlexSelfProps & {
  align?: Align;
  className?: string;
  gap?: Space | null;
  inline?: boolean;
  justify?: Justify;
  children: ReactNode;
};

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function spaceValue(space: Space): CSSProperties["gap"] {
  if (typeof space === "number") {
    if (space === 0) return 0;
    if (space >= 1 && space <= 6 && Number.isInteger(space)) {
      return `var(--explorer-space-${space})`;
    }
    return `${space * 0.25}em`;
  }

  return space;
}

function gapStyle(gap: Space | null | undefined): CSSProperties {
  if (gap === null) return {};
  return { gap: spaceValue(gap ?? 1) };
}

function growValue(grow: FlexSelfProps["grow"]): CSSProperties["flexGrow"] {
  if (grow == null) return undefined;
  return grow === true ? 1 : grow === false ? 0 : grow;
}

function shrinkValue(
  shrink: FlexSelfProps["shrink"],
): CSSProperties["flexShrink"] {
  if (shrink == null) return undefined;
  return shrink === true ? 1 : shrink === false ? 0 : shrink;
}

function flexSelfStyle(props: FlexSelfProps): CSSProperties {
  return {
    ...(props.grow != null && { flexGrow: growValue(props.grow) }),
    ...(props.shrink != null && { flexShrink: shrinkValue(props.shrink) }),
    ...(props.basis != null && { flexBasis: props.basis }),
    ...(props.minWidth != null && { minWidth: props.minWidth }),
    ...(props.maxWidth != null && { maxWidth: props.maxWidth }),
  };
}

const alignMap: Record<Align, CSSProperties["alignItems"]> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

const justifyMap: Record<Justify, CSSProperties["justifyContent"]> = {
  start: "flex-start",
  center: "center",
  between: "space-between",
  end: "flex-end",
  around: "space-around",
  evenly: "space-evenly",
};

export interface GroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children">,
    LayoutProps {
  wrap?: boolean | "reverse";
}

export function Group(props: GroupProps): React.JSX.Element {
  const {
    align = "center",
    basis,
    children,
    className,
    gap,
    grow,
    inline = false,
    justify = "start",
    maxWidth,
    minWidth,
    shrink,
    style,
    wrap,
    ...rest
  } = props;

  const layoutStyle: CSSProperties = {
    display: inline ? "inline-flex" : "flex",
    alignItems: alignMap[align],
    justifyContent: justifyMap[justify],
    ...gapStyle(gap),
    ...(wrap && { flexWrap: wrap === true ? "wrap" : "wrap-reverse" }),
    ...flexSelfStyle({ grow, shrink, basis, minWidth, maxWidth }),
  };

  return (
    <div
      className={cn("explorer-group", className)}
      style={{ ...layoutStyle, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface StackProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children">,
    LayoutProps {}

export function Stack(props: StackProps): React.JSX.Element {
  const {
    align = "stretch",
    basis,
    children,
    className,
    gap,
    grow,
    inline = false,
    justify = "start",
    maxWidth,
    minWidth,
    shrink,
    style,
    ...rest
  } = props;

  const layoutStyle: CSSProperties = {
    display: inline ? "inline-flex" : "flex",
    flexDirection: "column",
    alignItems: alignMap[align],
    justifyContent: justifyMap[justify],
    ...gapStyle(gap),
    ...flexSelfStyle({ grow, shrink, basis, minWidth, maxWidth }),
  };

  return (
    <div
      className={cn("explorer-stack", className)}
      style={{ ...layoutStyle, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface SpringProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children?: ReactNode;
  minWidth?: CSSProperties["minWidth"];
  weight?: number;
}

export function Spring({
  children,
  className,
  minWidth = 0,
  style,
  weight = 1,
  ...rest
}: SpringProps): React.JSX.Element {
  return (
    <div
      className={cn("spring", className)}
      style={{
        flex: `${weight} 1 0`,
        minWidth,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface SpacerProps extends Omit<SpringProps, "weight"> {
  maxWidth?: CSSProperties["maxWidth"];
}

export function Spacer({
  className,
  maxWidth = "none",
  minWidth = 0,
  style,
  ...rest
}: SpacerProps): React.JSX.Element {
  return (
    <Spring
      className={cn("spacer", className)}
      minWidth={minWidth}
      style={{ maxWidth, ...style }}
      {...rest}
    />
  );
}

export function Separator(props: { className?: string }): React.JSX.Element {
  return <div className={`explorer-separator ${props.className ?? ""}`} />;
}

export function Divider(props: {
  className?: string;
  size?: "sm" | "md" | "lg";
}): React.JSX.Element {
  const { className, size = "sm" } = props;

  return (
    <div className={`explorer-divider divider-${size} ${className ?? ""}`} />
  );
}

export function Gap({
  axis,
  className,
  inline,
  maxSize,
  size = 1,
  style,
}: {
  axis?: GapAxis;
  className?: string;
  inline?: boolean;
  maxSize?: CSSProperties["maxWidth"];
  size?: Space;
  style?: CSSProperties;
}): React.JSX.Element {
  const resolvedSize = spaceValue(size);
  const resolvedAxis = axis ?? (inline == null ? "auto" : inline ? "x" : "y");
  const sizeStyle: CSSProperties & {
    "--explorer-gap-size"?: CSSProperties["width"];
    "--explorer-gap-max-size"?: CSSProperties["width"];
  } = {
    "--explorer-gap-size": resolvedSize,
    "--explorer-gap-max-size": maxSize,
    ...(resolvedAxis === "x" && {
      width: resolvedSize,
      maxWidth: maxSize,
    }),
    ...(resolvedAxis === "y" && {
      height: resolvedSize,
      maxHeight: maxSize,
    }),
  };

  return (
    <div
      aria-hidden="true"
      className={cn("gap", `gap--${resolvedAxis}`, className)}
      style={{ ...sizeStyle, ...style }}
    />
  );
}

export function Gapper({
  className,
  maxWidth,
  size = 2,
}: {
  className?: string;
  size?: Space;
  maxWidth?: CSSProperties["maxWidth"];
}): React.JSX.Element {
  return (
    <Gap className={cn("gapper", className)} maxSize={maxWidth} size={size} />
  );
}
