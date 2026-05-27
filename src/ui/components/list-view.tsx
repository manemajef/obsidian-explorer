import React from "react";
import { Platform } from "obsidian";
import { FileInfo } from "../../types";
import { ExplorerModel } from "../../explorer/model";
import { InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Group } from "./ui/layout";
import { Pin } from "./ui/pin";
import Bar from "./ui/bar";
import { isFolderNote } from "../../explorer/file-utils";
import {
  draggableProps,
  fileDragSource,
  fileDropTarget,
  folderDropProps,
  MoveIntoFolder,
} from "../drag-drop";
import { showFileContextMenu, type ContextMenuConfig } from "../context-menu";

type ListViewProps = {
  model: ExplorerModel;
  files: FileInfo[];
  onMoveIntoFolder: MoveIntoFolder;
  contextMenu: ContextMenuConfig;
};

export function ListView(props: ListViewProps): React.JSX.Element {
  const { files } = props;
  const n = files.length;
  if (n == 0) return <div></div>;

  if (Platform.isMobile) {
    return <MobileListView {...props} />;
  }

  const { app, settings } = props.model;

  return (
    <div className="explorer-list-container">
      {files.map((fileInfo, i) => (
        <div key={fileInfo.file.path} className="list-item-container">
          <li
            className={`explorer-list${fileInfo.isPinned ? " pinned" : ""}`}
            {...draggableProps(
              fileDragSource(fileInfo.file),
              isFolderNote(fileInfo.file),
            )}
            {...folderDropProps(
              app,
              fileDropTarget(fileInfo.file),
              props.onMoveIntoFolder,
            )}
            onContextMenuCapture={(event) =>
              showFileContextMenu(event, props.contextMenu, fileInfo.file)
            }
            style={{
              marginInlineStart:
                settings.showListBullets && !fileInfo.isPinned
                  ? "var(--explorer-space-4)"
                  : "none",
              display: fileInfo.isPinned ? "flex" : "block",
            }}
          >
            {fileInfo.isPinned ? (
              <span
                className={`explorer-list-pin${settings.showListBullets ? " with-bullets" : ""}`}
              >
                <Pin fileInfo={fileInfo} />
              </span>
            ) : (
              settings.showListBullets && <span className="list-bullet" />
            )}

            <Group justify="start">
              <InternalLink
                path={fileInfo.file.path}
                draggable={false}
                text={
                  fileInfo.file.extension === "md"
                    ? fileInfo.file.basename
                    : `${fileInfo.file.basename}.${fileInfo.file.extension}`
                }
              />
              {fileInfo.tags && fileInfo.tags.length > 0 && (
                <span className="list-tags-seperator" />
              )}
              <div className="explorer-list-tags">
                {settings.showTags &&
                  fileInfo.tags?.map((t) => (
                    <Badge key={t} variant="tag">
                      {t}
                    </Badge>
                  ))}
              </div>
              {(fileInfo.file.extension !== "md" ||
                isFolderNote(fileInfo.file)) && (
                <>
                  <Bar.Spring />
                  {isFolderNote(fileInfo.file) ? (
                    <Badge
                      variant="ext-filled"
                      className="explorer-folder-type-badge"
                    >
                      folder
                    </Badge>
                  ) : (
                    <Badge variant="ext-filled">
                      {fileInfo.file.extension}
                    </Badge>
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
  const { app, settings } = model;

  return (
    <div className="explorer-mobile-list ">
      {files.map((fileInfo, i) => (
        <div key={fileInfo.file.path} className="explorer-mobile-list-item">
          <div
            className={`explorer-mobile-note${fileInfo.isPinned ? " pinned" : ""}${i >= files.length - 1 ? " explorer-mobile-note-last" : ""}`}
            {...draggableProps(
              fileDragSource(fileInfo.file),
              isFolderNote(fileInfo.file),
            )}
            {...folderDropProps(
              app,
              fileDropTarget(fileInfo.file),
              props.onMoveIntoFolder,
            )}
            onContextMenuCapture={(event) =>
              showFileContextMenu(event, props.contextMenu, fileInfo.file)
            }
          >
            <div className="explorer-mobile-note__header">
              <Group>
                <Pin fileInfo={fileInfo} />
                <InternalLink
                  path={fileInfo.file.path}
                  className="explorer-mobile-note__title"
                  draggable={false}
                  text={
                    fileInfo.file.extension === "md"
                      ? fileInfo.file.basename
                      : `${fileInfo.file.basename}.${fileInfo.file.extension}`
                  }
                />
              </Group>

              {(fileInfo.file.extension !== "md" ||
                isFolderNote(fileInfo.file)) && (
                <Badge
                  variant="ext-filled"
                  className="explorer-mobile-note__ext"
                >
                  {isFolderNote(fileInfo.file)
                    ? "folder"
                    : fileInfo.file.extension}
                </Badge>
              )}
            </div>

            <div className="explorer-mobile-note__footer">
              <div className="explorer-mobile-note__tags">
                {settings.showTags &&
                  fileInfo.tags?.map((t) => (
                    <Badge key={t} variant="tag">
                      {t}
                    </Badge>
                  ))}
              </div>
              {/* <Pin fileInfo={fileInfo} /> */}
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
