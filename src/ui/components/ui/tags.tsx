import React from "react";
import { Badge } from "./badge";

export type TagSize = "xs" | "sm" | "md";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

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
  size?: TagSize;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { className, size = "sm", style, children } = props;
  return (
    <div
      className={cn("tags-container", `tags-container--${size}`, className)}
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
  size?: TagSize;
  style?: React.CSSProperties;
}): React.JSX.Element | null {
  const { tags, className, size = "sm", style } = props;
  if (tags.length === 0) return null;
  return (
    <BadgeScrollContainer className={className} size={size} style={style}>
      {tags.map((tag) => (
        <Badge key={tag} variant="tag">
          {tag}
        </Badge>
      ))}
    </BadgeScrollContainer>
  );
}
