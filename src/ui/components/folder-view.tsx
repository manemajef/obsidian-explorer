import React from "react";
import { ExplorerFolderNode } from "../../explorer/nodes";
import { ExplorerActions } from "../../explorer/actions";
import { shouldCreateMissingFolderNote } from "../../explorer/folder-notes";
import { draggableProps, folderDropProps } from "../drag-drop";
import { InternalLink } from "./shared";
import {
  isInteractiveTouchTarget,
  showFolderContextMenu,
  type ContextMenuConfig,
} from "../context-menu";

const LONG_FOLDER_NAME_LENGTH = 20;

export function FolderButtons(props: {
  folders: ExplorerFolderNode[];
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
}): React.JSX.Element {
  const { folders, actions, contextMenu } = props;
  const isSparse = folders.length < 3;

  return (
    <div
      className={`explorer-folders-grid explorer-folders-view${isSparse ? " explorer-folders-grid--sparse" : ""}`}
    >
      {folders.map((folder) => {
        const existingNote = folder.folderNote;
        const isMissing = !existingNote;
        const folderNotePath = existingNote
          ? existingNote.path
          : folder.folderNotePath;
        const linkText = folder.displayName;
        const isLongName = linkText.length > LONG_FOLDER_NAME_LENGTH;
        const linkCreatesFolderNote =
          !isMissing ||
          shouldCreateMissingFolderNote(actions.settings, "explicit");

        return (
          <div
            key={folderNotePath}
            className={`explorer-folder-card${isLongName ? " explorer-folder-card--long-name" : ""}${isMissing ? " explorer-folder-card--missing" : ""}`}
            {...draggableProps(folder.folder)}
            {...folderDropProps(
              actions.app,
              folder.folder,
              (sourcePath, target, fromFolderNote) =>
                actions.movePathIntoFolder(sourcePath, target, fromFolderNote),
            )}
            onContextMenuCapture={(event) =>
              showFolderContextMenu(event, contextMenu, folder)
            }
            onClick={(e) => {
              if (isInteractiveTouchTarget(e.target)) return;
              void actions.openFolder(folder, e.ctrlKey || e.metaKey);
            }}
          >
            {linkCreatesFolderNote ? (
              <InternalLink
                path={folderNotePath}
                className="explorer-folder-link"
                additionalClasses={
                  isMissing
                    ? ["is-unresolved", "explorer-folder-link--missing"]
                    : undefined
                }
                draggable={false}
                tooltip={
                  isMissing ? `Create folder note ${folder.name}.md` : undefined
                }
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void actions.openFolderLink(folder, e.ctrlKey || e.metaKey);
                }}
              >
                {linkText}
              </InternalLink>
            ) : (
              <span className="explorer-folder-link explorer-folder-link--missing">
                {linkText}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
