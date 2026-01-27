import React from "react";
import { App, TFile } from "obsidian";
import { FileInfo } from "../../types";
import { diffDays } from "../../utils/helpers";
import { isFolderNote } from "../../utils/file-utils";
import { Icon, InternalLink } from "./shared";

export function CardsView(props: {
  app: App;
  sourcePath: string;
  files: FileInfo[];
  extForCard: string;
}): JSX.Element {
  const { app, sourcePath, files, extForCard } = props;

  return (
    <>
      {files.map((fileInfo) => (
        <div key={fileInfo.file.path}>
          <div
            className="explorer-card"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) return;
              app.workspace.openLinkText(fileInfo.file.path, sourcePath, false);
            }}
          >
            <div className="explorer-card-header">
              <span className="explorer-card-link">
                <InternalLink
                  app={app}
                  sourcePath={sourcePath}
                  path={fileInfo.file.path}
                  text={fileInfo.file.basename}
                />
              </span>
              <span className="explorer-card-exts">
                {fileInfo.file.extension !== "md" &&
                !isFolderNote(fileInfo.file) ? (
                  <span className="ext-tag">{fileInfo.file.extension}</span>
                ) : null}
              </span>
            </div>
            <div className="explorer-card-footer">
              <CardFooter
                app={app}
                sourcePath={sourcePath}
                fileInfo={fileInfo}
                extForCard={extForCard}
              />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function CardFooter(props: {
  app: App;
  sourcePath: string;
  fileInfo: FileInfo;
  extForCard: string;
}): JSX.Element | null {
  const { app, sourcePath, fileInfo, extForCard } = props;

  switch (extForCard) {
    case "ctime":
      return <span>{diffDays(fileInfo.file.stat.ctime)}</span>;
    case "mtime":
      return <span>{diffDays(fileInfo.file.stat.mtime)}</span>;
    case "folder": {
      const folder = isFolderNote(fileInfo.file)
        ? fileInfo.file.parent?.parent
        : fileInfo.file.parent;
      if (!folder) return null;
      const folderNotePath = `${folder.path}/${folder.name}.md`;
      const folderNote = app.vault.getAbstractFileByPath(folderNotePath);
      if (folderNote instanceof TFile) {
        return (
          <InternalLink
            app={app}
            sourcePath={sourcePath}
            path={folderNotePath}
            text={folder.name}
            onClick={(e) => e.stopPropagation()}
          />
        );
      }
      return <span>{folder.name}</span>;
    }
    case "desc":
      if (!fileInfo.description) return null;
      return (
        <span>
          {fileInfo.description.slice(0, 60)}
          {fileInfo.description.length > 60 ? "..." : ""}
        </span>
      );
    case "none":
      return null;
  }

  return null;
}
