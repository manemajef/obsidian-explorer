import React from "react";
import { ExplorerActions } from "../../../explorer/actions";
import { ExplorerFileNode } from "../../../explorer/lib/nodes";
import { ExplorerModel } from "../../../explorer/model";
import { cn } from "../primitives/cn";
import { Badge } from "../primitives/badge";
import { Icon } from "../primitives/icon";
import { Link, type LinkProps } from "../primitives/link";
import { TagList, type TagOverflow, type TagSize } from "../primitives/tags";

export function NoteTitle({
  file,
  actions,
  className,
  text = file.displayName,
  ...linkProps
}: {
  file: ExplorerFileNode;
  actions: ExplorerActions;
  text?: string;
} & Omit<LinkProps, "path" | "onClick">): React.JSX.Element {
  return (
    <Link
      path={file.path}
      className={className}
      draggable={false}
      variant="title"
      {...linkProps}
      data-explorer-drag-image="title"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void actions.openFile(file, event.ctrlKey || event.metaKey);
      }}
    >
      {text}
    </Link>
  );
}

export function NoteExtensionBadge({
  file,
  className,
  filled = true,
}: {
  file: ExplorerFileNode;
  className?: string;
  filled?: boolean;
}): React.JSX.Element | null {
  if (!file.extensionLabel) return null;

  return (
    <Badge variant={filled ? "filled" : "plain"} className={className}>
      {file.isFolderNote ? "folder" : file.extensionLabel}
    </Badge>
  );
}

export function NoteTags({
  file,
  model,
  className,
  overflow,
  size = "sm",
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  className?: string;
  overflow?: TagOverflow;
  size?: TagSize;
}): React.JSX.Element | null {
  if (!model.settings.showTags || file.tags.length === 0) return null;

  return (
    <div className={cn("explorer-note-tags-row", className)}>
      <TagList
        tags={file.tags}
        className="explorer-note-tags"
        overflow={overflow}
        size={size}
      />
    </div>
  );
}

export function Pin(props: {
  file: ExplorerFileNode;
  actions: ExplorerActions;
  className?: string;
  placement?: "inline" | "row-leading" | "card";
  reserveSpace?: boolean;
}): React.JSX.Element {
  const {
    file,
    actions,
    className,
    placement = "inline",
    reserveSpace = true,
  } = props;
  if (file.isPinned)
    return (
      <span
        className={cn("explorer-pin", className)}
        data-placement={placement}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void actions.togglePin(file);
        }}
      >
        <Icon name="pin" />
      </span>
    );
  return (
    <span
      className={className}
      data-placement={placement}
      hidden={!reserveSpace}
    />
  );
}
