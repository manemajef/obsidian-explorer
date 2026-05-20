import React from "react";
import { App, TFile, TFolder } from "obsidian";
import { FileInfo, FolderInfo } from "../types";
import { BlockSettings, shouldDisplayNotes } from "../settings/schema";
import { useExplorerState } from "./hooks/use-explorer-state";
import { CardsView } from "./components/cards-view";
import { FolderButtons } from "./components/folder-view";
import { ListView } from "./components/list-view";
import { Pagination, PaginationModern } from "./components/pagination";
import { ActionsBar } from "./components/actions-bar";
import { Divider } from "./components/ui/layout";

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

  const explorerState = useExplorerState({
    app,
    depthFiles,
    folderNotes,
    settings: effectiveSettings,
    getAllFiles,
  });

  const {
    searchMode,
    searchQuery,
    toggleSearch,
    setSearchQuery,
    visibleFiles,
    canLoadMore,
    loadMore,
    paginationKind,
    extForCard,
  } = explorerState;

  const explorerClassName = `${effectiveSettings.view === "cards" ? "explorer-cards-view" : "explorer-list-view"}`;

  const renderFiles = (files: FileInfo[]) => {
    if (effectiveSettings.view === "cards") {
      return (
        <CardsView
          app={app}
          sourcePath={sourcePath}
          files={files}
          extForCard={extForCard}
          showTags={effectiveSettings.showTags}
          showIconsInCards={effectiveSettings.ShowIconsInCards}
          onOpenFolderNote={onOpenFolderNote}
        />
      );
    }

    return (
      <ListView
        app={app}
        sourcePath={sourcePath}
        files={files}
        showTags={effectiveSettings.showTags}
        showListBullets={effectiveSettings.showListBullets}
      />
    );
  };

  const showLoadMore = paginationKind === "load-more" && canLoadMore;
  const classicPagination =
    explorerState.paginationKind === "classic" && explorerState.totalPages > 1
      ? explorerState
      : null;

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
        folder={folder}
        onOpenFolderNote={onOpenFolderNote}
      />

      {effectiveSettings.showFolders &&
        folderInfos.length > 0 &&
        !searchMode && (
          <>
            <Divider />
            {/* <Divider /> */}
            <FolderButtons
              folderInfos={folderInfos}
              onOpenFolderNote={onOpenFolderNote}
            />
          </>
        )}

      {shouldDisplayNotes(effectiveSettings) && (
        <div className="explorer-files-container">
          <Divider />

          <div>{renderFiles(visibleFiles)}</div>

          {(showLoadMore || classicPagination) && (
            <>
              <Divider />
              {/* <Divider /> */}
              {showLoadMore ? (
                <PaginationModern
                  canLoadMore={canLoadMore}
                  onLoadMore={loadMore}
                />
              ) : (
                <Pagination
                  currentPage={classicPagination?.currentPage ?? 0}
                  totalPages={classicPagination?.totalPages ?? 1}
                  onPageChange={classicPagination?.setPage ?? (() => undefined)}
                />
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
