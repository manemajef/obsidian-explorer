import React from "react";
import { Platform } from "obsidian";
import type { Explorer } from "../../explorer/api";
import { ExplorerFolderNode } from "../../explorer/model";
import type { ContextMenuConfig } from "../context-menu";
import { folderInteractionProps } from "./interactions";
import { cn } from "./primitives/cn";
import { Link } from "./primitives/link";

const LONG_FOLDER_NAME_LENGTH = 20;
const TRESH_FOR_SM = 9;

interface FolderButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

function FolderButton({
  interactive,
  className,
  children,
  ...rest
}: FolderButtonProps): React.JSX.Element {
  return (
    <div
      className={cn("explorer-folder-button", className)}
      data-interactive={interactive || undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

export function FolderButtons(props: {
  folders: ExplorerFolderNode[];
  explorer: Explorer;
  contextMenu: ContextMenuConfig;
  missingFolderLinkCreatesMarkdown: boolean;
}): React.JSX.Element {
  const {
    folders,
    explorer,
    contextMenu,
    missingFolderLinkCreatesMarkdown,
  } = props;
  const isSparse = folders.length < 3;
  const variant = Platform.isMobile ? "mobile" : "desktop";

  return (
    <div
      className="explorer-folder-grid"
      data-sparse={isSparse || undefined}
      data-variant={variant}
      dir="auto"
    >
      {folders.map((folder) => {
        const existingNote = folder.folderNote;
        const isMissing = !existingNote;
        const folderNotePath = existingNote
          ? existingNote.path
          : folder.folderNotePath;
        const linkText = folder.displayName;
        const isLongName = linkText.length > LONG_FOLDER_NAME_LENGTH;
        const isTightName = linkText.length > TRESH_FOR_SM;
        const linkCreatesFolderNote =
          !isMissing || missingFolderLinkCreatesMarkdown;

        return (
          <FolderButton
            key={folderNotePath}
            className={cn(
              "explorer-folder-card",
              isTightName && "explorer-folder-card--medium-name",
              isLongName && "explorer-folder-card--long-name",
            )}
            interactive
            {...folderInteractionProps(folder, explorer, contextMenu)}
          >
            <Link
              path={folderNotePath}
              className="explorer-folder-card__link"
              draggable={false}
              variant="title"
              size={Platform.isMobile ? "smaller" : "smaller"}
              underline="none"
              weight={Platform.isMobile ? "semibold" : "medium"}
              unresolved={isMissing}
              tooltip={
                isMissing && linkCreatesFolderNote
                  ? `Create folder note ${folder.name}.md`
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void contextMenu.explorer.openFolder(folder.folder, {
                  newLeaf: e.ctrlKey || e.metaKey,
                  intent: "explicit",
                });
              }}
              onMouseOver={
                isMissing && !linkCreatesFolderNote
                  ? (e) => e.stopPropagation()
                  : undefined
              }
            >
              {linkText}
            </Link>
          </FolderButton>
        );
      })}
    </div>
  );
}
