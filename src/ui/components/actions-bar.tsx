import React from "react";
import { Search } from "./search";
import { ActionItem, ActionGroup, ActionGroupItem } from "./ui/action";
import { Group, Separator } from "./ui/layout";
import { App, Platform, TFolder } from "obsidian";
import { Bar } from "./ui/bar";
import { folderDropProps, MoveIntoFolder } from "../drag-drop";

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
  useGlass: boolean;
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
    useGlass,
  } = props;

  const isMobile = Platform.isMobile;
  const canGoToParent = showParentNavigation;
  const showGroupedFolderOrSettingsAction =
    onSaveFolderNote || (isMobile && canGoToParent);

  if (isMobile && searchMode)
    return (
      <div id="explorer-actions" className="explorer-actions-mobile-search">
        <Bar>
          <Bar.Spring />
          <Bar.Item>
            <Search
              searchMode={searchMode}
              searchQuery={searchQuery}
              onSearchToggle={onSearchToggle}
              onSearchInput={onSearchInput}
            />
          </Bar.Item>
          <Bar.Spring />
        </Bar>
      </div>
    );

  return (
    <div id="explorer-actions">
      <Bar>
        <Bar.Item>
          <Group gap={2} className="explorer-actions-start">
            {showParentNavigation ? (
              <ActionItem
                icon="undo-2"
                className="explorer-parent-action"
                {...folderDropProps(app, parentDropFolder, onMoveIntoFolder)}
                onClick={() => {
                  onGoToParent(false);
                }}
              />
            ) : (
              isMobile && (
                <ActionItem icon="settings-2" onClick={onOpenSettings} />
              )
            )}
            {!isMobile && (
              <ActionItem
                icon={onSaveFolderNote ? "save" : "settings-2"}
                onClick={onSaveFolderNote ?? onOpenSettings}
              />
            )}
          </Group>
        </Bar.Item>

        <Bar.Spring />

        <Bar.Item className="explorer-actions-end">
          <Group className="explorer-actions-controls">
            {!(searchMode && isMobile) && (
              <ActionGroup>
                {showGroupedFolderOrSettingsAction && (
                  <ActionGroupItem
                    icon={onSaveFolderNote ? "pen-line" : "settings-2"}
                    onClick={onSaveFolderNote ?? onOpenSettings}
                  />
                )}
                <ActionGroupItem icon="folder-plus" onClick={onNewFolder} />
                <ActionGroupItem icon="file-plus-2" onClick={onNewNote} />
              </ActionGroup>
            )}
            {/* <Separator className="action-seperator" />  */}
            {useGlass ? <span style={{ width: ".6em" }} /> : <Separator />}
            <Search
              searchMode={searchMode}
              searchQuery={searchQuery}
              onSearchToggle={onSearchToggle}
              onSearchInput={onSearchInput}
            />
          </Group>
        </Bar.Item>
      </Bar>
    </div>
  );
}
