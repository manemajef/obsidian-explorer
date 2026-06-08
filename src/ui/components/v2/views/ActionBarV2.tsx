import React, { useEffect, useRef } from "react";
import { App, Platform, TFolder } from "obsidian";
import { folderDropProps, type MoveIntoFolder } from "../../../drag-drop";
import { Button, ButtonGroup } from "../primitives";
import { Group, Spacer } from "../layout";
import { cn } from "../utils/cn";

type ActionBarV2Props = {
  app: App;
  parentDropFolder: TFolder | null;
  onMoveIntoFolder: MoveIntoFolder;
  onOpenSettings: () => void;
  onSaveFolderNote?: () => void;
  onGoToParent: (newLeaf: boolean) => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onSearchToggle: () => void;
  searchMode: boolean;
  searchQuery: string;
  onSearchInput: (query: string) => void;
  showParentNavigation: boolean;
  compactActionBar: boolean;
};

export function ActionBarV2({
  app,
  parentDropFolder,
  onMoveIntoFolder,
  onOpenSettings,
  onSaveFolderNote,
  onGoToParent,
  onNewFolder,
  onNewNote,
  onSearchToggle,
  searchMode,
  searchQuery,
  onSearchInput,
  showParentNavigation,
  compactActionBar,
}: ActionBarV2Props): React.JSX.Element {
  const size = compactActionBar ? "sm" : "md";
  const settingsIcon = "settings-2";

  if (Platform.isMobile && searchMode) {
    return (
      <div id="explorer-actions" className="ex-actionbar" data-mobile="true">
        <SearchV2
          searchMode={searchMode}
          searchQuery={searchQuery}
          onSearchToggle={onSearchToggle}
          onSearchInput={onSearchInput}
          compact={compactActionBar}
        />
      </div>
    );
  }

  return (
    <div
      id="explorer-actions"
      className={cn("ex-actionbar", compactActionBar && "ex-actionbar--compact")}
      data-mobile={Platform.isMobile || undefined}
    >
      <Group gap="sm" className="ex-actionbar-start">
        {showParentNavigation ? (
          <Button
            icon="undo-2"
            shape="circle"
            size={size}
            variant="raised"
            className="ex-parent-action"
            {...folderDropProps(app, parentDropFolder, onMoveIntoFolder)}
            onClick={() => onGoToParent(false)}
          />
        ) : (
          <Button
            icon={settingsIcon}
            shape="circle"
            size={size}
            variant="raised"
            onClick={onOpenSettings}
          />
        )}
      </Group>

      <Spacer grow />

      <Group gap="sm" className="ex-actionbar-end">
        <ButtonGroup variant="raised" gap="sm">
          {showParentNavigation && (
            <Button
              icon={settingsIcon}
              shape="circle"
              size={size}
              variant="ghost"
              onClick={onOpenSettings}
            />
          )}
          <Button
            icon="folder-plus"
            shape="circle"
            size={size}
            variant="ghost"
            onClick={onNewFolder}
          />
          <Button
            icon="file-plus-2"
            shape="circle"
            size={size}
            variant="ghost"
            onClick={onNewNote}
          />
          {onSaveFolderNote && (
            <Button
              icon="pen-line"
              shape="circle"
              size={size}
              variant="ghost"
              onClick={onSaveFolderNote}
            />
          )}
        </ButtonGroup>

        <SearchV2
          searchMode={searchMode}
          searchQuery={searchQuery}
          onSearchToggle={onSearchToggle}
          onSearchInput={onSearchInput}
          compact={compactActionBar}
        />
      </Group>
    </div>
  );
}

function SearchV2({
  searchMode,
  searchQuery,
  onSearchToggle,
  onSearchInput,
  compact,
}: {
  searchMode: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchInput: (query: string) => void;
  compact: boolean;
}): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const size = compact ? "sm" : "md";

  useEffect(() => {
    if (!searchMode) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [searchMode]);

  if (!searchMode) {
    return (
      <Button
        icon="search"
        shape="circle"
        size={size}
        variant="raised"
        onClick={onSearchToggle}
      />
    );
  }

  return (
    <div className="ex-search">
      <input
        ref={inputRef}
        className="ex-search-input"
        placeholder={
          Platform.isMobile ? "search" : "use '#' for tags and '@' for folders"
        }
        type="text"
        value={searchQuery}
        onChange={(event) => onSearchInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          event.stopPropagation();
          onSearchToggle();
        }}
      />
      <Button
        icon="x"
        shape="circle"
        size={size}
        variant="ghost"
        onClick={onSearchToggle}
      />
    </div>
  );
}
