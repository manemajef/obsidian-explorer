import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { BlockSettings, shouldDisplayNotes } from "../explorer/settings";
import { ExplorerModel } from "../explorer/model";
import { ExplorerFileNode } from "../explorer/model";
import { useExplorerState } from "./explorer-state";
import type { ContextMenuConfig } from "./context-menu";
import { CardsView } from "./components/cards-view";
import { ClassicPagination } from "./components/classic-pagination";
import { FolderButtons } from "./components/folder-view";
import { ListView } from "./components/list-view";
import { LoadMorePagination } from "./components/load-more-pagination";
import { ExplorerToolbar } from "./components/toolbar";
import { Divider } from "./components/primitives/layout";
import type { Explorer } from "../explorer/api";

interface ExplorerUIProps {
  model: ExplorerModel;
  explorer: Explorer;
  onOpenSettings: () => void;
  onSettingsChange: (settings: BlockSettings) => void;
  onRefresh: () => void;
}

export function ExplorerUI(props: ExplorerUIProps): React.JSX.Element {
  const {
    model,
    explorer,
    onOpenSettings,
    onSettingsChange,
    onRefresh,
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
  } = explorerState;

  const onMoveIntoFolder = useCallback(
    (
      sourcePath: string,
      folder: Parameters<Explorer["movePathIntoFolder"]>[1],
      fromFolderNote: boolean,
    ) => {
      void explorer
        .movePathIntoFolder(sourcePath, folder, fromFolderNote)
        .then((changed) => {
          if (changed) onRefresh();
        });
    },
    [explorer, onRefresh],
  );
  const contextMenu: ContextMenuConfig = useMemo(
    () => ({
      app,
      sourcePath: model.sourcePath,
      currentFolder: model.folder,
      explorer,
      onChanged: onRefresh,
    }),
    [app, explorer, model.folder, model.sourcePath, onRefresh],
  );

  const showFolders =
    settings.showFolders && model.folders.length > 0 && !searchMode;
  const showNotes = shouldDisplayNotes(settings);
  const disableGlassToolbar = settings.disableGlassToolbar;

  const renderFiles = useCallback(
    (files: ExplorerFileNode[]) => {
      if (settings.view === "cards") {
        return (
          <CardsView
            model={model}
            files={files}
            explorer={explorer}
            contextMenu={contextMenu}
          />
        );
      }

      return (
        <ListView
          model={model}
          files={files}
          explorer={explorer}
          contextMenu={contextMenu}
        />
      );
    },
    [contextMenu, explorer, model, settings.view],
  );

  const showLoadMore = paginationKind === "load-more" && canLoadMore;
  const classicPagination =
    explorerState.paginationKind === "classic" && explorerState.totalPages > 1
      ? explorerState
      : null;
  const paginationGapSize = showLoadMore ? 6 : 4;
  const toolbar = (
    <ExplorerToolbar
      app={app}
      settings={settings}
      parentDropFolder={model.folder.parent}
      onMoveIntoFolder={onMoveIntoFolder}
      canGoToParent={explorer.canGoToParent()}
      onOpenSettings={onOpenSettings}
      onSettingsChange={onSettingsChange}
      onAddMarkdownBacking={
        model.location.file === null
          ? () => void explorer.addMarkdownBacking(settings)
          : undefined
      }
      onGoToParent={(newLeaf) => void explorer.goToParent(newLeaf)}
      onNewFolder={() => void explorer.createFolder()}
      onNewNote={() => void explorer.createNote()}
      onSearchToggle={toggleSearch}
      searchMode={searchMode}
      searchQuery={searchQuery}
      onSearchInput={setSearchQuery}
      disableGlassToolbar={disableGlassToolbar}
    />
  );

  return (
    <>
      <div className="explorer-toolbar-host">{toolbar}</div>
      {showFolders && (
        <>
          <FolderButtons
            folders={model.folders}
            explorer={explorer}
            contextMenu={contextMenu}
            missingFolderLinkCreatesMarkdown={
              model.missingFolderLinkCreatesMarkdown
            }
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
              <Divider size={paginationGapSize} />
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
