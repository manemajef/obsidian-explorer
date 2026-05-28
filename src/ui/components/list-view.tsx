import React from "react";
import { Platform } from "obsidian";
import { ExplorerModel } from "../../explorer/model";
import { ExplorerFileNode } from "../../explorer/nodes";
import { ExplorerActions } from "../../explorer/actions";
import { InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Group } from "./ui/layout";
import { Pin } from "./ui/pin";
import Bar from "./ui/bar";
import { draggableProps, folderDropProps } from "../drag-drop";
import { showFileContextMenu, type ContextMenuConfig } from "../context-menu";

type ListViewProps = {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
};

export function ListView(props: ListViewProps): React.JSX.Element {
  const { files } = props;
  const n = files.length;
  if (n == 0) return <div></div>;

  if (Platform.isMobile) {
    return <MobileListView {...props} />;
  }

  const { settings, pluginSettings } = props.model;

  return (
    <div className="explorer-list-container">
      {files.map((file) => (
        <div key={file.path} className="list-item-container">
          <li
            className={`explorer-list${file.isPinned ? " pinned" : ""}`}
            {...draggableProps(file.dragSource, file.dragFromFolderNote)}
            {...folderDropProps(
              props.actions.app,
              file.dropTargetFolder,
              (sourcePath, folder, fromFolderNote) =>
                props.actions.movePathIntoFolder(
                  sourcePath,
                  folder,
                  fromFolderNote,
                ),
            )}
            onContextMenuCapture={(event) =>
              showFileContextMenu(event, props.contextMenu, file)
            }
            style={{
              marginInlineStart:
                pluginSettings.showListBullets && !file.isPinned
                  ? "var(--explorer-space-4)"
                  : "none",
              display: file.isPinned ? "flex" : "block",
            }}
          >
            {file.isPinned ? (
              <span
                className={`explorer-list-pin${pluginSettings.showListBullets ? " with-bullets" : ""}`}
              >
                <Pin file={file} actions={props.actions} />
              </span>
            ) : (
              pluginSettings.showListBullets && <span className="list-bullet" />
            )}

            <Group justify="start">
              <InternalLink
                path={file.path}
                draggable={false}
                text={file.displayName}
              />
              {file.tags.length > 0 && <span className="list-tags-seperator" />}
              <div className="explorer-list-tags">
                {settings.showTags &&
                  file.tags.map((t) => (
                    <Badge key={t} variant="tag">
                      {t}
                    </Badge>
                  ))}
              </div>
              {file.extensionLabel && (
                <>
                  <Bar.Spring />
                  {file.isFolderNote ? (
                    <Badge
                      variant="ext-filled"
                      className="explorer-folder-type-badge"
                    >
                      folder
                    </Badge>
                  ) : (
                    <Badge variant="ext-filled">{file.extensionLabel}</Badge>
                  )}
                </>
              )}
            </Group>
          </li>
        </div>
      ))}
    </div>
  );
}

const MobileListView = (props: ListViewProps): React.JSX.Element => {
  const { model, files } = props;
  const { settings } = model;

  return (
    <div className="explorer-mobile-list ">
      {files.map((file, i) => (
        <div key={file.path} className="explorer-mobile-list-item">
          <div
            className={`explorer-mobile-note${file.isPinned ? " pinned" : ""}${i >= files.length - 1 ? " explorer-mobile-note-last" : ""}`}
            {...draggableProps(file.dragSource, file.dragFromFolderNote)}
            {...folderDropProps(
              props.actions.app,
              file.dropTargetFolder,
              (sourcePath, folder, fromFolderNote) =>
                props.actions.movePathIntoFolder(
                  sourcePath,
                  folder,
                  fromFolderNote,
                ),
            )}
            onContextMenuCapture={(event) =>
              showFileContextMenu(event, props.contextMenu, file)
            }
          >
            <div className="explorer-mobile-note__header">
              <Group>
                <Pin file={file} actions={props.actions} />
                <InternalLink
                  path={file.path}
                  className="explorer-mobile-note__title"
                  draggable={false}
                  text={file.displayName}
                />
              </Group>

              {file.extensionLabel && (
                <Badge
                  variant="ext-filled"
                  className="explorer-mobile-note__ext"
                >
                  {file.extensionLabel}
                </Badge>
              )}
            </div>

            <div className="explorer-mobile-note__footer">
              <div className="explorer-mobile-note__tags">
                {settings.showTags &&
                  file.tags.map((t) => (
                    <Badge key={t} variant="tag">
                      {t}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>

          {i < files.length - 1 && (
            <div className="explorer-mobile-note__divider" />
          )}
        </div>
      ))}
    </div>
  );
};
