import React from "react";

type Justify = "start" | "center" | "between" | "end";

export function Group(props: {
  justify?: Justify;
  gap?: number;
  className?: string;
  id?: string;
  children: React.ReactNode;
}): JSX.Element {
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
}): JSX.Element {
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

export function Separator(props: { className?: string }): JSX.Element {
  return <div className={`explorer-separator ${props.className ?? ""}`} />;
}

export function Divider(props: { className?: string }): JSX.Element {
  return <div className={`explorer-divider ${props.className ?? ""}`} />;
}
