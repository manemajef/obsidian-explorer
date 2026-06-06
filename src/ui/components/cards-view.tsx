import React from "react";
import { ExplorerModel } from "../../explorer/model";
import { ExplorerFileNode } from "../../explorer/lib/nodes";
import { ExplorerActions } from "../../explorer/actions";
import { Icon, InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Pin } from "./ui/pin";
import { Gap, Group, Spacer, Spring, Stack } from "./ui/layout";
import { draggableProps, folderDropProps } from "../drag-drop";
import {
  isInteractiveTouchTarget,
  showFileContextMenu,
  type ContextMenuConfig,
} from "../context-menu";
import {
  FolderTimeRow,
  NoteTags,
  NotePreview,
  MetaDate,
  MetaTextSeparator,
} from "./ui/note-metadata";
import { Small } from "./ui/text";

export function CardsView(props: {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  extForCard: string;
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
}): React.JSX.Element {
  const { model, files, actions, contextMenu } = props;
  const shouldShowFolder = model.settings.depth > 0;

  return (
    <div className="explorer-cards-view">
      <div className="explorer-cards-grid">
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

                  <InternalLink
                    path={file.path}
                    text={file.basename}
                    draggable={false}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void actions.openFile(file, e.ctrlKey || e.metaKey);
                    }}
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
                    {file.isMarkdown && <Pin file={file} actions={actions} />}
                  </div>

                  {!file.isFolderNote && file.extensionLabel ? (
                    <Badge variant="ext" className="explorer-card-ext-badge">
                      {file.extensionLabel}
                    </Badge>
                  ) : null}
                </Group>
              </Group>
              <Spring />
              {/* <Gap size={1} /> */}
              {/* <Small as="div" className="explorer-card-preview-wrapper"> */}
              {!shouldShowFolder && (
                <>
                  <MetaDate date={file.modifiedAt} />
                  <MetaTextSeparator />
                </>
              )}

              <NotePreview file={file} />
              {/* </Small> */}

              {showTags && (
                <div className="explorer-card-tags-wrapper">
                  <NoteTags file={file} model={model} size="xs" />
                </div>
              )}
              {shouldShowFolder && (
                <>
                  <Spring />

                  <div className="explorer-card-metadata-wrapper">
                    <FolderTimeRow
                      file={file}
                      model={model}
                      actions={actions}
                    />
                  </div>
                </>
              )}
            </Stack>
          );
        })}
      </div>
    </div>
  );
}
