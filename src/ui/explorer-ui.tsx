import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, TFile, TFolder } from "obsidian";
import { shouldDisplayNotes } from "../explorer/settings";
import { ExplorerModel } from "../explorer/model";
import { ExplorerFileNode } from "../explorer/lib/nodes";
import { ExplorerActions } from "../explorer/actions";
import { useExplorerState } from "./explorer-state";
import type { ContextMenuConfig } from "./context-menu";
import { CardsView } from "./components/cards-view";
import { FolderButtons } from "./components/folder-view";
import { ListView } from "./components/list-view";
import { Pagination, PaginationModern } from "./components/pagination";
import { ActionsBar } from "./components/actions-bar";
import { Divider } from "./components/ui/layout";
import {
  ActionBarV2,
  CardsViewV2,
  FolderButtonsV2,
  ListViewV2,
} from "./components/v2";

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
  const isCardsView = settings.view === "cards";
  const compactActionBar = settings.compactActionBar;

  const filesDividerSize =
    compactActionBar && !showFolders
      ? "sm"
      : isCardsView || Platform.isMobile
        ? "lg"
        : "sm";
  // : !Platform.isMobile && model.folders.length <= 0
  //   ? "sm"
  //   : "md";
  const folderDivider = compactActionBar ? "sm" : "md";
  const USE_V2 = true;

  const renderFiles = useCallback(
    (files: ExplorerFileNode[]) => {
      if (USE_V2) {
        if (settings.view === "cards") {
          return (
            <CardsViewV2
              model={model}
              actions={actions}
              contextMenu={contextMenu}
              files={files}
            />
          );
        }
        return (
          <ListViewV2
            model={model}
            files={files}
            actions={actions}
            contextMenu={contextMenu}
          />
        );
      }
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
  const paginationDividerSize = showLoadMore ? "md" : "sm";

  return (
    <>
      {/* {!Platform.isMobile && <Divider size="sm" />} */}
      <Divider size="sm" />
      {USE_V2 ? (
        <ActionBarV2
          app={app}
          parentDropFolder={model.folder.parent}
          onMoveIntoFolder={onMoveIntoFolder}
          showParentNavigation={
            model.pluginSettings.showParentButton &&
            actions.canGoToParent(model.location)
          }
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
      ) : (
        <ActionsBar
          app={app}
          parentDropFolder={model.folder.parent}
          onMoveIntoFolder={onMoveIntoFolder}
          showParentNavigation={
            model.pluginSettings.showParentButton &&
            actions.canGoToParent(model.location)
          }
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
      )}

      {showFolders && (
        <>
          <Divider size={folderDivider} />
          {USE_V2 ? (
            <FolderButtonsV2
              folders={model.folders}
              actions={actions}
              contextMenu={contextMenu}
            />
          ) : (
            <FolderButtons
              folders={model.folders}
              actions={actions}
              contextMenu={contextMenu}
            />
          )}
        </>
      )}

      {showNotes && (
        <div className="explorer-files-container" ref={listContainerRef}>
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
                  onPageChange={(page) => {
                    classicPagination?.setPage(page);
                  }}
                />
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
