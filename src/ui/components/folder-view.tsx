import React from "react";
import { App, TFolder } from "obsidian";
import { FolderInfo } from "../../types";
import {
  draggableProps,
  folderDropProps,
  MoveIntoFolder,
} from "../drag-drop";

export function FolderButtons(props: {
  app: App;
  folderInfos: FolderInfo[];
  onOpenFolderNote: (folder: TFolder, newLeaf: boolean) => void;
  onMoveIntoFolder: MoveIntoFolder;
}): React.JSX.Element {
  const { app, folderInfos, onOpenFolderNote, onMoveIntoFolder } = props;

  return (
    <div className="explorer-folders-grid explorer-folders-view">
      {folderInfos.map((folderInfo) => {
        const existingNote = folderInfo.folderNote;
        const isMissing = !existingNote;
        const folderNotePath = existingNote
          ? existingNote.path
          : `${folderInfo.folder.path}/${folderInfo.folder.name}.md`;
        const linkText = folderInfo.folder.name;

        return (
          <div
            key={folderNotePath}
            className={`explorer-folder-card${isMissing ? " explorer-folder-card--missing" : ""}`}
            {...draggableProps(folderInfo.folder)}
            {...folderDropProps(app, folderInfo.folder, onMoveIntoFolder)}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) return;
              onOpenFolderNote(folderInfo.folder, e.ctrlKey || e.metaKey);
            }}
          >
            <a
              className={`internal-link explorer-folder-link${isMissing ? " is-unresolved explorer-folder-link--missing" : ""}`}
              data-href={folderNotePath}
              href={folderNotePath}
              data-tooltip-position="top"
              target="_blank"
              rel="noopener"
              draggable={false}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenFolderNote(folderInfo.folder, e.ctrlKey || e.metaKey);
              }}
            >
              {linkText}
            </a>
          </div>
        );
      })}
    </div>
  );
}
