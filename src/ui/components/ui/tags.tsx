import React from "react";

export type TagSize = "xs" | "sm" | "md";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Tag(props: {
  className?: string;
  size?: TagSize;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { className, size = "sm", style, children } = props;
  return (
    <span
      className={cn(
        "explorer-tag",
        "value-list-item",
        "value-list-item-tag",
        className,
      )}
      data-tag-size={size}
      style={style}
    >
      <a className="tag explorer-tag__label">{children}</a>
    </span>
  );
}

export function TagsContainer(props: {
  className?: string;
  overflow?: "scroll" | "hidden" | "wrap";
  size?: TagSize;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const {
    className,
    overflow = "scroll",
    size = "sm",
    style,
    children,
  } = props;
  return (
    <div
      className={cn("tags-container", "explorer-tags", className)}
      data-tags-overflow={overflow}
      data-tags-size={size}
      style={style}
    >
      <div className="tags-container__row explorer-tags__row">{children}</div>
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
  overflow?: React.ComponentProps<typeof TagsContainer>["overflow"];
  size?: TagSize;
  style?: React.CSSProperties;
}): React.JSX.Element | null {
  const { tags, className, overflow, size = "sm", style } = props;
  if (tags.length === 0) return null;
  return (
    <BadgeScrollContainer
      className={className}
      overflow={overflow}
      size={size}
      style={style}
    >
      {tags.map((tag) => (
        <Tag key={tag} size={size}>
          {tag}
        </Tag>
      ))}
    </BadgeScrollContainer>
  );
}
