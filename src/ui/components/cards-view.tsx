import React from "react";
import { ExplorerModel } from "../../explorer/model";
import { ExplorerFileNode } from "../../explorer/nodes";
import { ExplorerActions } from "../../explorer/actions";
import { diffDays } from "../../utils";
import { Icon, InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Pin } from "./ui/pin";
import { draggableProps, folderDropProps } from "../drag-drop";
import {
  isInteractiveTouchTarget,
  showFileContextMenu,
  type ContextMenuConfig,
} from "../context-menu";

export function CardsView(props: {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  extForCard: string;
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
}): React.JSX.Element {
  const { model, files, extForCard, actions, contextMenu } = props;
  const { settings, pluginSettings } = model;

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
                  actions.movePathIntoFolder(sourcePath, folder, fromFolderNote),
              )}
              onContextMenuCapture={(event) =>
                showFileContextMenu(event, contextMenu, file)
              }
              onClick={(e) => {
                if (isInteractiveTouchTarget(e.target)) return;
                void actions.openFile(file);
              }}
            >
              <div className="explorer-card-header">
                <div>
                  <InternalLink
                    path={file.path}
                    text={file.basename}
                    draggable={false}
                  />
                </div>
                {/* <Bar.Spring /> */}
                {/* <Bar.Item /> */}
                <span style={{ width: ".5em" }} />

                <div className="explorer-card-exts">
                  <div
                    className="explorer-card-pin-slot"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {file.isMarkdown && <Pin file={file} actions={actions} />}
                  </div>
                  {file.isFolderNote && (
                    <Icon
                      name="folder"
                      className="explorer-card-folder-note-icon"
                    />
                  )}
                  {!file.isFolderNote && file.extensionLabel ? (
                    <Badge variant="ext" className="explorer-card-ext-badge">
                      {file.extensionLabel}
                    </Badge>
                  ) : null}
                </div>
              </div>

              {settings.showTags && file.tags.length > 0 && (
                <div className="explorer-card-tags-container explorer-cards-row">
                  {file.tags.map((t) => (
                    <Badge key={t} variant="tag">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="explorer-card-footer explorer-cards-row">
                <CardFooter
                  file={file}
                  extForCard={extForCard}
                  actions={actions}
                  showIconsInCards={pluginSettings.ShowIconsInCards}
                  currentFolderPath={model.folder.path}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardFooter(props: {
  file: ExplorerFileNode;
  extForCard: string;
  showIconsInCards: boolean;
  actions: ExplorerActions;
  currentFolderPath: string;
}): React.JSX.Element | null {
  const {
    file,
    extForCard,
    showIconsInCards,
    actions,
    currentFolderPath,
  } = props;

  switch (extForCard) {
    case "ctime":
      return <span>{diffDays(file.createdAt)}</span>;
    case "mtime":
      return <span>{diffDays(file.modifiedAt)}</span>;
    case "folder": {
      const folder = file.parentExplorerFolder;
      if (!folder || !folder.name) return null;
      if (folder.path === currentFolderPath) return null;
      return (
        <span
          className="explorer-card-folder-link"
          onClick={(e) => {
            e.stopPropagation();
            void actions.openFolder(folder, e.ctrlKey || e.metaKey);
          }}
        >
          {showIconsInCards && (
            <Icon name="folder-closed" className="explorer-card-folder-icon" />
          )}

          {folder.name}
        </span>
      );
    }
    case "desc":
      if (!file.description) return null;
      return (
        <span>
          {file.description.slice(0, 60)}
          {file.description.length > 60 ? "..." : ""}
        </span>
      );
    case "none":
      return null;
  }

  return null;
}
