import React from "react";
import { Search } from "./search";
import {
  ActionItem,
  ActionGroup,
  ActionGroupItem,
  ActionSpace,
  cn,
} from "./ui/action";
import { Gap, Group, Spring } from "./ui/layout";
import { App, Platform, TFolder } from "obsidian";
import { Bar } from "./ui/bar";
import { folderDropProps, MoveIntoFolder } from "../drag-drop";
import { canGoToParentFolderNote } from "src/explorer/navigation/folder-notes";

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

  const isMobile = Platform.isMobile;
  const actionClassName = cn(compactActionBar && "explorer-actions--compact");
  const StandaloneAction = compactActionBar ? ActionGroupItem : ActionItem;
  const MobileSpace = () => <Gap inline size=".5em" />;
  const MobileEdgeSpace = () => <Gap inline size=".5em" />;
  const settingsIcon = "settings-2";
  // const settingsIcon = "ellipsis";
  const isUseNewLayout = true;
  const useLeftTabMobile = false;

  if (isMobile && searchMode)
    return (
      <div
        id="explorer-actions"
        className={cn("explorer-actions-mobile-search", actionClassName)}
      >
        <Bar>
          <Bar.Spring />
          <Bar.Item>
            <Search
              searchMode={searchMode}
              searchQuery={searchQuery}
              onSearchToggle={onSearchToggle}
              onSearchInput={onSearchInput}
              compactActionBar={compactActionBar}
            />
          </Bar.Item>
          <Bar.Spring />
        </Bar>
      </div>
    );
  if (isMobile && !showParentNavigation)
    return (
      <div
        id="explorer-actions"
        className={cn("explorer-actions-mobile-layout", actionClassName)}
      >
        {showParentNavigation ? (
          <StandaloneAction onClick={() => onGoToParent(false)} icon="undo-2" />
        ) : (
          <StandaloneAction onClick={onOpenSettings} icon={settingsIcon} />
        )}
        {/* <ActionSpace minWidth=".8em" /> */}
        <Spring />
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
          <MobileEdgeSpace />
        </ActionGroup>
        <ActionSpace maxWidth="1em" minWidth=".5em" />

        <StandaloneAction onClick={onSearchToggle} icon="search" />
      </div>
    );
  if (isMobile && !onSaveFolderNote && useLeftTabMobile)
    return (
      <div
        id="explorer-actions"
        className={cn("explorer-actions-mobile-layout", actionClassName)}
      >
        <ActionGroup>
          <MobileEdgeSpace />
          <ActionGroupItem onClick={() => onGoToParent(false)} icon="undo-2" />
          <MobileSpace />
          <ActionGroupItem onClick={onOpenSettings} icon={settingsIcon} />
          <MobileSpace />

          {onSaveFolderNote && (
            <>
              <ActionGroupItem onClick={onSaveFolderNote} icon="pen-line" />
              <MobileSpace />
            </>
          )}
          <ActionGroupItem icon="folder-plus" onClick={onNewFolder} />
          <MobileSpace />
          <ActionGroupItem icon="file-plus" onClick={onNewNote} />

          <MobileEdgeSpace />
        </ActionGroup>
        <ActionSpace />
        <StandaloneAction onClick={onSearchToggle} icon="search" />
      </div>
    );
  if (isMobile && (!onSaveFolderNote || !showParentNavigation))
    return (
      <div
        id="explorer-actions"
        className={cn("explorer-actions-mobile-layout", actionClassName)}
      >
        {showParentNavigation ? (
          <StandaloneAction onClick={() => onGoToParent(false)} icon="undo-2" />
        ) : (
          <StandaloneAction onClick={onOpenSettings} icon={settingsIcon} />
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
        id="explorer-actions"
        className={cn("explorer-actions-mobile-layout", actionClassName)}
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

        <StandaloneAction onClick={onSearchToggle} icon="search" />
      </div>
    );
  if (isUseNewLayout)
    return (
      <div id="explorer-actions" className={actionClassName}>
        <Bar>
          <Bar.Item>
            <Group gap={2} className="explorer-actions-start">
              {showParentNavigation ? (
                <StandaloneAction
                  icon="undo-2"
                  className="explorer-parent-action"
                  {...folderDropProps(app, parentDropFolder, onMoveIntoFolder)}
                  onClick={() => {
                    onGoToParent(false);
                  }}
                />
              ) : (
                <StandaloneAction
                  icon={settingsIcon}
                  onClick={onOpenSettings}
                />
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
              <span className="explorer-action-gap" />
              <Search
                searchMode={searchMode}
                searchQuery={searchQuery}
                onSearchToggle={onSearchToggle}
                onSearchInput={onSearchInput}
                compactActionBar={compactActionBar}
              />
            </Group>
          </Bar.Item>
        </Bar>
      </div>
    );
  return (
    <div id="explorer-actions" className={actionClassName}>
      <Bar>
        <Bar.Item>
          <Group gap={2} className="explorer-actions-start">
            {showParentNavigation ? (
              <StandaloneAction
                icon="undo-2"
                className="explorer-parent-action"
                {...folderDropProps(app, parentDropFolder, onMoveIntoFolder)}
                onClick={() => {
                  onGoToParent(false);
                }}
              />
            ) : null}
            <StandaloneAction icon={settingsIcon} onClick={onOpenSettings} />
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
            <span className="explorer-action-gap" />
            <Search
              searchMode={searchMode}
              searchQuery={searchQuery}
              onSearchToggle={onSearchToggle}
              onSearchInput={onSearchInput}
              compactActionBar={compactActionBar}
            />
          </Group>
        </Bar.Item>
      </Bar>
    </div>
  );
}
