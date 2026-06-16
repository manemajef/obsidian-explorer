import React from "react";
import { Platform } from "obsidian";
import { ExplorerFolderNode } from "../../explorer/lib/nodes";
import { ExplorerActions } from "../../explorer/actions";
import { shouldCreateMissingFolderNote } from "../../explorer/navigation/folder-notes";
import type { ContextMenuConfig } from "../context-menu";
import { folderInteractionProps } from "./interactions";
import { cn } from "./primitives/cn";
import { Link } from "./primitives/link";

const LONG_FOLDER_NAME_LENGTH = 20;

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
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
}): React.JSX.Element {
  const { folders, actions, contextMenu } = props;
  const isSparse = folders.length < 3;
  const variant = Platform.isMobile ? "mobile" : "desktop";

  return (
    <div
      className="explorer-folder-grid"
      data-sparse={isSparse || undefined}
      data-variant={variant}
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
          <FolderButton
            key={folderNotePath}
            className={cn(
              "explorer-folder-card",
              isLongName && "explorer-folder-card--long-name",
            )}
            interactive
            {...folderInteractionProps(folder, actions, contextMenu)}
          >
            <Link
              path={folderNotePath}
              className="explorer-folder-card__link"
              draggable={false}
              variant="title"
              size={Platform.isMobile ? "smaller" : "smaller"}
              underline="none"
              weight={Platform.isMobile ? "semibold" : "semibold"}
              unresolved={isMissing}
              tooltip={
                isMissing && linkCreatesFolderNote
                  ? `Create folder note ${folder.name}.md`
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void actions.openFolderLink(folder, e.ctrlKey || e.metaKey);
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
