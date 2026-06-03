import React from "react";
import { Platform } from "obsidian";
import { ExplorerModel } from "../../explorer/model";
import { ExplorerFileNode } from "../../explorer/lib/nodes";
import { ExplorerActions } from "../../explorer/actions";
import { InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Group } from "./ui/layout";
import { Pin } from "./ui/pin";
import Bar from "./ui/bar";
import { draggableProps, folderDropProps } from "../drag-drop";
import {
  isInteractiveTouchTarget,
  showFileContextMenu,
  type ContextMenuConfig,
} from "../context-menu";
import { TagList } from "./ui/tags";
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
  const { settings, pluginSettings } = props.model;
  const shouldUseModernList =
    settings.listStyle === "modern" ||
    (Platform.isMobile && pluginSettings.alwaysUseModernListInMobile);

  if (shouldUseModernList) {
    return <ModernListView {...props} />;
  }
  const useBullet = settings.listStyle === "markdown";

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
                useBullet && !file.isPinned
                  ? "var(--explorer-space-4)"
                  : "none",
              display: file.isPinned ? "flex" : "block",
            }}
          >
            {file.isPinned ? (
              <span
                className={`explorer-list-pin${useBullet ? " with-bullets" : ""}`}
              >
                <Pin file={file} actions={props.actions} />
              </span>
            ) : (
              useBullet && <span className="list-bullet" />
            )}

            <Group justify="start">
              <InternalLink
                path={file.path}
                className="explorer-list-note-title"
                draggable={false}
                text={file.displayName}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void props.actions.openFile(
                    file,
                    event.ctrlKey || event.metaKey,
                  );
                }}
              />
              {settings.showTags && file.tags.length > 0 && (
                <>
                  <span className="list-tags-separator" />
                  <TagList tags={file.tags} className="explorer-list-tags" />
                </>
              )}

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

const ModernListView = (props: ListViewProps): React.JSX.Element => {
  const { model, files } = props;
  const { settings } = model;
  const isMobile = Platform.isMobile;
  const desktopClass = isMobile ? "" : " explorer-modern-list--desktop";

  return (
    <div className={`explorer-modern-list${desktopClass}`}>
      {files.map((file, i) => (
        <div key={file.path} className="explorer-modern-list-item">
          <div
            className={`explorer-modern-note${file.isPinned ? " pinned" : ""}${i >= files.length - 1 ? " explorer-modern-note-last" : ""}`}
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
            onClick={(event) => {
              if (isInteractiveTouchTarget(event.target)) return;
              void props.actions.openFile(file, event.ctrlKey || event.metaKey);
            }}
          >
            <div className="explorer-modern-note__header">
              <Group>
                <Pin file={file} actions={props.actions} />
                <InternalLink
                  path={file.path}
                  className="explorer-list-note-title explorer-modern-note__title"
                  draggable={false}
                  text={file.displayName}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void props.actions.openFile(
                      file,
                      event.ctrlKey || event.metaKey,
                    );
                  }}
                />
              </Group>
              {!isMobile && settings.showTags && file.tags.length > 0 && (
                <Group className="explorer-modern-note__desktop-tags">
                  <TagList tags={file.tags} />
                </Group>
              )}
              {file.extensionLabel && (
                <Badge
                  variant="ext-filled"
                  className="explorer-modern-note__ext"
                >
                  {file.extensionLabel}
                </Badge>
              )}
            </div>

            <div className="explorer-modern-note__footer">
              {settings.showTags && isMobile && (
                <TagList
                  tags={file.tags}
                  className="explorer-modern-note__tags"
                />
              )}
            </div>
          </div>

          {i < files.length - 1 && (
            <div className="explorer-modern-note__divider" />
          )}
        </div>
      ))}
    </div>
  );
};
