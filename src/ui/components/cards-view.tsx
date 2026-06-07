import React from "react";
import { ExplorerModel } from "../../explorer/model";
import { ExplorerFileNode } from "../../explorer/lib/nodes";
import { ExplorerActions } from "../../explorer/actions";
import { Icon } from "./shared";
import { Pin } from "./ui/pin";
import { Gap, Group, Spacer, Spring, Stack } from "./ui/layout";
import { draggableProps, folderDropProps } from "../drag-drop";
import {
  isInteractiveTouchTarget,
  showFileContextMenu,
  type ContextMenuConfig,
} from "../context-menu";
import { NoteFolderDate, NotePreview } from "./ui/note-metadata";
import { cn } from "./ui/action";
import { NoteExtensionBadge, NoteTags, NoteTitle } from "./note-parts";

export function CardsView(props: {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
}): React.JSX.Element {
  const { model, files, actions, contextMenu } = props;
  const compact = model.settings.compactCards;

  return (
    <div className="explorer-cards-view">
      <div
        className={cn(
          "explorer-cards-grid",
          model.settings.compactCards && "explorer-cards-grid--compact",
        )}
      >
        {files.map((file) => {
          const showTags = model.settings.showTags && file.tags.length > 0;

          return (
            <Stack
              key={file.path}
              className="explorer-card"
              {...draggableProps(file.dragSource, file.dragFromFolderNote)}
              {...folderDropProps(
                actions.app,
                file.dropTargetFolder,
                (sourcePath, folder, fromFolderNote) =>
                  actions.movePathIntoFolder(
                    sourcePath,
                    folder,
                    fromFolderNote,
                  ),
              )}
              onContextMenuCapture={(event) =>
                showFileContextMenu(event, contextMenu, file)
              }
              onClick={(e) => {
                if (isInteractiveTouchTarget(e.target)) return;
                void actions.openFile(file, e.ctrlKey || e.metaKey);
              }}
            >
              <Group align="start" className="explorer-card-header">
                <Group
                  align="start"
                  className={`explorer-card-link ${model.pluginSettings.useLinkColorInCard ? "explorer-card-link--accent" : "explorer-card-link--normal"}`}
                  minWidth={0}
                >
                  {file.isFolderNote && (
                    <Group className="explorer-card-ext" shrink={false}>
                      <Icon
                        name="folder"
                        className="explorer-card-folder-note-icon"
                      />
                      <Gap size={1} />
                    </Group>
                  )}

                  <NoteTitle
                    file={file}
                    actions={actions}
                    text={file.basename}
                    variant="card-title"
                    // weight="medium"
                  />
                </Group>

                <Spacer />

                <Group
                  className="explorer-card-exts"
                  gap={1}
                  shrink={false}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="explorer-card-pin-slot">
                    {file.isMarkdown && (
                      <Pin file={file} actions={actions} placement="card" />
                    )}
                  </div>

                  {!file.isFolderNote && (
                    <NoteExtensionBadge
                      file={file}
                      className="explorer-card-ext-badge"
                      filled={false}
                    />
                  )}
                </Group>
              </Group>
              <Spring />
              <div style={{ maxWidth: compact ? "none" : "80%" }}>
                <NotePreview
                  file={file}
                  className={cn(
                    "explorer-card-preview",
                    compact && "explorer-card-preview--compact",
                  )}
                  maxChar={compact ? 120 : 200}
                />
              </div>
              {showTags && (
                <NoteTags
                  file={file}
                  model={model}
                  className="explorer-card-tags-wrapper"
                  overflow="scroll"
                  size="sm"
                />
              )}
              <>
                <Spring />

                <div className="explorer-card-metadata-wrapper">
                  <NoteFolderDate file={file} model={model} actions={actions} />
                </div>
              </>
            </Stack>
          );
        })}
      </div>
    </div>
  );
}
