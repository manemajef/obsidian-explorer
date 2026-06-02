import React from "react";
import { Badge } from "./badge";

export function Tag(props: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { className, style, children } = props;
  return (
    <Badge variant="tag" className={className} style={style}>
      {children}
    </Badge>
  );
}

export function TagsContainer(props: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { className, style, children } = props;
  return (
    <div
      className={`tags-container ${className ? className : ""}`}
      style={style}
    >
      <div className="tags-container__row">{children}</div>
    </div>
  );
}

export function BadgeScrollContainer(
  props: React.ComponentProps<typeof TagsContainer>,
): React.JSX.Element {
  return <TagsContainer {...props} />;
}

export function TagList(props: {
  tags: string[];
  className?: string;
  style?: React.CSSProperties;
}): React.JSX.Element | null {
  const { tags, className, style } = props;
  if (tags.length === 0) return null;
  return (
    <BadgeScrollContainer className={className} style={style}>
      {tags.map((tag) => (
        <Badge key={tag} variant="tag">
          {tag}
        </Badge>
      ))}
    </BadgeScrollContainer>
  );
}
