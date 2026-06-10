import React from "react";
import { App, Platform, TFolder } from "obsidian";
import { Search, type BarMode } from "./search";
import { cn } from "./ui/cn";
import { Button, ButtonGroup, type ButtonProps } from "./ui/button";
import { Gap, Group, Spacer } from "./ui/layout";
import { folderDropProps, MoveIntoFolder } from "../drag-drop";

/** A standalone control outside any group: glass pill normally, bare in
 * compact mode. */
function BarButton({
  mode,
  ...props
}: ButtonProps & { mode: BarMode }): React.JSX.Element {
  return (
    <Button
      variant={mode.compact ? "ghost" : "glass"}
      shape={mode.compact ? "round" : "circle"}
      density={mode.compact ? "compact" : undefined}
      fit={mode.mobile && !mode.compact ? "content" : undefined}
      {...props}
    />
  );
}

/** A control inside a ButtonGroup. */
function GroupButton({
  mode,
  ...props
}: ButtonProps & { mode: BarMode }): React.JSX.Element {
  return (
    <Button
      variant="ghost"
      shape={mode.compact ? "round" : "circle"}
      density={mode.compact ? "compact" : undefined}
      fit={mode.mobile && !mode.compact ? "content" : undefined}
      {...props}
    />
  );
}

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
  showParentNavigation: boolean;
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
    showParentNavigation,
    compactActionBar,
  } = props;

  const mode: BarMode = {
    compact: compactActionBar,
    mobile: Platform.isMobile,
  };
  const barClassName = cn(
    "explorer-actions",
    compactActionBar && "explorer-actions--compact",
  );

  const parentAction = (
    <BarButton
      mode={mode}
      icon="undo-2"
      className="explorer-parent-action"
      {...folderDropProps<HTMLButtonElement>(
        app,
        parentDropFolder,
        onMoveIntoFolder,
      )}
      onClick={() => onGoToParent(false)}
    />
  );

  const leadAction = showParentNavigation ? (
    parentAction
  ) : (
    <BarButton mode={mode} icon={SETTINGS_ICON} onClick={onOpenSettings} />
  );

  if (mode.mobile && searchMode) {
    return (
      <div id="explorer-actions" className={cn(barClassName, "explorer-actions--search")}>
        <Spacer />
        <Search
          searchMode={searchMode}
          searchQuery={searchQuery}
          onSearchToggle={onSearchToggle}
          onSearchInput={onSearchInput}
          mode={mode}
        />
        <Spacer />
      </div>
    );
  }

  if (mode.mobile && !showParentNavigation) {
    return (
      <div id="explorer-actions" className={barClassName}>
        {leadAction}
        <Spacer />
        <ButtonGroup
          surface={!mode.compact}
          fit={mode.mobile && !mode.compact ? "content" : undefined}
          density={mode.compact ? "compact" : undefined}
        >
          <Gap inline size=".5em" />
          {onSaveFolderNote && (
            <>
              <GroupButton mode={mode} icon="pen-line" onClick={onSaveFolderNote} />
              <Gap inline size=".5em" />
            </>
          )}
          <GroupButton mode={mode} icon="folder-plus" onClick={onNewFolder} />
          <Gap inline size=".5em" />
          <GroupButton mode={mode} icon="file-plus" onClick={onNewNote} />
          <Gap inline size=".5em" />
        </ButtonGroup>
        <Spacer minWidth=".5em" maxWidth="1em" />
        <BarButton mode={mode} icon="search" onClick={onSearchToggle} />
      </div>
    );
  }

  if (mode.mobile) {
    return (
      <div id="explorer-actions" className={barClassName}>
        {leadAction}
        <Spacer minWidth=".8em" maxWidth="64px" />
        <ButtonGroup
          surface={!mode.compact}
          fit={mode.mobile && !mode.compact ? "content" : undefined}
          density={mode.compact ? "compact" : undefined}
        >
          <Gap inline size=".5em" />
          <GroupButton mode={mode} icon={SETTINGS_ICON} onClick={onOpenSettings} />
          <Gap inline size=".5em" />
          <GroupButton mode={mode} icon="folder-plus" onClick={onNewFolder} />
          <Gap inline size=".5em" />
          <GroupButton mode={mode} icon="file-plus" onClick={onNewNote} />
          {onSaveFolderNote && (
            <>
              <Gap inline size=".5em" />
              <GroupButton mode={mode} icon="pen-line" onClick={onSaveFolderNote} />
            </>
          )}
          <Gap inline size=".5em" />
          <GroupButton mode={mode} icon="search" onClick={onSearchToggle} />
          <Gap inline size=".5em" />
        </ButtonGroup>
      </div>
    );
  }

  return (
    <div id="explorer-actions" className={barClassName}>
      <Group gap={2} className="explorer-actions__start">
        {leadAction}
      </Group>

      <Spacer />

      <Group className="explorer-actions__end">
        <ButtonGroup
          surface={!mode.compact}
          density={mode.compact ? "compact" : undefined}
        >
          {showParentNavigation && (
            <GroupButton mode={mode} icon={SETTINGS_ICON} onClick={onOpenSettings} />
          )}
          <GroupButton mode={mode} icon="folder-plus" onClick={onNewFolder} />
          <GroupButton mode={mode} icon="file-plus-2" onClick={onNewNote} />
          {onSaveFolderNote && (
            <GroupButton mode={mode} icon="pen-line" onClick={onSaveFolderNote} />
          )}
        </ButtonGroup>
        <Gap inline size={mode.compact ? ".25em" : ".6em"} />
        <Search
          searchMode={searchMode}
          searchQuery={searchQuery}
          onSearchToggle={onSearchToggle}
          onSearchInput={onSearchInput}
          mode={mode}
        />
      </Group>
    </div>
  );
}
