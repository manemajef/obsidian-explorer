import React from "react";
import { TFolder } from "obsidian";
import { FileInfo } from "../../types";
import { ExplorerModel } from "../../explorer/model";
import { diffDays, isFolderNote } from "../../explorer/file-utils";
import { Icon, InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Pin } from "./ui/pin";

type OpenFolderNote = (folder: TFolder, newLeaf: boolean) => void;

export function CardsView(props: {
  model: ExplorerModel;
  files: FileInfo[];
  extForCard: string;
  onOpenFolderNote: OpenFolderNote;
}): React.JSX.Element {
  const { model, files, extForCard, onOpenFolderNote } = props;
  const { app, settings, sourcePath } = model;

  return (
    <div className="explorer-cards-view">
      <div className="explorer-cards-grid">
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
                <div>
                  <InternalLink
                    path={fileInfo.file.path}
                    text={fileInfo.file.basename}
                  />
                </div>
                {/* <Bar.Spring /> */}
                {/* <Bar.Item /> */}
                <span style={{ width: ".5em" }} />

                <div className="explorer-card-exts">
                  <div
                    className="explorer-card-pin-slot"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {fileInfo.file.extension === "md" && (
                      <Pin fileInfo={fileInfo} />
                    )}
                  </div>
                  {isFolderNote(fileInfo.file) ? (
                    <Badge variant="folder" />
                  ) : fileInfo.file.extension !== "md" ? (
                    <Badge variant="ext" className="explorer-card-ext-badge">
                      {fileInfo.file.extension}
                    </Badge>
                  ) : null}
                </div>
              </div>

              {settings.showTags && (fileInfo.tags?.length ?? 0) > 0 && (
                <div className="explorer-card-tags-container explorer-cards-row">
                  {fileInfo.tags?.map((t) => (
                    <Badge key={t} variant="tag">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="explorer-card-footer explorer-cards-row">
                <CardFooter
                  fileInfo={fileInfo}
                  extForCard={extForCard}
                  onOpenFolderNote={onOpenFolderNote}
                  showIconsInCards={settings.ShowIconsInCards}
                  currentFolderPath={model.folder.path}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardFooter(props: {
  fileInfo: FileInfo;
  extForCard: string;
  showIconsInCards: boolean;
  onOpenFolderNote: OpenFolderNote;
  currentFolderPath: string;
}): React.JSX.Element | null {
  const {
    fileInfo,
    extForCard,
    showIconsInCards,
    onOpenFolderNote,
    currentFolderPath,
  } = props;

  switch (extForCard) {
    case "ctime":
      return <span>{diffDays(fileInfo.file.stat.ctime)}</span>;
    case "mtime":
      return <span>{diffDays(fileInfo.file.stat.mtime)}</span>;
    case "folder": {
      const folder = fileInfo.file.parent;
      if (!folder || !folder.name || isFolderNote(fileInfo.file)) return null;
      if (folder.path === currentFolderPath) return null;
      return (
        <span
          className="explorer-card-folder-link"
          onClick={(e) => {
            e.stopPropagation();
            onOpenFolderNote(folder, e.ctrlKey || e.metaKey);
          }}
        >
          {showIconsInCards && (
            <Icon name="folder-closed" className="explorer-card-folder-icon" />
          )}

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
