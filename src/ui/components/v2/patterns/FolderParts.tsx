import React from "react";
import { ExplorerActions } from "../../../../explorer/actions";
import { ExplorerFolderNode } from "../../../../explorer/lib/nodes";
import { shouldCreateMissingFolderNote } from "../../../../explorer/navigation/folder-notes";
import { Icon, InternalLink } from "../primitives";
import { Group } from "../layout";

type FolderButtonContentProps = {
  folder: ExplorerFolderNode;
  actions: ExplorerActions;
};

export function FolderButtonContent({
  folder,
  actions,
}: FolderButtonContentProps): React.JSX.Element {
  const existingNote = folder.folderNote;
  const isMissing = !existingNote;
  const folderNotePath = existingNote ? existingNote.path : folder.folderNotePath;
  const linkCreatesFolderNote =
    !isMissing || shouldCreateMissingFolderNote(actions.settings, "explicit");

  return (
    <Group gap="sm" className="ex-folder-button-content">
      <InternalLink
        path={folderNotePath}
        className={isMissing ? "is-unresolved" : undefined}
        tooltip={
          isMissing && linkCreatesFolderNote
            ? `Create folder note ${folder.name}.md`
            : undefined
        }
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void actions.openFolderLink(folder, event.ctrlKey || event.metaKey);
        }}
        onMouseOver={
          isMissing && !linkCreatesFolderNote
            ? (event) => event.stopPropagation()
            : undefined
        }
      >
        {folder.displayName}
      </InternalLink>
    </Group>
  );
}
