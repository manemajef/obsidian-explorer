import React from "react";
import { ExplorerActions } from "../../explorer/actions";
import { ExplorerFileNode } from "../../explorer/lib/nodes";
import { ExplorerModel } from "../../explorer/model";
import { InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { TagList } from "./ui/tags";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function NoteTitle({
  file,
  actions,
  className,
  decoration,
  text = file.displayName,
  tone,
  variant = "note-title",
  weight,
}: {
  file: ExplorerFileNode;
  actions: ExplorerActions;
  className?: string;
  decoration?: React.ComponentProps<typeof InternalLink>["decoration"];
  text?: string;
  tone?: React.ComponentProps<typeof InternalLink>["tone"];
  variant?: React.ComponentProps<typeof InternalLink>["variant"];
  weight?: React.ComponentProps<typeof InternalLink>["weight"];
}): React.JSX.Element {
  return (
    <InternalLink
      path={file.path}
      className={className}
      decoration={decoration}
      draggable={false}
      text={text}
      tone={tone}
      variant={variant}
      weight={weight}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void actions.openFile(file, event.ctrlKey || event.metaKey);
      }}
    />
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
    <Badge
      variant={filled ? "ext-filled" : "ext"}
      className={className}
      size="sm"
    >
      {file.extensionLabel}
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
  overflow?: React.ComponentProps<typeof TagList>["overflow"];
  size?: React.ComponentProps<typeof TagList>["size"];
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
