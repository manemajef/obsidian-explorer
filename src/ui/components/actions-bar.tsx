import React from "react";
import { Search } from "./search";
import { IconButton } from "./ui/icon-button";
import { ActionButton, ActionGroup } from "./ui/action-button";
import { Group, Separator } from "./ui/layout";
import { Breadcrumbs } from "./breadcrumbs";
import { App, TFolder } from "obsidian";
const USE_BREADCRUMBS = false;

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
  } = props;

  return (
    <Group
      id="explorer-actions"
      justify="between"
      className={searchMode ? "search-active" : ""}
    >
      <Group gap={2}>
        {/* <ActionButton icon="undo-2" onClick={() => console.log("clicked")} /> */}
        <ActionButton icon="settings-2" onClick={onOpenSettings} />
      </Group>
      {!searchMode && USE_BREADCRUMBS && (
        <Breadcrumbs app={app} sourcePath={sourcePath} folder={folder} />
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
