import React from "react";
import { App, TFile } from "obsidian";
import { removeExt } from "../../utils/helpers";
import { InternalLink } from "./shared";

export function FolderButtons(props: {
  app: App;
  sourcePath: string;
  folderNotes: TFile[];
}): JSX.Element {
  const { app, sourcePath, folderNotes } = props;

  return (
    <div className="explorer-folders-grid">
      {folderNotes.map((folderNote) => (
        <button
          key={folderNote.path}
          className="explorer-folder-card"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) return;
            app.workspace.openLinkText(folderNote.path, sourcePath, false);
          }}
        >
          <InternalLink
            app={app}
            sourcePath={sourcePath}
            path={folderNote.path}
            text={removeExt(folderNote)}
          />
        </button>
      ))}
    </div>
  );
}
