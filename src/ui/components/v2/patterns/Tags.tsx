import React from "react";
import { Badge } from "../primitives";

type TagProps = {
  children: React.ReactNode;
};

type TagListProps = {
  tags: string[];
  maxRows?: 1 | 2;
};

export function Tag({ children }: TagProps): React.JSX.Element {
  return (
    <Badge variant="soft" className="ex-tag value-list-item value-list-item-tag">
      <a className="tag ex-tag-label">{children}</a>
    </Badge>
  );
}

export function TagList({
  tags,
  maxRows = 1,
}: TagListProps): React.JSX.Element | null {
  if (tags.length === 0) return null;

  return (
    <div className="ex-tag-list" data-max-rows={maxRows}>
      {tags.map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </div>
  );
}
