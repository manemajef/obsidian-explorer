import React from "react";

type Justify = "start" | "center" | "between" | "end";

export function Group(props: {
  justify?: Justify;
  gap?: number;
  className?: string;
  id?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const { justify = "start", gap, className, id, children } = props;

  const justifyMap: Record<Justify, string> = {
    start: "flex-start",
    center: "center",
    between: "space-between",
    end: "flex-end",
  };

  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: justifyMap[justify],
    ...(gap != null && { gap: `${gap * 0.25}em` }),
  };

  return (
    <div id={id} className={className} style={style}>
      {children}
    </div>
  );
}

export function Stack(props: {
  gap?: number;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const { gap, className, children } = props;

  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    ...(gap != null && { gap: `${gap * 0.25}em` }),
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
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

export function Spacer(props: {
  className?: string;
  minWidth?: string;
  maxWidth?: string;
}) {
  const { className } = props;
  const minWidth = props.minWidth ?? 0;
  const maxWidth = props.maxWidth ?? "none";
  return (
    <div
      className="spacer"
      style={{ minWidth: minWidth, maxWidth: maxWidth }}
    />
  );
}

// export function Gapper(props: {
//   className?: string;
//   minWidth?: string;
//   maxWidth?: string;
// }) {
//   const className = `gapper ${props.className ?? ""}`;
//   const minWidth = props.minWidth ?? "var(--explorer-space-2)";
//   const maxWidth = props.maxWidth ?? "var(--explorer-space-2)";
//   return (
//     <div
//       className={className}
//       style={{ minWidth: minWidth, maxWidth: maxWidth }}
//     />
//   );
// }
export function Gapper({
  className,
  size = "var(--explorer-space-2)",
  maxWidth = "999px",
}: {
  className?: string;
  size?: string;
  maxWidth?: string;
}) {
  return (
    <div
      className={`gapper ${className ?? ""}`}
      style={{
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: size,
        minWidth: size,
        maxWidth,
      }}
    />
  );
}
