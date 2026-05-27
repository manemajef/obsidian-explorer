import React, { useCallback, useMemo } from "react";
import { Platform, TFolder } from "obsidian";
import { shouldDisplayNotes } from "../explorer/settings";
import { ExplorerModel } from "../explorer/model";
import { ExplorerFileNode } from "../explorer/nodes";
import { ExplorerActions } from "../explorer/actions";
import { useExplorerState } from "../explorer/state";
import type { ContextMenuConfig } from "./context-menu";
import { CardsView } from "./components/cards-view";
import { FolderButtons } from "./components/folder-view";
import { ListView } from "./components/list-view";
import { Pagination, PaginationModern } from "./components/pagination";
import { ActionsBar } from "./components/actions-bar";
import { Divider } from "./components/ui/layout";

interface ExplorerUIProps {
  model: ExplorerModel;
  onOpenSettings: () => void;
  onSavePluginSettings: () => void | Promise<void>;
  onRefresh: () => void;
}

export function ExplorerUI(props: ExplorerUIProps): React.JSX.Element {
  const { model, onOpenSettings, onSavePluginSettings, onRefresh } = props;
  const { app, settings } = model;
  const explorerState = useExplorerState(model);

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
    refreshMetadata,
  } = explorerState;

  const actions = useMemo(
    () =>
      new ExplorerActions(
        app,
        model.session,
        model.sourcePath,
        model.folder,
        model.pluginSettings,
        onSavePluginSettings,
        onRefresh,
        refreshMetadata,
      ),
    [
      app,
      model.session,
      model.sourcePath,
      model.folder,
      model.pluginSettings,
      onSavePluginSettings,
      onRefresh,
      refreshMetadata,
    ],
  );
  const onMoveIntoFolder = useCallback(
    (sourcePath: string, folder: TFolder, fromFolderNote: boolean) => {
      void actions.movePathIntoFolder(sourcePath, folder, fromFolderNote);
    },
    [actions],
  );
  const contextMenu: ContextMenuConfig = useMemo(() => ({ actions }), [actions]);

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

  const renderFiles = useCallback(
    (files: ExplorerFileNode[]) => {
      if (settings.view === "cards") {
        return (
          <CardsView
            model={model}
            files={files}
            extForCard={extForCard}
            actions={actions}
            contextMenu={contextMenu}
          />
        );
      }

      return (
        <ListView
          model={model}
          files={files}
          actions={actions}
          contextMenu={contextMenu}
        />
      );
    },
    [actions, contextMenu, extForCard, model, settings.view],
  );

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
      {/* {!Platform.isMobile && <Divider size="sm" />} */}
      <Divider size="sm" />
      <ActionsBar
        app={app}
        parentDropFolder={model.folder.parent}
        onMoveIntoFolder={onMoveIntoFolder}
        showParentNavigation={
          model.settings.showParentButton &&
          actions.canGoToParent(model.blockFile)
        }
        onOpenSettings={onOpenSettings}
        onGoToParent={(newLeaf) => void actions.goToParent(model.blockFile, newLeaf)}
        onNewFolder={() => void actions.createFolder()}
        onNewNote={() => void actions.createNote()}
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
            folders={model.folders}
            actions={actions}
            contextMenu={contextMenu}
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
