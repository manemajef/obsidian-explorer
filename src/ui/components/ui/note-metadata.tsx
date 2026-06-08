import React from "react";
import { ExplorerFileNode } from "src/explorer/lib/nodes";
import { ExplorerModel } from "src/explorer/model";
import { ExplorerActions } from "src/explorer/actions";
import { diffDays } from "src/utils";
import { Icon } from "../shared";
import { Group } from "./layout";
import { Small } from "./text";
import { useNotePreview } from "./preview";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function getParentFolder(file: ExplorerFileNode, model: ExplorerModel) {
  const parentFolder = file.parentExplorerFolder;
  return parentFolder && parentFolder !== model.folder ? parentFolder : null;
}

function getNoteDate(
  file: ExplorerFileNode,
  model: ExplorerModel,
): number | null {
  if (["newest", "oldest"].includes(model.settings.sortBy))
    return file.createdAt;
  return file.modifiedAt;
}

export function NoteDate({
  file,
  model,
  className,
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  className?: string;
}): React.JSX.Element | null {
  const date = getNoteDate(file, model);

  if (date == null) return null;

  return (
    <Small className={cn("explorer-metadata-date", className)}>
      {diffDays(date)}
    </Small>
  );
}

export function NoteFolder({
  file,
  model,
  actions,
  className,
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  actions: ExplorerActions;
  className?: string;
}): React.JSX.Element | null {
  const parentFolder = getParentFolder(file, model);
  if (!parentFolder) return null;

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

function NoteMetadataSeparator({
  separator,
}: {
  separator?: "dot" | "line";
}): React.JSX.Element {
  if (!separator || separator === "dot")
    return (
      <Small as="span" className="explorer-metadata-separator--dot">
        •
      </Small>
    );
  return (
    <span className="explorer-metadata-separator" aria-hidden="true"></span>
  );
}

export function NoteFolderDate({
  file,
  model,
  actions,
  className,
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  actions: ExplorerActions;
  className?: string;
}): React.JSX.Element | null {
  const showFolder = getParentFolder(file, model) != null;
  const showDate = getNoteDate(file, model) != null;

  if (!showFolder && !showDate) return null;

  return (
    <Group
      className={cn("explorer-metadata-folder-time-row", className)}
      gap={0}
      wrap
    >
      {showFolder && <NoteFolder file={file} model={model} actions={actions} />}
      {showFolder && showDate && <NoteMetadataSeparator />}
      {showDate && <NoteDate file={file} model={model} />}
    </Group>
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
  const effectiveMaxChar = maxChar ?? 100;
  const { isLoading, preview, hasPreview } = useNotePreview(file, {
    maxChar: effectiveMaxChar,
  });

  if (!isLoading && !hasPreview) return null;

  return (
    <Small as="span" className={cn("explorer-metadata-preview", className)}>
      {isLoading ? (
        <span className="explorer-preview-placeholder">
          {"W".repeat(effectiveMaxChar)}
        </span>
      ) : (
        preview
      )}
    </Small>
  );
}

export function NoteDatePreview({
  file,
  model,
  className,
  maxChar,
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  className?: string;
  maxChar?: number;
}): React.JSX.Element | null {
  const showDate = getNoteDate(file, model) != null;
  const { preview, hasPreview } = useNotePreview(file, { maxChar });

  if (!showDate && !hasPreview) return null;

  return (
    <Group
      className={cn("explorer-metadata-date-preview-row", className)}
      gap={0}
    >
      {showDate && <NoteDate file={file} model={model} />}
      {showDate && hasPreview && <NoteMetadataSeparator />}
      {hasPreview && (
        <Small as="span" className="explorer-metadata-preview">
          {preview}
        </Small>
      )}
    </Group>
  );
}
