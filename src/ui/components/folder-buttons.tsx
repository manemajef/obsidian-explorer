import React from "react";
import { App, Notice, TFile } from "obsidian";
import { FolderInfo } from "../../types";
import { FOLDERNOTE_TEMPLATE } from "../../constants";

export function FolderButtons(props: {
  app: App;
  sourcePath: string;
  folderInfos: FolderInfo[];
}): JSX.Element {
  const { app, sourcePath, folderInfos } = props;

  const openOrCreateFolderNote = async (
    folderInfo: FolderInfo,
    e: React.MouseEvent,
  ): Promise<void> => {
    if (folderInfo.folderNote) {
      app.workspace.openLinkText(
        folderInfo.folderNote.path,
        sourcePath,
        e.ctrlKey || e.metaKey,
      );
      return;
    }

    const folderNotePath = `${folderInfo.folder.path}/${folderInfo.folder.name}.md`;
    const existing = app.vault.getAbstractFileByPath(folderNotePath);
    if (existing instanceof TFile) {
      app.workspace.openLinkText(
        existing.path,
        sourcePath,
        e.ctrlKey || e.metaKey,
      );
      return;
    }

    try {
      const created = await app.vault.create(
        folderNotePath,
        FOLDERNOTE_TEMPLATE,
      );
      app.workspace.openLinkText(
        created.path,
        sourcePath,
        e.ctrlKey || e.metaKey,
      );
    } catch (err) {
      new Notice(`Failed to create folder note: ${err}`);
    }
  };

  return (
    <div className="explorer-folders-grid">
      {folderInfos.map((folderInfo) => {
        const isMissing = !folderInfo.folderNote;
        const folderNotePath = isMissing
          ? `${folderInfo.folder.path}/${folderInfo.folder.name}.md`
          : folderInfo.folderNote.path;
        const linkText = folderInfo.folder.name;

        return (
        <button
          key={folderNotePath}
          className={`explorer-folder-card${isMissing ? " explorer-folder-card--missing" : ""}`}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) return;
            void openOrCreateFolderNote(folderInfo, e);
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
              void openOrCreateFolderNote(folderInfo, e);
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
