import React from "react";
import { Search } from "./search";
import { GlassItem, GlassGroup, GlassGroupItem } from "./ui/glass";
import { Group, Separator } from "./ui/layout";
import { App, TFolder } from "obsidian";
import { openOrCreateFolderNote } from "src/services/vault-actions";

// Breadcrumbs shelved — flip to true and uncomment the block below when ready
// import { Breadcrumbs } from "./breadcrumbs";
// const USE_BREADCRUMBS = false;

export function ActionsBar(props: {
  onOpenSettings: () => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onSearchToggle: () => void;
  searchMode: boolean;
  searchQuery: string;
  onSearchInput: (query: string) => void;
  app: App;
  sourcePath: string;
  folder: TFolder;
  showParentButton: boolean;
}): React.JSX.Element {
  const {
    onOpenSettings,
    onNewFolder,
    onNewNote,
    searchMode,
    searchQuery,
    onSearchToggle,
    onSearchInput,
    app,
    folder,
    showParentButton,
  } = props;
  const parent = folder?.parent;

  return (
    <Group
      id="explorer-actions"
      justify="between"
      className={searchMode ? "search-active action-bar" : "action-bar"}
    >
      <Group gap={2} className="action-left">
        {parent && showParentButton && (
          <GlassItem
            icon="undo-2"
            onClick={() => void openOrCreateFolderNote(app, parent)}
          />
        )}
        <GlassItem icon="settings-2" onClick={onOpenSettings} />
      </Group>

      <Group className="action-right">
        <GlassGroup className="action-add-btns">
          <GlassGroupItem icon="folder-plus" onClick={onNewFolder} />
          <GlassGroupItem icon="file-plus-2" onClick={onNewNote} />
        </GlassGroup>
        <Separator />
        <Search
          searchMode={searchMode}
          searchQuery={searchQuery}
          onSearchToggle={onSearchToggle}
          onSearchInput={onSearchInput}
        />
      </Group>
    </Group>
  );
}
