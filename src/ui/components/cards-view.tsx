import React from "react";
import { App, TFolder } from "obsidian";
import { FileInfo } from "../../types";
import { diffDays } from "../../utils/helpers";
import { isFolderNote } from "../../utils/file-utils";
import { InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Pin } from "./ui/pin";

type OpenFolderNote = (folder: TFolder, newLeaf: boolean) => void;

export function CardsView(props: {
  app: App;
  sourcePath: string;
  files: FileInfo[];
  extForCard: string;
  showTags: boolean;
  onOpenFolderNote: OpenFolderNote;
}): React.JSX.Element {
  const { app, sourcePath, files, extForCard, showTags, onOpenFolderNote } =
    props;

  return (
    <>
      {files.map((fileInfo) => (
        <div key={fileInfo.file.path}>
          <div
            className="explorer-card"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) return;
              void app.workspace.openLinkText(
                fileInfo.file.path,
                sourcePath,
                false,
              );
            }}
          >
            <div className="explorer-card-header">
              <span>
                <InternalLink
                  app={app}
                  sourcePath={sourcePath}
                  path={fileInfo.file.path}
                  text={fileInfo.file.basename}
                  className="text-normal"
                />
              </span>
              {/* <Bar.Spring /> */}
              {/* <Bar.Item /> */}
              <span style={{ width: ".5em" }} />

              <div className="explorer-card-exts">
                <div
                  className="tags-container flex-strech"
                  onClick={(e) => e.stopPropagation()}
                >
                  {fileInfo.file.extension === "md" && (
                    <Pin fileInfo={fileInfo} />
                  )}
                </div>

                {fileInfo.file.extension !== "md" &&
                !isFolderNote(fileInfo.file) ? (
                  <Badge variant="ext">{fileInfo.file.extension}</Badge>
                ) : null}
              </div>
            </div>
            <div className="explorer-card-body">
              <div className="explorer-card-tags-container">
                {showTags &&
                  fileInfo.tags?.map((t) => <Badge variant="tag">{t}</Badge>)}
              </div>
            </div>
            <div className="explorer-card-footer">
              <CardFooter
                fileInfo={fileInfo}
                extForCard={extForCard}
                onOpenFolderNote={onOpenFolderNote}
              />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function CardFooter(props: {
  fileInfo: FileInfo;
  extForCard: string;
  onOpenFolderNote: OpenFolderNote;
}): React.JSX.Element | null {
  const { fileInfo, extForCard, onOpenFolderNote } = props;

  switch (extForCard) {
    case "ctime":
      return <span>{diffDays(fileInfo.file.stat.ctime)}</span>;
    case "mtime":
      return <span>{diffDays(fileInfo.file.stat.mtime)}</span>;
    case "folder": {
      const folder = fileInfo.file.parent;
      if (!folder) return null;
      return (
        <span
          className="link text-normal hover-underline"
          onClick={(e) => {
            e.stopPropagation();
            onOpenFolderNote(folder, e.ctrlKey || e.metaKey);
          }}
        >
          {folder.name}
        </span>
      );
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
