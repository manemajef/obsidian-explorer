import React from "react";
import { Platform } from "obsidian";
import { ExplorerActions } from "../../explorer/actions";
import { ExplorerFileNode } from "../../explorer/lib/nodes";
import { ExplorerModel } from "../../explorer/model";
import type { ContextMenuConfig } from "../context-menu";
import { fileInteractionProps } from "./interactions";
import { NoteDatePreview, NoteFolderDatePreview } from "./note/note-metadata";
import {
  NoteExtensionBadge,
  NoteTags,
  NoteTitle,
  Pin,
} from "./note/note-parts";
import { cn } from "./primitives/cn";
import { Gap, Group, Spacer, Stack } from "./primitives/layout";

const TAGS_LOW = false;

interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  shellClassName?: string;
  interactive?: boolean;
  last?: boolean;
}

function ListRow({
  shellClassName,
  interactive,
  last,
  className,
  children,
  ...rest
}: ListRowProps): React.JSX.Element {
  return (
    <div className={cn("explorer-list-row-shell", shellClassName)} dir="auto">
      <div
        className={cn("explorer-list-row", className)}
        data-interactive={interactive || undefined}
        data-last={last || undefined}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}

export type ModernListViewProps = {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
};

export function ModernListView(props: ModernListViewProps): React.JSX.Element {
  const { files, model, actions, contextMenu } = props;
  const variant = Platform.isMobile ? "mobile" : "desktop";
  const isMobile = variant === "mobile";

  return (
    <Stack className="explorer-modern-list" data-variant={variant}>
      {files.map((file, i) => (
        <ListRow
          key={file.path}
          shellClassName="explorer-modern-list__shell"
          className="explorer-modern-list__row"
          interactive={isMobile}
          last={i >= files.length - 1}
          data-pinned={file.isPinned || undefined}
          {...fileInteractionProps(file, actions, contextMenu)}
        >
          <Stack
            className="explorer-modern-list__content"
            gap={isMobile && !file.hasTags ? 1 : 0}
          >
            <Group className="explorer-modern-list__primary" gap={2}>
              <div className="explorer-modern-list__title-slot">
                <Pin
                  file={file}
                  actions={actions}
                  className="explorer-modern-list__pin"
                  placement="row-leading"
                  reserveSpace={false}
                />
                <NoteTitle
                  file={file}
                  actions={actions}
                  className="explorer-modern-list__title"
                  weight={isMobile ? "semibold" : "medium"}
                  density="tight"
                />
              </div>

              <Spacer />
              {!TAGS_LOW && (
                <NoteTags
                  file={file}
                  model={model}
                  className="explorer-modern-list__tags"
                  overflow="scroll"
                  size="sm"
                />
              )}
              <NoteExtensionBadge
                file={file}
                className="explorer-modern-list__extension"
              />
            </Group>

            <Group className="explorer-modern-list__secondary" gap={2}>
              <div className="explorer-modern-list__metadata">
                {isMobile ? (
                  <NoteDatePreview
                    file={file}
                    model={model}
                    maxChar={120}
                    showPreview={model.settings.showPreviews}
                  />
                ) : (
                  <NoteFolderDatePreview
                    file={file}
                    model={model}
                    actions={actions}
                    maxChar={120}
                    showPreview={model.settings.showPreviews}
                  />
                )}
              </div>

              {!file.hasTags && <Gap size={4} />}
              {file.hasTags && !TAGS_LOW && <Gap size={2} />}
              {!isMobile && TAGS_LOW && (
                <>
                  <NoteTags
                    file={file}
                    model={model}
                    className="explorer-modern-list__tags"
                    overflow="scroll"
                    size="sm"
                  />
                </>
              )}
            </Group>
          </Stack>
        </ListRow>
      ))}
    </Stack>
  );
}
