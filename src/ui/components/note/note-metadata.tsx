import React from "react";
import { ExplorerFileNode } from "src/explorer/lib/nodes";
import { ExplorerModel } from "src/explorer/model";
import { ExplorerActions } from "src/explorer/actions";
import { diffDays } from "src/utils";
import { cn } from "../primitives/cn";
import { Icon } from "../primitives/icon";
import { Group } from "../primitives/layout";
import { Text, type TextSize } from "../primitives/text";
import { useNotePreview } from "./use-note-preview";

const METADATA_COLOR = "muted";

type NoteMetadataProps = {
  file: ExplorerFileNode;
  model: ExplorerModel;
  className?: string;
  /** Optional per-element size override; prefer the metadata default first. */
  size?: TextSize;
};

type NoteMetadataWithActionsProps = NoteMetadataProps & {
  actions: ExplorerActions;
};

type NotePreviewLines = 1 | 2 | 3;

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
  size,
}: NoteMetadataProps): React.JSX.Element | null {
  const date = getNoteDate(file, model);

  if (date == null) return null;

  return (
    <Text
      variant="metadata"
      color={METADATA_COLOR}
      size={size}
      className={cn("explorer-metadata-date", className)}
    >
      {diffDays(date)}
    </Text>
  );
}

export function NoteFolder({
  file,
  model,
  actions,
  className,
  size,
}: NoteMetadataWithActionsProps): React.JSX.Element | null {
  const parentFolder = getParentFolder(file, model);
  if (!parentFolder) return null;

  return (
    <Text
      variant="metadata"
      color={METADATA_COLOR}
      size={size}
      className={cn("explorer-metadata-folder-link", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void actions.openFolder(parentFolder, e.ctrlKey || e.metaKey);
      }}
    >
      <Icon name="folder-closed" className="explorer-metadata-folder-icon" />
      <span className="explorer-metadata-folder-name">{parentFolder.name}</span>
    </Text>
  );
}

function NoteMetadataSeparator({
  separator,
  size,
}: {
  separator?: "dot" | "line";
  size?: TextSize;
}): React.JSX.Element {
  if (!separator || separator === "dot")
    return (
      <Text
        as="span"
        variant="metadata"
        color={METADATA_COLOR}
        size={size}
        aria-hidden="true"
        className="explorer-metadata-separator--dot"
      />
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
  size,
}: NoteMetadataWithActionsProps): React.JSX.Element | null {
  return (
    <NoteFolderDatePreview
      file={file}
      model={model}
      actions={actions}
      className={cn("explorer-metadata-folder-time-row", className)}
      size={size}
      folder
      date
      preview={false}
    />
  );
}

export function NotePreview({
  file,
  className,
  maxChar,
  lines = 1,
  size,
}: {
  file: ExplorerFileNode;
  className?: string;
  maxChar?: number;
  lines?: NotePreviewLines;
  size?: TextSize;
}): React.JSX.Element | null {
  const effectiveMaxChar = maxChar ?? 100;
  const { isLoading, preview, hasPreview } = useNotePreview(file, {
    maxChar: effectiveMaxChar,
  });

  if (!isLoading && !hasPreview) return null;

  return (
    <Text
      variant="metadata"
      color={METADATA_COLOR}
      size={size}
      className={cn("explorer-metadata-preview", className)}
      data-lines={lines}
      data-loading={isLoading || undefined}
    >
      {isLoading ? (
        <span className="explorer-preview-placeholder">
          {"W".repeat(effectiveMaxChar)}
        </span>
      ) : (
        preview
      )}
    </Text>
  );
}

export function NoteDatePreview({
  file,
  model,
  className,
  maxChar,
  showPreview = true,
  previewLines,
  size,
}: NoteMetadataProps & {
  maxChar?: number;
  showPreview?: boolean;
  previewLines?: NotePreviewLines;
}): React.JSX.Element | null {
  return (
    <NoteFolderDatePreview
      file={file}
      model={model}
      className={cn("explorer-metadata-date-preview-row", className)}
      maxChar={maxChar}
      size={size}
      folder={false}
      date
      preview={showPreview}
      previewLines={previewLines}
    />
  );
}

export function NoteFolderDatePreview({
  file,
  model,
  actions,
  className,
  maxChar,
  folder = true,
  date = true,
  preview = true,
  previewLines = 1,
  size,
}: NoteMetadataProps & {
  actions?: ExplorerActions;
  maxChar?: number;
  folder?: boolean;
  date?: boolean;
  preview?: boolean;
  previewLines?: NotePreviewLines;
}): React.JSX.Element | null {
  const effectiveMaxChar = maxChar ?? 100;
  const showFolder =
    folder && actions != null && getParentFolder(file, model) != null;
  const showDate = date && getNoteDate(file, model) != null;
  const {
    isLoading,
    preview: previewText,
    hasPreview,
  } = useNotePreview(file, {
    maxChar: effectiveMaxChar,
    enabled: preview,
  });
  const showNotePreview = preview && (isLoading || hasPreview);

  if (!showFolder && !showDate && !showNotePreview) return null;

  return (
    <Group
      className={cn("explorer-metadata-folder-date-preview-row", className)}
      gap={0}
    >
      {showFolder && actions && (
        <NoteFolder
          file={file}
          model={model}
          actions={actions}
          size={size}
        />
      )}
      {showFolder && (showDate || showNotePreview) && (
        <NoteMetadataSeparator size={size} />
      )}
      {showDate && <NoteDate file={file} model={model} size={size} />}
      {showDate && showNotePreview && <NoteMetadataSeparator size={size} />}
      {showNotePreview && (
        <Text
          variant="metadata"
          color="muted"
          size={size}
          className="explorer-metadata-preview"
          data-lines={previewLines}
          data-loading={isLoading || undefined}
        >
          {isLoading ? (
            <span className="explorer-preview-placeholder">
              {"W".repeat(effectiveMaxChar)}
            </span>
          ) : (
            previewText
          )}
        </Text>
      )}
    </Group>
  );
}
