import React from "react";
import { ExplorerModel } from "../../explorer/model";
import { ExplorerFileNode } from "../../explorer/lib/nodes";
import { ExplorerActions } from "../../explorer/actions";
import { Icon, InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Pin } from "./ui/pin";
import { Gapper, Group, Spacer, Stack } from "./ui/layout";
import { draggableProps, folderDropProps } from "../drag-drop";
import {
  isInteractiveTouchTarget,
  showFileContextMenu,
  type ContextMenuConfig,
} from "../context-menu";
import { FolderTimeRow, NoteTags, NotePreview } from "./ui/note-metadata";

export function CardsView(props: {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  extForCard: string;
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
}): React.JSX.Element {
  const { model, files, actions, contextMenu } = props;

  return (
    <div className="explorer-cards-view">
      <div className="explorer-cards-grid">
        {files.map((file) => (
          <div key={file.path}>
            <div
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
              <Stack>
                <Group className="explorer-card-header">
                  <div
                    className={`explorer-card-link ${model.pluginSettings.useLinkColorInCard ? "explorer-card-link--accent" : "explorer-card-link--normal"}`}
                  >
                    <Group>
                      {file.isFolderNote && (
                        <Group className="explorer-card-ext">
                          <Icon
                            name="folder"
                            className="explorer-card-folder-note-icon"
                          />
                          <Gapper size="var(--explorer-space-1)" />
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
                  </div>

                  <span style={{ width: ".5em" }} />
                  <Spacer />

                  <div className="explorer-card-exts">
                    <div
                      className="explorer-card-pin-slot"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {file.isMarkdown && <Pin file={file} actions={actions} />}
                    </div>

                    {!file.isFolderNote && file.extensionLabel ? (
                      <Badge variant="ext" className="explorer-card-ext-badge">
                        {file.extensionLabel}
                      </Badge>
                    ) : null}
                  </div>
                </Group>
                <div className="explorer-card-preview-wrapper">
                  <NotePreview file={file} />
                </div>

                <div className="explorer-card-tags-wrapper">
                  <NoteTags file={file} model={model} />
                </div>
              </Stack>

              <div className="explorer-card-metadata-wrapper">
                <FolderTimeRow file={file} model={model} actions={actions} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
