import React from "react";
import { Search } from "./search";
import { ActionItem, ActionGroup, ActionGroupItem } from "./ui/action";
import { Group, Separator } from "./ui/layout";
import { App, Platform, TFolder } from "obsidian";
import { Bar } from "./ui/bar";
import { Breadcrumbs } from "./breadcrumbs";

// Breadcrumbs shelved — flip to true and uncomment the block below when ready
// import { Breadcrumbs } from "./breadcrumbs";
const USE_BREADCRUMBS = false;

export function ActionsBar(props: {
  onOpenSettings: () => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onSearchToggle: () => void;
  searchMode: boolean;
  searchQuery: string;
  onSearchInput: (query: string) => void;
  onOpenFolderNote: (folder: TFolder, newLeaf: boolean) => void;
  app: App;
  sourcePath: string;
  folder: TFolder;
  showParentButton: boolean;
  useGlass: boolean;
}): React.JSX.Element {
  const {
    onOpenSettings,
    onNewFolder,
    onNewNote,
    searchMode,
    searchQuery,
    onSearchToggle,
    onSearchInput,
    onOpenFolderNote,
    app,
    sourcePath,
    folder,
    showParentButton,
    useGlass,
  } = props;
  const parent = folder?.parent;
  if (Platform.isMobile && searchMode)
    return (
      <div id="explorer-actions">
        <Bar>
          <Bar.Spring />
          <Bar.Item>
            <Search
              searchMode={searchMode}
              searchQuery={searchQuery}
              onSearchToggle={onSearchToggle}
              onSearchInput={onSearchInput}
              useGlass={useGlass}
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
          <Group gap={2} className="">
            {parent && showParentButton && (
              <ActionItem
                glass={useGlass}
                icon="undo-2"
                onClick={() => {
                  if (parent) onOpenFolderNote(parent, false);
                }}
              />
            )}
            <ActionItem glass={useGlass} icon="settings-2" onClick={onOpenSettings} />
          </Group>
        </Bar.Item>
        <Bar.Item />

        <Bar.Spring>
          {USE_BREADCRUMBS && (
            <Breadcrumbs
              app={app}
              folder={folder}
              sourcePath={sourcePath}
              onOpenFolderNote={onOpenFolderNote}
            />
          )}
        </Bar.Spring>

        <Bar.Item>
          <Group className="">
            {!(searchMode && Platform.isMobile) && (
              useGlass ? (
                <ActionGroup glass={useGlass}>
                  <ActionGroupItem
                    icon="folder-plus"
                    onClick={onNewFolder}
                  />
                  <ActionGroupItem
                    icon="file-plus-2"
                    onClick={onNewNote}
                  />
                </ActionGroup>
              ) : (
                <Group gap={1} className="actions-native-shortcuts">
                  <ActionItem icon="folder-plus" onClick={onNewFolder} />
                  <ActionItem icon="file-plus-2" onClick={onNewNote} />
                </Group>
              )
            )}
            <Separator />
            <Search
              searchMode={searchMode}
              searchQuery={searchQuery}
              onSearchToggle={onSearchToggle}
              onSearchInput={onSearchInput}
              useGlass={useGlass}
            />
          </Group>
        </Bar.Item>
      </Bar>
    </div>
  );
}
