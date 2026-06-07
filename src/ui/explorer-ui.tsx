import React, { useCallback, useMemo, useRef } from "react";
import { Platform, TFolder } from "obsidian";
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

interface ExplorerUIProps {
  model: ExplorerModel;
  onOpenSettings: () => void;
  onSavePluginSettings: () => void | Promise<void>;
  onRefresh: () => void;
  onSaveFolderNote?: () => void | Promise<void>;
}

export function ExplorerUI(props: ExplorerUIProps): React.JSX.Element {
  const {
    model,
    onOpenSettings,
    onSavePluginSettings,
    onRefresh,
    onSaveFolderNote,
  } = props;
  const { app, settings } = model;
  const explorerState = useExplorerState(model);
  const listContainerRef = useRef<HTMLDivElement>(null);

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
  const contextMenu: ContextMenuConfig = useMemo(
    () => ({ actions }),
    [actions],
  );

  const showFolders =
    settings.showFolders && model.folders.length > 0 && !searchMode;
  const showNotes = shouldDisplayNotes(settings);
  const isCardsView = settings.view === "cards";

  const filesDividerSize = isCardsView || Platform.isMobile ? "lg" : "sm";
  // : !Platform.isMobile && model.folders.length <= 0
  //   ? "sm"
  //   : "md";
  const folderDivider = Platform.isMobile
    ? model.pluginSettings.useGlass
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

  return (
    <>
      {/* {!Platform.isMobile && <Divider size="sm" />} */}
      <Divider size="sm" />
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
        useGlass={model.pluginSettings.useGlass}
      />
      {showFolders && (
        <>
          <Divider size={folderDivider} />
          <FolderButtons
            folders={model.folders}
            actions={actions}
            contextMenu={contextMenu}
          />
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
                  useGlass={model.pluginSettings.useGlass}
                />
              ) : (
                <Pagination
                  currentPage={classicPagination?.currentPage ?? 0}
                  totalPages={classicPagination?.totalPages ?? 1}
                  onPageChange={(page) => {
                    classicPagination?.setPage(page);
                    const element = listContainerRef.current;
                    const scrollContainer = element?.closest(
                      ".markdown-preview-view, .view-content",
                    );
                    if (element && scrollContainer) {
                      const elementRect = element.getBoundingClientRect();
                      const containerRect = scrollContainer.getBoundingClientRect();
                      const targetScrollTop =
                        scrollContainer.scrollTop +
                        elementRect.top -
                        containerRect.top;
                      scrollContainer.scrollTo({
                        top: targetScrollTop,
                        behavior: "smooth",
                      });
                    }
                  }}
                  useGlass={model.pluginSettings.useGlass}
                />
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
