import React, {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "./cn";

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

export interface SpacerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children?: ReactNode;
  minWidth?: CSSProperties["minWidth"];
  maxWidth?: CSSProperties["maxWidth"];
  weight?: number;
}

/** Flexible space. Grows to push siblings apart; clamp with min/maxWidth. */
export function Spacer({
  children,
  className,
  maxWidth = "none",
  minWidth = 0,
  style,
  weight = 1,
  ...rest
}: SpacerProps): React.JSX.Element {
  return (
    <div
      className={cn("spacer", className)}
      style={{
        flex: `${weight} 1 0`,
        minWidth,
        maxWidth,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Separator(props: { className?: string }): React.JSX.Element {
  return <div className={cn("explorer-separator", props.className)} />;
}

/** Fixed-size space along one axis ("auto" follows the parent's axis). */
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
