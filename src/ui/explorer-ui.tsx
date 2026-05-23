import React from "react";
import { Platform, TFolder } from "obsidian";
import { FileInfo } from "../types";
import { shouldDisplayNotes } from "../explorer/settings";
import { ExplorerModel } from "../explorer/model";
import { useExplorerState } from "../explorer/state";
import {
  canGoToParentFolderNote,
  goToParentFolderNote,
  openOrCreateFolderNote,
} from "../explorer/navigation";
import { promptAndCreateFolder, promptAndCreateNote } from "../explorer/create";
import { CardsView } from "./components/cards-view";
import { FolderButtons } from "./components/folder-view";
import { ListView } from "./components/list-view";
import { Pagination, PaginationModern } from "./components/pagination";
import { ActionsBar } from "./components/actions-bar";
import { Divider } from "./components/ui/layout";

interface ExplorerUIProps {
  model: ExplorerModel;
  onOpenSettings: () => void;
}

export function ExplorerUI(props: ExplorerUIProps): React.JSX.Element {
  const { model, onOpenSettings } = props;
  const { app, settings } = model;
  const explorerState = useExplorerState(model);
  const onOpenFolderNote = (folder: TFolder, newLeaf: boolean) =>
    void openOrCreateFolderNote(
      app,
      folder,
      model.pluginSettings,
      model.sourcePath,
      newLeaf,
    );

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
    settings.showFolders && model.folders.length > 0 && !searchMode;
  const showNotes = shouldDisplayNotes(settings);
  const isCardsView = settings.view === "cards";

  const filesDividerSize = isCardsView || Platform.isMobile ? "lg" : "sm";
  // : !Platform.isMobile && model.folders.length <= 0
  //   ? "sm"
  //   : "md";
  const folderDivider = Platform.isMobile
    ? model.settings.useGlass
      ? "md"
      : "sm"
    : "md";

  const renderFiles = (files: FileInfo[]) => {
    if (settings.view === "cards") {
      return (
        <CardsView
          model={model}
          files={files}
          extForCard={extForCard}
          onOpenFolderNote={onOpenFolderNote}
        />
      );
    }

    return <ListView model={model} files={files} />;
  };

  const showLoadMore = paginationKind === "load-more" && canLoadMore;
  const classicPagination =
    explorerState.paginationKind === "classic" && explorerState.totalPages > 1
      ? explorerState
      : null;
  const paginationDividerSize = showLoadMore ? "md" : "sm";
  // const TOP_DIVIDER = false;

  return (
    <>
      {/* {settings.useGlass && TOP_DIVIDER && <Divider size="sm" />} */}
      {!Platform.isMobile && <Divider size="sm" />}
      <ActionsBar
        showParentNavigation={
          settings.showParentButton &&
          canGoToParentFolderNote(app, model.pluginSettings, model.blockFile)
        }
        onOpenSettings={onOpenSettings}
        onGoToParent={(newLeaf) =>
          void goToParentFolderNote(app, model.pluginSettings, {
            currentFile: model.blockFile,
            newLeaf,
          })
        }
        onNewFolder={() => void promptAndCreateFolder(app, model.folder.path)}
        onNewNote={() => void promptAndCreateNote(app, model.folder.path)}
        onSearchToggle={toggleSearch}
        searchMode={searchMode}
        searchQuery={searchQuery}
        onSearchInput={setSearchQuery}
      />

      {showFolders && (
        <>
          {/* {!(Platform.isMobile && !model.settings.useGlass) && (
            <Divider size={folderDivider} />
          )} */}
          <Divider size={folderDivider} />
          <FolderButtons
            folderInfos={model.folders}
            onOpenFolderNote={onOpenFolderNote}
          />
        </>
      )}

      {showNotes && (
        <div className="explorer-files-container">
          <Divider size={filesDividerSize} />

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
