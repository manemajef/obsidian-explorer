import React from "react";
import { Platform } from "obsidian";
import { ExplorerModel } from "../../explorer/model";
import { ExplorerFileNode } from "../../explorer/lib/nodes";
import { ExplorerActions } from "../../explorer/actions";
import type { ContextMenuConfig } from "../context-menu";
import { fileInteractionProps } from "./interactions";
import { Card } from "./ui/card";
import { Group, Spacer } from "./ui/layout";
import { NoteFolderDate, NotePreview } from "./note-metadata";
import { NoteExtensionBadge, NoteTags, NoteTitle, Pin } from "./note-parts";

export function CardsView(props: {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
}): React.JSX.Element {
  const { model, files, actions, contextMenu } = props;

  let compact = model.settings.compactCards;
  if (Platform.isMobile && model.pluginSettings.alwaysUseModernListInMobile)
    compact = false;

  return (
    <div
      className="explorer-cards"
      data-compact={compact || undefined}
      data-variant={Platform.isMobile ? "mobile" : "desktop"}
    >
      <div className="explorer-cards__grid">
        {files.map((file) => {
          const showTags = model.settings.showTags && file.tags.length > 0;

          return (
            <Card
              key={file.path}
              className="explorer-file-card"
              interactive
              radius="card"
              surface="subtle"
              {...fileInteractionProps(file, actions, contextMenu)}
            >
              <Group align="start" className="explorer-file-card__header">
                <Group align="start" minWidth={0}>
                  <NoteTitle
                    file={file}
                    actions={actions}
                    className="explorer-file-card__title"
                    emphasis={
                      model.pluginSettings.useLinkColorInCard
                        ? "accent"
                        : "primary"
                    }
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
                  <div className="explorer-file-card__pin-slot">
                    <Pin file={file} actions={actions} placement="card" />
                  </div>
                </Group>
              </Group>
              <Spacer />
              {model.settings.showPreviews && (
                <div className="explorer-file-card__preview-wrap">
                  <NotePreview
                    file={file}
                    className="explorer-file-card__preview"
                    maxChar={compact ? 120 : 200}
                    size={!compact ? "md" : undefined}
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
                    size={compact ? "sm" : "md"}
                  />
                </>
              )}
              <Spacer />
              <div className="explorer-file-card__metadata">
                <NoteFolderDate file={file} model={model} actions={actions} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
