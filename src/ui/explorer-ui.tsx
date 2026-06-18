import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { TFile, TFolder } from "obsidian";
import { shouldDisplayNotes } from "../explorer/settings";
import { ExplorerModel } from "../explorer/model";
import { ExplorerFileNode } from "../explorer/lib/nodes";
import { ExplorerActions } from "../explorer/actions";
import { useExplorerState } from "./explorer-state";
import type { ContextMenuConfig } from "./context-menu";
import { CardsView } from "./components/cards-view";
import { ClassicPagination } from "./components/classic-pagination";
import { FolderButtons } from "./components/folder-view";
import { ListView } from "./components/list-view";
import { LoadMorePagination } from "./components/load-more-pagination";
import { ActionsBar } from "./components/actions-bar";
import { Divider, Gap } from "./components/primitives/layout";

interface ExplorerUIProps {
  model: ExplorerModel;
  onOpenSettings: () => void;
  onSavePluginSettings: () => void | Promise<void>;
  onRefresh: () => void;
  onSaveFolderNote?: () => void | Promise<void>;
  onRemoveFolderNoteFile?: (file: TFile) => void | Promise<void>;
}

export function ExplorerUI(props: ExplorerUIProps): React.JSX.Element {
  const {
    model,
    onOpenSettings,
    onSavePluginSettings,
    onRefresh,
    onSaveFolderNote,
    onRemoveFolderNoteFile,
  } = props;
  const { app, settings } = model;
  const explorerState = useExplorerState(model);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const currentPage =
    explorerState.paginationKind === "classic" && explorerState.totalPages > 1
      ? explorerState.currentPage
      : undefined;
  const prevPageRef = useRef(currentPage);

  useEffect(() => {
    if (
      currentPage !== undefined &&
      prevPageRef.current !== undefined &&
      prevPageRef.current !== currentPage
    ) {
      listContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
    prevPageRef.current = currentPage;
  }, [currentPage]);

  const {
    searchMode,
    searchQuery,
    toggleSearch,
    setSearchQuery,
    visibleFiles,
    canLoadMore,
    loadMore,
    paginationKind,
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
        onRemoveFolderNoteFile,
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
      onRemoveFolderNoteFile,
    ],
  );
  const onMoveIntoFolder = useCallback(
    (sourcePath: string, folder: TFolder, fromFolderNote: boolean) => {
      void actions.movePathIntoFolder(sourcePath, folder, fromFolderNote);
    },
    [actions],
  );
  const contextMenu: ContextMenuConfig = useMemo(
    () => ({ actions }),
    [actions],
  );

  const showFolders =
    settings.showFolders && model.folders.length > 0 && !searchMode;
  const showNotes = shouldDisplayNotes(settings);
  const compactActionBar = settings.compactActionBar;

  const renderFiles = useCallback(
    (files: ExplorerFileNode[]) => {
      if (settings.view === "cards") {
        return (
          <CardsView
            model={model}
            files={files}
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
    [actions, contextMenu, model, settings.view],
  );

  const showLoadMore = paginationKind === "load-more" && canLoadMore;
  const classicPagination =
    explorerState.paginationKind === "classic" && explorerState.totalPages > 1
      ? explorerState
      : null;
  const paginationGapSize = showLoadMore ? 6 : 4;
  const actionsBar = (
    <ActionsBar
      app={app}
      parentDropFolder={model.folder.parent}
      onMoveIntoFolder={onMoveIntoFolder}
      canGoToParent={actions.canGoToParent(model.location)}
      onOpenSettings={onOpenSettings}
      onSaveFolderNote={
        onSaveFolderNote ? () => void onSaveFolderNote() : undefined
      }
      onGoToParent={(newLeaf) =>
        void actions.goToParent(model.location, newLeaf)
      }
      onNewFolder={() => void actions.createFolder()}
      onNewNote={() => void actions.createNote()}
      onSearchToggle={toggleSearch}
      searchMode={searchMode}
      searchQuery={searchQuery}
      onSearchInput={setSearchQuery}
      compactActionBar={compactActionBar}
    />
  );

  return (
    <>
      <div className="explorer-action-bar-host">{actionsBar}</div>
      {showFolders && (
        <>
          <FolderButtons
            folders={model.folders}
            actions={actions}
            contextMenu={contextMenu}
          />
        </>
      )}

      {showNotes && (
        <div className="explorer-files-container" ref={listContainerRef}>
          {model.folders.length > 0 && model.settings.showFolders && (
            <Divider />
          )}

          <div>{renderFiles(visibleFiles)}</div>

          {(showLoadMore || classicPagination) && (
            <>
              <Gap size={paginationGapSize} />
              <Divider />
              {showLoadMore ? (
                <LoadMorePagination
                  canLoadMore={canLoadMore}
                  onLoadMore={loadMore}
                />
              ) : (
                <ClassicPagination
                  currentPage={classicPagination?.currentPage ?? 0}
                  totalPages={classicPagination?.totalPages ?? 1}
                  onPageChange={(page) => {
                    classicPagination?.setPage(page);
                  }}
                />
              )}
            </>
          )}
        </div>
      )}
      <Divider />
    </>
  );
}
