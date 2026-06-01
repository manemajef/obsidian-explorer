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
  const canGoToParent = showParentNavigation;
  const showGroupedFolderOrSettingsAction =
    onSaveFolderNote || (isMobile && canGoToParent);
  const MobileSpace = () => <span style={{ width: ".5em", flexShrink: 1 }} />;
  const MobileEdgeSpace = () => (
    <span style={{ width: ".5em", flexShrink: 1 }} />
  );
  type MobileLayout = "right-bar" | "mid-bar" | "left-bar" | null;
  const mobileLayout = "right-bar" as MobileLayout;
  const useElpise = false;
  // const settingsIcon = useElpise || !canGoToParent ? "ellipsis" : "settings-2";
  const settingsIcon = useElpise ? "ellipsis" : "settings-2";
  const useLeftBar = mobileLayout === "left-bar";
  const useRightBar = mobileLayout === "right-bar";
  const useMidBar = mobileLayout === "mid-bar";

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
  if (isMobile && useRightBar)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        {showParentNavigation ? (
          <ActionItem onClick={() => onGoToParent(false)} icon="undo-2" />
        ) : onSaveFolderNote ? (
          <ActionItem onClick={onSaveFolderNote} icon="pen-line" />
        ) : (
          <ActionItem onClick={onOpenSettings} icon={settingsIcon} />
        )}
        <ActionSpace minWidth=".5em" />
        <ActionGroup>
          <MobileEdgeSpace />
          {showParentNavigation && (
            <>
              {onSaveFolderNote ? (
                <ActionGroupItem onClick={onSaveFolderNote} icon="pen-line" />
              ) : (
                <ActionGroupItem onClick={onOpenSettings} icon={settingsIcon} />
              )}
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
  if (isMobile && useLeftBar)
    return (
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        {/* <MobileSpace /> */}
        <ActionGroup
          style={{
            flex: "0 1 auto",
            minWidth: 0,
            justifyContent: "space-around",
          }}
        >
          <MobileEdgeSpace />
          {showParentNavigation && (
            <>
              <ActionGroupItem
                icon="undo-2"
                className="explorer-parent-action"
                {...folderDropProps(app, parentDropFolder, onMoveIntoFolder)}
                onClick={() => {
                  onGoToParent(false);
                }}
              />
              <MobileSpace />
            </>
          )}
          <ActionGroupItem
            icon={onSaveFolderNote ? "pen-line" : settingsIcon}
            onClick={onSaveFolderNote ?? onOpenSettings}
          />
          <MobileSpace />
          <ActionGroupItem icon="folder-plus" onClick={onNewFolder} />
          <MobileSpace />
          <ActionGroupItem icon="file-plus-2" onClick={onNewNote} />
          <MobileSpace />
          <ActionGroupItem icon="search" onClick={onSearchToggle} />
          <MobileEdgeSpace />
        </ActionGroup>

        {/* <MobileSpace /> */}
      </div>
    );
  if (isMobile && useMidBar)
    return (
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        {/* <MobileSpace /> */}
        <ActionGroup
          style={{
            flex: "0 1 auto",
            minWidth: 0,
            justifyContent: "space-around",
          }}
        >
          <MobileEdgeSpace />
          {showParentNavigation && (
            <>
              <ActionGroupItem
                icon="undo-2"
                className="explorer-parent-action"
                {...folderDropProps(app, parentDropFolder, onMoveIntoFolder)}
                onClick={() => {
                  onGoToParent(false);
                }}
              />
              <MobileSpace />
            </>
          )}
          <ActionGroupItem
            icon={onSaveFolderNote ? "pen-line" : settingsIcon}
            onClick={onSaveFolderNote ?? onOpenSettings}
          />
          <MobileSpace />
          <ActionGroupItem icon="folder-plus" onClick={onNewFolder} />
          <MobileSpace />
          <ActionGroupItem icon="file-plus-2" onClick={onNewNote} />
          <MobileEdgeSpace />
        </ActionGroup>
        <ActionSpace minWidth=".5em" maxWidth="none" />
        <ActionItem icon="search" onClick={onSearchToggle} />
        {/* <MobileSpace /> */}
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
                <ActionItem icon={settingsIcon} onClick={onOpenSettings} />
              )
            )}
            {!isMobile && (
              <ActionItem
                icon={onSaveFolderNote ? "save" : settingsIcon}
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
                    icon={onSaveFolderNote ? "pen-line" : settingsIcon}
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
