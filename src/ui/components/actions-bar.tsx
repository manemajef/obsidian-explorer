import React from "react";
import { Search } from "./search";
import { IconButton } from "./ui/icon-button";
import { ActionButton, ActionGroup } from "./ui/action-button";
import { Group, Separator } from "./ui/layout";
import { Breadcrumbs } from "./breadcrumbs";
import { App, TFolder, Platform } from "obsidian";
import { openOrCreateFolderNote } from "src/services/vault-actions";
const USE_BREADCRUMBS = true;

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
  showBreadcrumbs: boolean;
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
    sourcePath,
    folder,
    showBreadcrumbs,
  } = props;
  const parent = folder?.parent;
  // const onClickFolder = () => openOrCreateFolderNote(app, parent);

  return (
    <Group
      id="explorer-actions"
      justify="between"
      className={searchMode ? "search-active" : ""}
    >
      <Group gap={2} className="actions-left">
        {Platform.isMobile && parent && showBreadcrumbs && (
          <ActionButton
            icon="undo-2"
            onClick={() => openOrCreateFolderNote(app, parent)}
          ></ActionButton>
        )}
        <ActionButton icon="settings-2" onClick={onOpenSettings} />
      </Group>

      {!searchMode &&
        USE_BREADCRUMBS &&
        showBreadcrumbs &&
        !Platform.isMobile && (
          <>
            <Separator />
            <div className="actions-mid">
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

      <Group className="actions-right">
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
