import React from "react";
import { ExplorerFileNode } from "src/explorer/lib/nodes";
import { ExplorerModel } from "src/explorer/model";
import { ExplorerActions } from "src/explorer/actions";
import { resolveCardFooterMode } from "src/explorer/lib/listing";
import { diffDays } from "src/utils";
import { Icon } from "../shared";
import { Group } from "./layout";
import { TagList, type TagSize } from "./tags";
import { Small } from "./text";
import { Preview } from "./preview";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function MetaDate({
  date,
  className,
}: {
  date: number;
  className?: string;
}) {
  return (
    <Small className={cn("explorer-metadata-date", className)}>
      {diffDays(date)}
    </Small>
  );
}

export function MetaFolder({
  file,
  model,
  actions,
  className,
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  actions: ExplorerActions;
  className?: string;
}) {
  const parentFolder = file.parentExplorerFolder;
  if (!parentFolder || parentFolder === model.folder) return null;

  return (
    <Small
      as="span"
      className={cn("explorer-metadata-folder-link", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void actions.openFolder(parentFolder, e.ctrlKey || e.metaKey);
      }}
    >
      {model.pluginSettings.ShowIconsInCards && (
        <Icon name="folder-closed" className="explorer-metadata-folder-icon" />
      )}
      <span className="explorer-metadata-folder-name">{parentFolder.name}</span>
    </Small>
  );
}

export function MetaSeparator(): React.JSX.Element {
  return <span className="explorer-metadata-separator" aria-hidden="true" />;
}

export function MetaTextSeparator({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn("explorer-metadata-text-separator", className)}
    />
  );
}

export function MetaTime({
  file,
  model,
  className,
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  className?: string;
}) {
  const { settings } = model;
  const extForCard = resolveCardFooterMode(settings);

  if (extForCard === "none") return null;

  const parentFolder = file.parentExplorerFolder;
  const showFolder = parentFolder && parentFolder !== model.folder;

  const showTime = extForCard !== "none";
  const isCtime = extForCard === "ctime";
  const dateVal = isCtime ? file.createdAt : file.modifiedAt;

  return (
    <Group
      className={cn("explorer-metadata-folder-time-row", className)}
      gap={0}
      wrap
    >
      {showFolder && showTime && <MetaSeparator />}
      {showTime && <MetaDate date={dateVal} />}
    </Group>
  );
}

export function MetaFolderDate({
  file,
  model,
  actions,
  className,
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  actions: ExplorerActions;
  className?: string;
}) {
  const { settings } = model;
  const extForCard = resolveCardFooterMode(settings);

  if (extForCard === "none") return null;

  const parentFolder = file.parentExplorerFolder;
  const showFolder = parentFolder && parentFolder !== model.folder;

  const showTime = extForCard !== "none";
  const isCtime = extForCard === "ctime";
  const dateVal = isCtime ? file.createdAt : file.modifiedAt;

  return (
    <Group
      className={cn("explorer-metadata-folder-time-row", className)}
      gap={0}
      wrap
    >
      {showFolder && <MetaFolder file={file} model={model} actions={actions} />}
      {showFolder && showTime && <MetaSeparator />}
      {showTime && <MetaDate date={dateVal} />}
    </Group>
  );
}

export function FolderTimeRow(props: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  actions: ExplorerActions;
  className?: string;
}) {
  return (
    <MetaFolderDate
      file={props.file}
      model={props.model}
      actions={props.actions}
      className={props.className}
    />
  );
}

export function NoteTags({
  file,
  model,
  className,
  size = "sm",
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  className?: string;
  size?: TagSize;
}) {
  const { settings } = model;
  if (!settings.showTags || !file.tags || file.tags.length === 0) return null;

  return (
    <div className={cn("explorer-metadata-tags-row", className)}>
      <TagList
        tags={file.tags}
        className="explorer-metadata-tags"
        size={size}
      />
    </div>
  );
}

export function NotePreview({
  file,
  className,
  maxChar,
}: {
  file: ExplorerFileNode;
  className?: string;
  maxChar?: number;
}) {
  return (
    <Small as="span" className={cn("explorer-metadata-preview", className)}>
      <Preview file={file} maxChar={maxChar} />
    </Small>
  );
}

export function NoteMetadata({
  file,
  model,
  actions,
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  actions: ExplorerActions;
}) {
  return <MetaFolderDate file={file} model={model} actions={actions} />;
}
