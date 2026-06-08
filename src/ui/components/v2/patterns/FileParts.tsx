import React, { useEffect, useState } from "react";
import { Platform, TFolder } from "obsidian";
import { ExplorerActions } from "../../../../explorer/actions";
import { ExplorerFileNode } from "../../../../explorer/lib/nodes";
import { ExplorerModel } from "../../../../explorer/model";
import { diffDays } from "../../../../utils";
import { Group, Stack, Spacer } from "../layout";
import { Badge, Icon, InternalLink, PinBadge, Text } from "../primitives";
import { TagList } from "./Tags";

type FileTitleProps = {
  file: ExplorerFileNode;
  actions: ExplorerActions;
  children?: React.ReactNode;
  variant?: "card" | "list" | "folder";
  className?: string;
};

type FileMetaProps = {
  children: React.ReactNode;
};

type FileExtBadgeProps = {
  ext: string | null;
  filled?: boolean;
};

type FileCardContentProps = {
  file: ExplorerFileNode;
  model: ExplorerModel;
  actions: ExplorerActions;
};

type FileListItemContentProps = {
  file: ExplorerFileNode;
  model: ExplorerModel;
  actions: ExplorerActions;
};

export function FileTitle({
  file,
  actions,
  children = file.displayName,
  variant = "list",
  className,
}: FileTitleProps): React.JSX.Element {
  return (
    <InternalLink
      path={file.path}
      className={className}
      variant={variant === "folder" ? "normal" : "strong"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void actions.openFile(file, event.ctrlKey || event.metaKey);
      }}
    >
      {children}
    </InternalLink>
  );
}

export function FileMeta({ children }: FileMetaProps): React.JSX.Element {
  return <div className="ex-file-meta">{children}</div>;
}

export function FileExtBadge({
  ext,
  filled = true,
}: FileExtBadgeProps): React.JSX.Element | null {
  if (!ext) return null;
  return <Badge variant={filled ? "filled" : "neutral"}>{ext}</Badge>;
}

export function FileCardContent({
  file,
  model,
  actions,
}: FileCardContentProps): React.JSX.Element {
  const showTags = model.settings.showTags && file.tags.length > 0;
  const { preview, hasPreview } = useFilePreview(
    file,
    model.settings.compactCards ? 120 : 200,
  );

  return (
    <Stack
      gap="none"
      className="ex-file-card-content"
      data-compact={model.settings.compactCards || undefined}
      data-link-tone="normal"
    >
      <Group justify="between" align="start" gap="sm">
        <Group align="start" gap="xs" className="ex-file-title-group">
          {file.isFolderNote && <Icon name="folder" size="sm" muted />}
          <FileTitle file={file} actions={actions} variant="card">
            {file.basename}
          </FileTitle>
        </Group>

        <Group gap="xs" className="ex-file-actions">
          {file.isMarkdown && (
            <PinToggle
              file={file}
              actions={actions}
              className="ex-file-pin ex-file-pin--card"
            />
          )}
          {!file.isFolderNote && (
            <FileExtBadge ext={file.extensionLabel} filled={false} />
          )}
        </Group>
      </Group>

      <Spacer grow />

      {hasPreview && (
        <div style={{ maxWidth: model.settings.compactCards ? "none" : "90%", minHeight: 0 }}>
          <FilePreview preview={preview} />
        </div>
      )}

      {showTags && (
        <>
          <Spacer grow />
          <TagList tags={file.tags} maxRows={2} />
        </>
      )}

      <Spacer grow />

      <FileMetadata file={file} model={model} actions={actions} />
    </Stack>
  );
}

export function FileModernListItemContent({
  file,
  model,
  actions,
}: FileListItemContentProps): React.JSX.Element {
  return (
    <Stack gap="none" className="ex-file-list-content">
      <Group justify="between" gap="sm">
        <Group gap="xs" className="ex-file-title-group">
          {file.isMarkdown && (
            <PinToggle
              file={file}
              actions={actions}
              className="ex-file-pin ex-file-pin--row"
            />
          )}
          <FileTitle file={file} actions={actions}>
            {file.displayName}
          </FileTitle>
        </Group>
        {file.isFolderNote ? (
          <FileExtBadge ext="folder" />
        ) : (
          <FileExtBadge ext={file.extensionLabel} />
        )}
      </Group>

      <Group gap="sm" className="ex-file-list-secondary">
        <FileMetadata
          file={file}
          model={model}
          actions={actions}
          includePreview
          previewMaxChar={Platform.isMobile ? 120 : 90}
        />
        {model.settings.showTags && <TagList tags={file.tags} />}
      </Group>
    </Stack>
  );
}

