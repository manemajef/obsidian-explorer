import React from "react";
import { App, TFolder } from "obsidian";
import { FolderInfo } from "../types";
import { BlockSettings } from "../settings/schema";
import { useExplorerState } from "./hooks/use-explorer-state";
import { CardsView } from "./components/cards-view";
import { FolderButtons } from "./components/folder-view";
import { ListView } from "./components/list-view";
import { Pagination, PaginationModern } from "./components/pagination";
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
    visiblePageFileInfoChunks,
    animatedChunkIndex,
    loadMore,
    canLoadMore,
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

  const useModernPagination =
    effectiveSettings.usePagination &&
    effectiveSettings.paginationStyle === "modern";
  const explorerClassName = useModernPagination
    ? "explorer"
    : `explorer ${effectiveSettings.view === "cards" ? "explorer-notes-grid explorer-grid" : ""}`;

  const renderFiles = (files: typeof pageFileInfos) => {
    if (effectiveSettings.view === "cards") {
      return (
        <CardsView
          app={app}
          sourcePath={sourcePath}
          files={files}
          extForCard={extForCard}
          showTags={effectiveSettings.showTags}
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
      />
    );
  };

  const renderPageChunk = (files: typeof pageFileInfos, index: number) => {
    const shouldAnimate = index === animatedChunkIndex;

    return (
      <div
        key={`page-chunk-${index}`}
        className={`explorer-page-chunk${shouldAnimate ? " explorer-page-chunk--animated" : ""}${effectiveSettings.view === "cards" ? " explorer-page-chunk--grid" : ""}`}
      >
        {renderFiles(files)}
      </div>
    );
  };

  return (
    <>
      <ActionsBar
        useGlass={effectiveSettings.useGlass}
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
            {/* <Divider /> */}
          </>
        )}

      {effectiveSettings.showNotes && (
        <div className="explorer-files-container">
          <Divider />
          <div className={explorerClassName}>
            {useModernPagination
              ? visiblePageFileInfoChunks.map(renderPageChunk)
              : renderFiles(pageFileInfos)}
          </div>

          {usePaging && (!useModernPagination || canLoadMore) && (
            <>
              <br />
              {useModernPagination ? (
                <PaginationModern
                  canLoadMore={canLoadMore}
                  onLoadMore={loadMore}
                />
              ) : (
                <Pagination
                  app={app}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
