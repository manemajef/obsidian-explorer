import React from "react";
import { App, TFolder, Platform } from "obsidian";
import { isRtl } from "../../utils/helpers";
import { getFolderNoteForFolder } from "../../utils/file-utils";
import { Icon, InternalLink } from "./shared";
const HOMEPAGE = "Home.md";
import { GlassItem } from "./ui/glass";
/** Max parts before trimming middle paths with "..." */
const MAX_VISIBLE_PARTS = 3;
const CURR_IS_VISIBLE = false;
export function Breadcrumbs(props: {
  app: App;
  sourcePath: string;
  folder: TFolder;
  onOpenFolderNote: (folder: TFolder, newLeaf: boolean) => void;
}): React.JSX.Element {
  const { app, sourcePath, folder, onOpenFolderNote } = props;
  if (app.workspace.getActiveFile()?.path === HOMEPAGE) return <div></div>;
  const allParts: { name: string; path: string }[] = [];
  let current: TFolder | null = folder;

  while (current && current.path !== "/") {
    allParts.unshift({ name: current.name, path: current.path });
    current = current.parent;
  }
  if (Platform.isMobile) {
    const parent = folder?.parent;
    if (!parent) return <></>;
    return (
      <GlassItem
        icon="undo-2"
        onClick={() => onOpenFolderNote(parent, false)}
      />
    );
  }

  // Trim: always show first + last 2, collapse middle into "..."
  let parts = allParts;
  if (!CURR_IS_VISIBLE) parts = parts.slice(0, -1);

  // parts = parts.slice(0, -1);
  let showEllipsis = false;
  if (allParts.length > MAX_VISIBLE_PARTS) {
    parts = [allParts[0], ...allParts.slice(-2)];

    showEllipsis = true;
  }
  const chevron = (name: string) => (
    <div className="explorer-breadcrumb-sep">
      <Icon
        name={isRtl(name) ? "chevron-right" : "chevron-right"}
        className="breadcrumbs-icon"
      />
    </div>
  );

  return (
    <div className="explorer-breadcrumbs">
      <div>
        <InternalLink
          app={app}
          sourcePath={sourcePath}
          path="Home.md"
          className="explorer-breadcrumb-home"
        >
          <Icon name="home" className="breadcrumbs-home-icon" />
        </InternalLink>
      </div>

      {parts.map((part, i) => {
        const folderObj = app.vault.getAbstractFileByPath(part.path);
        const folderNote =
          folderObj instanceof TFolder
            ? getFolderNoteForFolder(app, folderObj)
            : null;

        return (
          <React.Fragment key={part.path}>
            {i === 0 && chevron(part.name)}
            {i === 1 && showEllipsis && (
              <>
                {chevron("...")}
                <span className="explorer-breadcrumb-dots">...</span>
              </>
            )}
            {i > 0 && chevron(part.name)}

            {folderNote ? (
              <InternalLink
                app={app}
                sourcePath={sourcePath}
                path={folderNote.path}
                className="explorer-breadcrumb-link"
                text={part.name}
              />
            ) : (
              <span className="explorer-breadcrumb-link">{part.name}</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
