import React from "react";
import { Search } from "./search";
import {
  ActionItem,
  ActionGroup,
  ActionGroupItem,
  ActionSpace,
} from "./ui/action";
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
  const MobileSpace = () => <span style={{ width: ".5em", flexShrink: 1 }} />;
  const MobileEdgeSpace = () => (
    <span style={{ width: ".5em", flexShrink: 1 }} />
  );
  const settingsIcon = Platform.isMobile ? "ellipsis" : "settings-2";
  // const settingsIcon = "ellipsis";
  const isUseNewLayout = true;

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
  if (isMobile && (!onSaveFolderNote || !showParentNavigation))
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
        id="explorer-actions"
      >
        {showParentNavigation ? (
          <ActionItem onClick={() => onGoToParent(false)} icon="undo-2" />
        ) : (
          <ActionItem onClick={onOpenSettings} icon={settingsIcon} />
        )}
        <ActionSpace minWidth=".8em" />
        <ActionGroup>
          <MobileEdgeSpace />
          {showParentNavigation && (
            <>
              <ActionGroupItem onClick={onOpenSettings} icon={settingsIcon} />
              <MobileSpace />
            </>
          )}
          {onSaveFolderNote && (
            <>
              <ActionGroupItem onClick={onSaveFolderNote} icon="pen-line" />
              <MobileSpace />
            </>
          )}
          <ActionGroupItem icon="folder-plus" onClick={onNewFolder} />
          <MobileSpace />
          <ActionGroupItem icon="file-plus" onClick={onNewNote} />
          <MobileSpace />
          <ActionGroupItem onClick={onSearchToggle} icon="search" />
          <MobileEdgeSpace />
        </ActionGroup>
      </div>
    );
  if (isMobile)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
        id="explorer-actions"
      >
        <ActionGroup>
          <MobileEdgeSpace />
          {showParentNavigation ? (
            <ActionGroupItem
              onClick={() => onGoToParent(false)}
              icon="undo-2"
            />
          ) : (
            <ActionGroupItem onClick={onOpenSettings} icon={settingsIcon} />
          )}
          {showParentNavigation && (
            <>
              <ActionGroupItem onClick={onOpenSettings} icon={settingsIcon} />
              <MobileSpace />
            </>
          )}
          <ActionGroupItem icon="folder-plus" onClick={onNewFolder} />
          <MobileSpace />
          <ActionGroupItem icon="file-plus" onClick={onNewNote} />

          {onSaveFolderNote && (
            <>
              <MobileSpace />
              <ActionGroupItem onClick={onSaveFolderNote} icon="pen-line" />
            </>
          )}
          <MobileEdgeSpace />
        </ActionGroup>
        <ActionSpace minWidth=".8em" />

        <ActionItem onClick={onSearchToggle} icon="search" />
      </div>
    );
  if (isUseNewLayout)
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
                <ActionItem icon={settingsIcon} onClick={onOpenSettings} />
              )}
            </Group>
          </Bar.Item>

          <Bar.Spring />

          <Bar.Item className="explorer-actions-end">
            <Group className="explorer-actions-controls">
              <ActionGroup>
                {showParentNavigation && (
                  <ActionGroupItem
                    icon={settingsIcon}
                    onClick={onOpenSettings}
                  />
                )}

                <ActionGroupItem icon="folder-plus" onClick={onNewFolder} />
                <ActionGroupItem icon="file-plus-2" onClick={onNewNote} />
                {onSaveFolderNote && (
                  <ActionGroupItem icon="pen-line" onClick={onSaveFolderNote} />
                )}
              </ActionGroup>
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
            ) : null}
            <ActionItem icon={settingsIcon} onClick={onOpenSettings} />
          </Group>
        </Bar.Item>

        <Bar.Spring />

        <Bar.Item className="explorer-actions-end">
          <Group className="explorer-actions-controls">
            <ActionGroup>
              {onSaveFolderNote && (
                <ActionGroupItem icon="pen-line" onClick={onSaveFolderNote} />
              )}
              <ActionGroupItem icon="folder-plus" onClick={onNewFolder} />
              <ActionGroupItem icon="file-plus-2" onClick={onNewNote} />
            </ActionGroup>
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
