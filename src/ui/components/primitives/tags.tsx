import React from "react";
import { cn } from "./cn";

export type TagSize = "xs" | "sm" | "md";
export type TagOverflow = "scroll" | "hidden" | "wrap";

export function Tag(props: {
  className?: string;
  size?: TagSize;
  children: React.ReactNode;
}): React.JSX.Element {
  const { className, size = "sm", children } = props;
  return (
    <span
      className={cn(
        "explorer-tag",
        "value-list-item",
        "value-list-item-tag",
        className,
      )}
      data-size={size}
    >
      <a className="tag explorer-tag__label">{children}</a>
    </span>
  );
}

export function TagList(props: {
  tags: string[];
  className?: string;
  overflow?: TagOverflow;
  size?: TagSize;
}): React.JSX.Element | null {
  const { tags, className, overflow = "scroll", size = "sm" } = props;
  if (tags.length === 0) return null;
  return (
    <div
      className={cn("explorer-tags", className)}
      data-overflow={overflow}
      data-size={size}
    >
      <div className="explorer-tags__row">
        {tags.map((tag, index) => (
          <Tag key={`${tag}-${index}`} size={size}>
            {tag}
          </Tag>
        ))}
      </div>
    </div>
  );
}
