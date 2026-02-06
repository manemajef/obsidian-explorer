import React from "react";
import { App, TFolder } from "obsidian";
import { FolderInfo } from "../types";
import { BlockSettings } from "../settings/schema";
import { useExplorerState } from "./hooks/use-explorer-state";
import { CardsView } from "./components/cards-view";
import { FolderButtons } from "./components/folder-view";
import { ListView } from "./components/list-view";
import { Pagination } from "./components/pagination";
import { ActionsBar } from "./components/actions-bar";
import { Divider } from "./components/ui/layout";
import { TFile } from "obsidian";

interface ExplorerUIProps {
  app: App;
  sourcePath: string;
  folder: TFolder;
  effectiveSettings: BlockSettings;
  folderInfos: FolderInfo[];
  depthFiles: TFile[];
  folderNotes: TFile[];
  getAllFiles: () => Promise<TFile[]>;
  onOpenSettings: () => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onOpenFolderNote: (folder: TFolder, newLeaf: boolean) => void;
}

export function ExplorerUI(props: ExplorerUIProps): React.JSX.Element {
  const {
    app,
    sourcePath,
    folder,
    effectiveSettings,
    folderInfos,
    depthFiles,
    folderNotes,
    getAllFiles,
    onOpenSettings,
    onNewFolder,
    onNewNote,
    onOpenFolderNote,
  } = props;

  const {
    searchMode,
    searchQuery,
    toggleSearch,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageFileInfos,
    totalPages,
    usePaging,
    extForCard,
  } = useExplorerState({
    app,
    depthFiles,
    folderNotes,
    settings: effectiveSettings,
    getAllFiles,
  });

  return (
    <>
      <ActionsBar
        showParentButton={effectiveSettings.showParentButton}
        onOpenSettings={onOpenSettings}
        onNewFolder={onNewFolder}
        onNewNote={onNewNote}
        onSearchToggle={toggleSearch}
        searchMode={searchMode}
        searchQuery={searchQuery}
        onSearchInput={setSearchQuery}
        app={app}
        sourcePath={sourcePath}
        folder={folder}
        onOpenFolderNote={onOpenFolderNote}
      />

      {effectiveSettings.showFolders &&
        folderInfos.length > 0 &&
        !searchMode && (
          <>
            <FolderButtons
              folderInfos={folderInfos}
              onOpenFolderNote={onOpenFolderNote}
            />
            <Divider />
          </>
        )}

      {effectiveSettings.showNotes && (
        <div className="explorer-files-container">
          <div
            className={`explorer ${effectiveSettings.view === "cards" ? "explorer-notes-grid explorer-grid" : ""}`}
          >
            {effectiveSettings.view === "cards" && (
              <CardsView
                app={app}
                sourcePath={sourcePath}
                files={pageFileInfos}
                extForCard={extForCard}
              />
            )}
            {effectiveSettings.view === "list" && (
              <ListView
                app={app}
                sourcePath={sourcePath}
                files={pageFileInfos}
              />
            )}
          </div>

          {usePaging && (
            <>
              <br />
              <Pagination
                app={app}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      )}
    </>
  );
}
