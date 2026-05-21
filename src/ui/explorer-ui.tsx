import React from "react";
import { App, Platform, TFile, TFolder } from "obsidian";
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
  effectiveSettings: BlockSettings;
  folderInfos: FolderInfo[];
  depthFiles: TFile[];
  folderNotes: TFile[];
  getAllFiles: () => Promise<TFile[]>;
  showParentNavigation: boolean;
  onOpenSettings: () => void;
  onGoToParent: (newLeaf: boolean) => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onOpenFolderNote: (folder: TFolder, newLeaf: boolean) => void;
}

export function ExplorerUI(props: ExplorerUIProps): React.JSX.Element {
  const {
    app,
    sourcePath,
    effectiveSettings,
    folderInfos,
    depthFiles,
    folderNotes,
    getAllFiles,
    showParentNavigation,
    onOpenSettings,
    onGoToParent,
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

  const showFolders =
    effectiveSettings.showFolders && folderInfos.length > 0 && !searchMode;
  const showNotes = shouldDisplayNotes(effectiveSettings);
  const isCardsView = effectiveSettings.view === "cards";

  const filesDividerSize =
    isCardsView || Platform.isMobile
      ? "lg"
      : !Platform.isMobile && folderInfos.length <= 0
        ? "sm"
        : "md";
  const folderDivider = Platform.isMobile ? "md" : "lg";

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
  const paginationDividerSize = showLoadMore ? "md" : "sm";

  return (
    <>
      {effectiveSettings.useGlass && <Divider size="sm" />}

      <ActionsBar
        showParentNavigation={showParentNavigation}
        onOpenSettings={onOpenSettings}
        onGoToParent={onGoToParent}
        onNewFolder={onNewFolder}
        onNewNote={onNewNote}
        onSearchToggle={toggleSearch}
        searchMode={searchMode}
        searchQuery={searchQuery}
        onSearchInput={setSearchQuery}
      />

      {showFolders && (
        <>
          <Divider size={folderDivider} />

          <FolderButtons
            folderInfos={folderInfos}
            onOpenFolderNote={onOpenFolderNote}
          />
        </>
      )}

      {showNotes && (
        <div className="explorer-files-container">
          <Divider size={filesDividerSize} />
          {/* <Divider size=  /> */}

          <div>{renderFiles(visibleFiles)}</div>

          {(showLoadMore || classicPagination) && (
            <>
              <Divider size={paginationDividerSize} />
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
