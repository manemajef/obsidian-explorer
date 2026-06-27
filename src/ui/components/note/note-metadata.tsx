import React from "react";
import { ExplorerFileNode } from "src/explorer/lib/nodes";
import { ExplorerModel } from "src/explorer/model";
import { ExplorerActions } from "src/explorer/actions";
import { diffDays } from "src/utils";
import { cn } from "../primitives/cn";
import { Icon } from "../primitives/icon";
import { Group, Spacer } from "../primitives/layout";
import { Text, type TextSize } from "../primitives/text";
import { useNotePreview } from "./use-note-preview";

const METADATA_COLOR = "muted";
const DEFAULT_PREVIEW_MAX_CHAR = 100;

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

type NotePreviewLines = 1 | 2 | 3 | 4;
type FolderDateSeparator = "dot" | "spacer";
type MetadataItem = React.JSX.Element | null | false;
type NotePreviewState = ReturnType<typeof useNotePreview>;

const getLocalDate = (date: number) =>
  new Intl.DateTimeFormat("default", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);

const resolveDateFormat = (model: ExplorerModel, file: ExplorerFileNode) => {
  const date = getNoteDate(file, model);
  if (date === null) return null;
  if (model.pluginSettings.datesFormat === "local") return getLocalDate(date);
  if (model.pluginSettings.datesFormat === "relative") return diffDays(date);
  const now = new Date();
  if ((now.getTime() - date) / (1000 * 60 * 60 * 24) <= 7)
    return diffDays(date);
  return getLocalDate(date);
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
  size,
}: NoteMetadataProps): React.JSX.Element | null {
  const date = resolveDateFormat(model, file);

  if (date == null) return null;

  return (
    <Text
      variant="metadata"
      color={METADATA_COLOR}
      size={size}
      className={cn("explorer-metadata-date", className)}
    >
      {date}
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
  size,
}: {
  size?: TextSize;
}): React.JSX.Element {
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
}

function NoteMetadataRow({
  className,
  items,
  previewVisible,
  size,
}: {
  className: string;
  items: MetadataItem[];
  previewVisible?: boolean;
  size?: TextSize;
}): React.JSX.Element | null {
  const visibleItems = items.filter(Boolean);
  if (visibleItems.length === 0) return null;

  return (
    <Group
      className={className}
      gap={0}
      data-has-preview={previewVisible || undefined}
    >
      {visibleItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <NoteMetadataSeparator size={size} />}
          {item}
        </React.Fragment>
      ))}
    </Group>
  );
}

function PreviewText({
  className,
  maxChar,
  previewState,
  lines = 1,
  size,
}: {
  className?: string;
  maxChar: number;
  previewState: NotePreviewState;
  lines?: NotePreviewLines;
  size?: TextSize;
}): React.JSX.Element | null {
  const { isLoading, preview, hasPreview } = previewState;

  if (!isLoading && !hasPreview) return null;

  return (
    <Text
      variant="metadata"
      color={METADATA_COLOR}
      size={size}
      className={cn("explorer-metadata-preview", className)}
      dir="auto"
      data-lines={lines}
      data-loading={isLoading || undefined}
    >
      {isLoading ? (
        <span className="explorer-preview-placeholder">
          {"W".repeat(maxChar)}
        </span>
      ) : (
        preview
      )}
    </Text>
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
  if (!file.isMarkdown) return null;
  const effectiveMaxChar = maxChar ?? DEFAULT_PREVIEW_MAX_CHAR;
  const previewState = useNotePreview(file, { maxChar: effectiveMaxChar });

  return (
    <PreviewText
      className={className}
      maxChar={effectiveMaxChar}
      previewState={previewState}
      lines={lines}
      size={size}
    />
  );
}

export function NoteFolderDate({
  file,
  model,
  actions,
  className,
  separator = "dot",
  size,
}: NoteMetadataWithActionsProps & {
  separator?: FolderDateSeparator;
}): React.JSX.Element | null {
  const folder = getParentFolder(file, model) ? (
    <NoteFolder file={file} model={model} actions={actions} size={size} />
  ) : null;
  const date = getNoteDate(file, model) != null ? (
    <NoteDate file={file} model={model} size={size} />
  ) : null;

  if (separator === "spacer" && folder && date) {
    return (
      <Group
        className={cn("explorer-metadata-folder-time-row", className)}
        gap={0}
        justify="between"
      >
        {folder}
        <Spacer />
        {date}
      </Group>
    );
  }

  return (
    <NoteMetadataRow
      className={cn("explorer-metadata-folder-time-row", className)}
      size={size}
      items={[folder, date]}
    />
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
  const effectiveMaxChar = maxChar ?? DEFAULT_PREVIEW_MAX_CHAR;
  const previewEnabled = showPreview && file.isMarkdown;
  const previewState = useNotePreview(file, {
    maxChar: effectiveMaxChar,
    enabled: previewEnabled,
  });
  const date = getNoteDate(file, model) != null ? (
    <NoteDate file={file} model={model} size={size} />
  ) : null;
  const showNotePreview =
    previewEnabled && (previewState.isLoading || previewState.hasPreview);
  const preview = showNotePreview ? (
    <PreviewText
      maxChar={effectiveMaxChar}
      previewState={previewState}
      lines={previewLines}
      size={size}
    />
  ) : null;

  return (
    <NoteMetadataRow
      className={cn("explorer-metadata-date-preview-row", className)}
      size={size}
      previewVisible={showNotePreview}
      items={[date, preview]}
    />
  );
}

export function NoteFolderDatePreview({
  file,
  model,
  actions,
  className,
  maxChar,
  showPreview = true,
  previewLines = 1,
  size,
}: NoteMetadataWithActionsProps & {
  maxChar?: number;
  showPreview?: boolean;
  previewLines?: NotePreviewLines;
}): React.JSX.Element | null {
  const effectiveMaxChar = maxChar ?? DEFAULT_PREVIEW_MAX_CHAR;
  const previewEnabled = showPreview && file.isMarkdown;
  const previewState = useNotePreview(file, {
    maxChar: effectiveMaxChar,
    enabled: previewEnabled,
  });
  const folder = getParentFolder(file, model) ? (
    <NoteFolder file={file} model={model} actions={actions} size={size} />
  ) : null;
  const date = getNoteDate(file, model) != null ? (
    <NoteDate file={file} model={model} size={size} />
  ) : null;
  const showNotePreview =
    previewEnabled && (previewState.isLoading || previewState.hasPreview);
  const preview = showNotePreview ? (
    <PreviewText
      maxChar={effectiveMaxChar}
      previewState={previewState}
      lines={previewLines}
      size={size}
    />
  ) : null;

  return (
    <NoteMetadataRow
      className={cn("explorer-metadata-folder-date-preview-row", className)}
      size={size}
      previewVisible={showNotePreview}
      items={[folder, date, preview]}
    />
  );
}
