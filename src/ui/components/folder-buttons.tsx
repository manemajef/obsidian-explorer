import React from "react";
import { TFolder } from "obsidian";
import { FolderInfo } from "../../types";

export function FolderButtons(props: {
  folderInfos: FolderInfo[];
  onOpenFolderNote: (folder: TFolder, newLeaf: boolean) => void;
}): React.JSX.Element {
  const { folderInfos, onOpenFolderNote } = props;

  return (
    <div className="explorer-folders-grid">
      {folderInfos.map((folderInfo) => {
        const existingNote = folderInfo.folderNote;
        const isMissing = !existingNote;
        const folderNotePath = existingNote
          ? existingNote.path
          : `${folderInfo.folder.path}/${folderInfo.folder.name}.md`;
        const linkText = folderInfo.folder.name;

        return (
          <button
            key={folderNotePath}
            className={`explorer-folder-card${isMissing ? " explorer-folder-card--missing" : ""} explorer-hover-scale`}
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenFolderNote(folderInfo.folder, e.ctrlKey || e.metaKey);
              }}
            >
              {linkText}
            </a>
          </button>
        );
      })}
    </div>
  );
}