export function FileMarkdownListItemContent({
  file,
  model,
  actions,
}: FileListItemContentProps): React.JSX.Element {
  const isFolderNote = file.isFolderNote;

  return (
    <Group gap="sm" className="ex-markdown-list-row">
      <Group className="ex-list-pin-slot" gap="none">
        {file.isPinned ? (
          <PinToggle file={file} actions={actions} className="ex-file-pin ex-file-pin--inline" />
        ) : (
          <Text variant="faint">•</Text>
        )}
      </Group>
      <FileTitle file={file} actions={actions}>
        {file.displayName}
      </FileTitle>
      {isFolderNote && <FileExtBadge ext="folder" filled={false} />}
      {model.settings.showTags && file.tags.length > 0 && (
        <Group gap="none" className="ex-list-tags">
          <TagList tags={file.tags} />
        </Group>
      )}
    </Group>
  );
}

function PinToggle({
  file,
  actions,
  className,
}: {
  file: ExplorerFileNode;
  actions: ExplorerActions;
  className?: string;
}): React.JSX.Element {
  return (
    <PinBadge
      active={file.isPinned}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void actions.togglePin(file);
      }}
    />
  );
}

export function useFilePreview(
  file: ExplorerFileNode,
  maxChar: number
): { preview: string | undefined; isLoading: boolean; hasPreview: boolean } {
  const [preview, setPreview] = useState<string | undefined>(file.preview);
  const [isLoading, setIsLoading] = useState<boolean>(!file.preview);

  useEffect(() => {
    let active = true;
    if (file.preview) {
      setIsLoading(false);
      return;
    }
    void file.loadPreview(maxChar).then((loadedPreview) => {
      if (active) {
        setPreview(loadedPreview);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [file, maxChar]);

  return { preview, isLoading, hasPreview: !!preview };
}

function FilePreview({
  preview,
}: {
  preview: string | undefined;
}): React.JSX.Element | null {
  if (!preview) return null;

  return (
    <Text as="div" variant="muted" className="ex-file-preview">
      {preview}
    </Text>
  );
}

function FileMetadata({
  file,
  model,
  actions,
  includePreview = false,
  previewMaxChar,
}: FileListItemContentProps & {
  includePreview?: boolean;
  previewMaxChar?: number;
}): React.JSX.Element | null {
  const parentFolder = getParentFolder(file, model);
  const date = getNoteDate(file, model);
  
  const { preview, hasPreview } = useFilePreview(file, previewMaxChar ?? 100);

  if (!parentFolder && date == null && (!includePreview || !hasPreview)) return null;

  return (
    <FileMeta>
      {parentFolder && (
        <button
          className="ex-file-folder-link"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void actions.openFolder(parentFolder, event.ctrlKey || event.metaKey);
          }}
          type="button"
        >
          {model.pluginSettings.ShowIconsInCards && (
            <Icon name="folder-closed" size="sm" muted />
          )}
          <Text variant="small" truncate>
            {parentFolder.name}
          </Text>
        </button>
      )}
      {parentFolder && date != null && <Text variant="faint">•</Text>}
      {date != null && <Text variant="small">{diffDays(date)}</Text>}
      {date != null && includePreview && hasPreview && <Text variant="faint">•</Text>}
      {includePreview && hasPreview && (
        <FilePreview preview={preview} />
      )}
    </FileMeta>
  );
}

function getParentFolder(
  file: ExplorerFileNode,
  model: ExplorerModel,
): TFolder | null {
  const parentFolder = file.parentExplorerFolder;
  return parentFolder && parentFolder !== model.folder ? parentFolder : null;
}

function getNoteDate(file: ExplorerFileNode, model: ExplorerModel): number | null {
  if (["newest", "oldest"].includes(model.settings.sortBy)) return file.createdAt;
  return file.modifiedAt;
}
