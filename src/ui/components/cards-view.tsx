import React from "react";
import { Platform } from "obsidian";
import { ExplorerModel } from "../../explorer/model";
import { ExplorerFileNode } from "../../explorer/lib/nodes";
import { ExplorerActions } from "../../explorer/actions";
import type { ContextMenuConfig } from "../context-menu";
import { fileInteractionProps } from "./interactions";
import { cn } from "./primitives/cn";
import { Group, Spacer } from "./primitives/layout";
import { NoteFolderDate, NotePreview } from "./note/note-metadata";
import {
  NoteExtensionBadge,
  NoteTags,
  NoteTitle,
  Pin,
} from "./note/note-parts";

interface NoteCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

function NoteCard({
  interactive,
  className,
  children,
  ...rest
}: NoteCardProps): React.JSX.Element {
  return (
    <div
      className={cn("explorer-note-card", className)}
      data-interactive={interactive || undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardsView(props: {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
}): React.JSX.Element {
  const { model, files, actions, contextMenu } = props;
  const isMobile = Platform.isMobile;

  let compact = model.settings.compactCards;
  if (isMobile && model.settings.adaptToMobile) compact = false;
  const compactMobile = isMobile && compact;
  const titleSize = isMobile
    ? compactMobile
      ? "smaller"
      : "small"
    : compact
      ? "smaller"
      : "small";
  const titleDensity = compact ? "tight" : undefined;

  return (
    <div
      className="explorer-cards"
      data-compact={compact || undefined}
      data-variant={isMobile ? "mobile" : "desktop"}
    >
      <div className="explorer-cards__grid">
        {files.map((file) => {
          const showTags = model.settings.showTags && file.tags.length > 0;

          return (
            <NoteCard
              key={file.path}
              className="explorer-file-card"
              interactive
              {...fileInteractionProps(file, actions, contextMenu)}
            >
              <Group align="start" className="explorer-file-card__header">
                <Group align="start" minWidth={0}>
                  <NoteTitle
                    file={file}
                    actions={actions}
                    className="explorer-file-card__title"
                    variant="title"
                    density={titleDensity}
                    size={titleSize}
                    color="normal"
                    weight={compact ? "medium" : "semibold"}
                    text={file.basename}
                    underline="none"
                  />
                </Group>

                <Spacer />

                <Group
                  className="explorer-file-card__badges"
                  gap={1}
                  shrink={false}
                  onClick={(e) => e.stopPropagation()}
                >
                  <NoteExtensionBadge
                    file={file}
                    className="explorer-file-card__ext"
                    filled={false}
                  />
                  {file.isPinned && (
                    <div className="explorer-file-card__pin-slot">
                      <Pin file={file} actions={actions} placement="card" />
                    </div>
                  )}
                </Group>
              </Group>
              <Spacer />
              {model.settings.showPreviews && (
                <div className="explorer-file-card__preview-wrap">
                  <NotePreview
                    file={file}
                    className="explorer-file-card__preview"
                    maxChar={compact ? 120 : 200}
                    lines={compact ? 2 : 3}
                  />
                </div>
              )}
              {showTags && (
                <>
                  <Spacer minWidth={0} />
                  <NoteTags
                    file={file}
                    model={model}
                    className="explorer-file-card__tags"
                    overflow="scroll"
                    size={compact ? (isMobile ? "xs" : "sm") : "md"}
                  />
                </>
              )}
              <Spacer />
              <div className="explorer-file-card__metadata">
                <NoteFolderDate file={file} model={model} actions={actions} />
              </div>
            </NoteCard>
          );
        })}
      </div>
    </div>
  );
}
