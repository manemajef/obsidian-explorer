import React from "react";
import { ExplorerFileNode } from "src/explorer/lib/nodes";
import { ExplorerModel } from "src/explorer/model";
import { ExplorerActions } from "src/explorer/actions";
import { diffDays } from "src/utils";
import { cn } from "../primitives/cn";
import { Icon } from "../primitives/icon";
import { Group } from "../primitives/layout";
import { Text } from "../primitives/text";
import { useNotePreview } from "./use-note-preview";

const MEETA_TEXT_EMPH = "tertiary";

type NoteMetadataProps = {
  file: ExplorerFileNode;
  model: ExplorerModel;
  className?: string;
};

type NoteMetadataWithActionsProps = NoteMetadataProps & {
  actions: ExplorerActions;
};

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
}: NoteMetadataProps): React.JSX.Element | null {
  const date = getNoteDate(file, model);

  if (date == null) return null;

  return (
    <Text
      role="metadata"
      emphasis={MEETA_TEXT_EMPH}
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
}: NoteMetadataWithActionsProps): React.JSX.Element | null {
  const parentFolder = getParentFolder(file, model);
  if (!parentFolder) return null;

  return (
    <Text
      role="metadata"
      emphasis={MEETA_TEXT_EMPH}
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
}: {
  separator?: "dot" | "line";
}): React.JSX.Element {
  if (!separator || separator === "dot")
    return (
      <Text
        role="metadata"
        emphasis={MEETA_TEXT_EMPH}
        className="explorer-metadata-separator--dot"
      >
        •
      </Text>
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
}: NoteMetadataWithActionsProps): React.JSX.Element | null {
  return (
    <NoteFolderDatePreview
      file={file}
      model={model}
      actions={actions}
      className={cn("explorer-metadata-folder-time-row", className)}
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
  size,
}: {
  file: ExplorerFileNode;
  className?: string;
  maxChar?: number;
  size?: "md";
}): React.JSX.Element | null {
  const effectiveMaxChar = maxChar ?? 100;
  const { isLoading, preview, hasPreview } = useNotePreview(file, {
    maxChar: effectiveMaxChar,
  });

  if (!isLoading && !hasPreview) return null;

  return (
    <Text
      role="description"
      emphasis={MEETA_TEXT_EMPH}
      size={size}
      className={cn("explorer-metadata-preview", className)}
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
}: NoteMetadataProps & {
  maxChar?: number;
  showPreview?: boolean;
}): React.JSX.Element | null {
  return (
    <NoteFolderDatePreview
      file={file}
      model={model}
      className={cn("explorer-metadata-date-preview-row", className)}
      maxChar={maxChar}
      folder={false}
      date
      preview={showPreview}
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
}: NoteMetadataProps & {
  actions?: ExplorerActions;
  maxChar?: number;
  folder?: boolean;
  date?: boolean;
  preview?: boolean;
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
        <NoteFolder file={file} model={model} actions={actions} />
      )}
      {showFolder && (showDate || showNotePreview) && <NoteMetadataSeparator />}
      {showDate && <NoteDate file={file} model={model} />}
      {showDate && showNotePreview && <NoteMetadataSeparator />}
      {showNotePreview && (
        <Text
          role="description"
          emphasis="secondary"
          className="explorer-metadata-preview"
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
