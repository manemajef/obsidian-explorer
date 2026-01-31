import React from "react";
import { Search } from "./search";
import { IconButton } from "./ui/icon-button";
import { ActionButton, ActionGroup } from "./ui/action-button";
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
}): JSX.Element {
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
          <ActionButton
            icon="undo-2"
            onClick={() => openOrCreateFolderNote(app, parent)}
          ></ActionButton>
        )}
        <ActionButton icon="settings-2" onClick={onOpenSettings} />
      </Group>

      {/* Breadcrumbs shelved — uncomment when ready to ship
      {!searchMode &&
        USE_BREADCRUMBS &&
        showBreadcrumbs &&
        !Platform.isMobile &&
        parent && (
          <>
            <Separator />
            <div className="action-mid">
              <div className="actions-breadcrumbs">
                <Breadcrumbs
                  app={app}
                  sourcePath={sourcePath}
                  folder={folder}
                />
              </div>
            </div>
          </>
        )}
      */}

      <Group className="action-right">
        <ActionGroup className="action-add-btns">
          <IconButton name="folder-plus" onClick={onNewFolder} />
          <IconButton name="file-plus-2" onClick={onNewNote} />
        </ActionGroup>
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
