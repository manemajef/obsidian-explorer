import React from "react";
import { App, Platform, TFolder } from "obsidian";
import { Search } from "./search";
import { cn } from "./primitives/cn";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarGroupItem,
  ToolbarItem,
} from "./primitives/toolbar";
import { Gap, Group, Spacer } from "./primitives/layout";
import { folderDropProps, MoveIntoFolder } from "../drag-drop";

const SETTINGS_ICON = "settings-2";

export function ActionsBar(props: {
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
  canGoToParent: boolean;
  compactActionBar: boolean;
}): React.JSX.Element {
  const {
    app,
    parentDropFolder,
    onMoveIntoFolder,
    onOpenSettings,
    onSaveFolderNote,
    onGoToParent,
    onNewFolder,
    onNewNote,
    searchMode,
    searchQuery,
    onSearchToggle,
    onSearchInput,
    canGoToParent,
    compactActionBar,
  } = props;

  const isMobile = Platform.isMobile;
  const toolbarProps = {
    id: "explorer-actions",
    className: cn(
      "explorer-actions",
      compactActionBar && "explorer-actions--compact",
    ),
    density: compactActionBar ? ("compact" as const) : undefined,
    fit: isMobile && !compactActionBar ? ("content" as const) : undefined,
  };

  const leadAction = canGoToParent ? (
    <ToolbarItem
      icon="undo-2"
      className="explorer-parent-action"
      {...folderDropProps<HTMLButtonElement>(
        app,
        parentDropFolder,
        onMoveIntoFolder,
      )}
      onClick={() => onGoToParent(false)}
    />
  ) : (
    <ToolbarItem icon={SETTINGS_ICON} onClick={onOpenSettings} />
  );

  if (isMobile && searchMode) {
    return (
      <Toolbar
        {...toolbarProps}
        className={cn(toolbarProps.className, "explorer-actions--search")}
      >
        <Spacer />
        <Search
          searchMode={searchMode}
          searchQuery={searchQuery}
          onSearchToggle={onSearchToggle}
          onSearchInput={onSearchInput}
        />
        <Spacer />
      </Toolbar>
    );
  }

  if (isMobile && !canGoToParent) {
    return (
      <Toolbar {...toolbarProps}>
        {leadAction}
        <Spacer minWidth=".5em" />
        <ToolbarGroup>
          <Gap inline size=".5em" />
          {onSaveFolderNote && false && (
            <>
              <ToolbarGroupItem icon="pen-line" onClick={onSaveFolderNote} />
              <Gap inline size=".5em" />
            </>
          )}
          <ToolbarGroupItem icon="folder-plus" onClick={onNewFolder} />
          <Gap inline size=".5em" />
          <ToolbarGroupItem icon="file-plus" onClick={onNewNote} />
          <Gap inline size=".5em" />
        </ToolbarGroup>
        {/* <Gap inline size="1em" /> */}
        <Spacer minWidth=".5em" maxWidth="1em" />

        <ToolbarItem icon="search" onClick={onSearchToggle} />
      </Toolbar>
    );
  }

  if (isMobile) {
    return (
      <Toolbar {...toolbarProps}>
        {leadAction}
        <Spacer minWidth=".8em" />
        <ToolbarGroup>
          <Gap inline size=".5em" />
          <ToolbarGroupItem icon={SETTINGS_ICON} onClick={onOpenSettings} />
          <Gap inline size=".5em" />
          <ToolbarGroupItem icon="folder-plus" onClick={onNewFolder} />
          <Gap inline size=".5em" />
          <ToolbarGroupItem icon="file-plus" onClick={onNewNote} />
          {onSaveFolderNote && false && (
            <>
              <Gap inline size=".5em" />
              <ToolbarGroupItem icon="pen-line" onClick={onSaveFolderNote} />
            </>
          )}
          <Gap inline size=".5em" />
          <ToolbarGroupItem icon="search" onClick={onSearchToggle} />
          <Gap inline size=".5em" />
        </ToolbarGroup>
      </Toolbar>
    );
  }

  return (
    <Toolbar {...toolbarProps}>
      <Group gap={2} className="explorer-actions__start">
        {leadAction}
      </Group>

      <Spacer />

      <Group className="explorer-actions__end">
        <ToolbarGroup>
          {canGoToParent && (
            <ToolbarGroupItem icon={SETTINGS_ICON} onClick={onOpenSettings} />
          )}
          <ToolbarGroupItem icon="folder-plus" onClick={onNewFolder} />
          <ToolbarGroupItem icon="file-plus-2" onClick={onNewNote} />
          {onSaveFolderNote && !isMobile && (
            <ToolbarGroupItem icon="pen-line" onClick={onSaveFolderNote} />
          )}
        </ToolbarGroup>
        <Gap inline size={compactActionBar ? ".25em" : ".6em"} />
        <Search
          searchMode={searchMode}
          searchQuery={searchQuery}
          onSearchToggle={onSearchToggle}
          onSearchInput={onSearchInput}
        />
      </Group>
    </Toolbar>
  );
}
