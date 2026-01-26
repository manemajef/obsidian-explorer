import React from "react";
import { Icon } from "./shared";

export function ActionsBar(props: {
  onOpenSettings: () => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onSearchToggle: () => void;
  searchMode: boolean;
}): JSX.Element {
  const { onOpenSettings, onNewFolder, onNewNote, onSearchToggle, searchMode } =
    props;

  return (
    <div id="explorer-actions" className="folder-nav justify-between">
      <div className="flex gap-2">
        <button className="clickable-icon action-icon" onClick={onOpenSettings}>
          <Icon name="settings-2" />
        </button>
      </div>
      <div>
        <div className="flex">
          <div className="action-icons">
            <button className="clickable-icon" onClick={onNewFolder}>
              <Icon name="folder-plus" />
            </button>
            <button className="clickable-icon" onClick={onNewNote}>
              <Icon name="file-plus-2" />
            </button>
          </div>
          <div className="explorer-actions-wrap flex gap-2">
            <button
              type="button"
              className="clickable-icon action-icon"
              onClick={onSearchToggle}
            >
              <Icon name={searchMode ? "undo-2" : "search"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
