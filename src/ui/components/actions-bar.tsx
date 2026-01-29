import React from "react";
import { Icon } from "./shared";
import { Search } from "./search";

export function ActionsBar(props: {
  onOpenSettings: () => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onSearchToggle: () => void;
  searchMode: boolean;
  searchQuery: string;
  onSearchInput: (query: string) => void;
}): JSX.Element {
  const {
    onOpenSettings,
    onNewFolder,
    onNewNote,
    searchMode,
    searchQuery,
    onSearchToggle,
    onSearchInput,
  } = props;

  return (
    <div
      id="explorer-actions"
      className={`folder-nav flex justify-between ${searchMode ? "search-active" : ""}`}
    >
      <div className="flex gap-2 action-settings">
        <button className="clickable-icon action-icon" onClick={onOpenSettings}>
          <Icon name="settings-2" />
        </button>
      </div>

      <div className="actions-right flex">
        <div className="action-icons action-add-btns">
          <button className="clickable-icon" onClick={onNewFolder}>
            <Icon name="folder-plus" />
          </button>
          <button className="clickable-icon" onClick={onNewNote}>
            <Icon name="file-plus-2" />
          </button>
        </div>
        <div className="actions-seperator" />
        <Search
          searchMode={searchMode}
          searchQuery={searchQuery}
          onSearchToggle={onSearchToggle}
          onSearchInput={onSearchInput}
        />
      </div>
    </div>
  );
}
