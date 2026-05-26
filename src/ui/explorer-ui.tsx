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
import { moveIntoFolder } from "../explorer/move";
import { ConfirmationDialog } from "./modals/prompt-modal";
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
  const onOpenFolderNote = (folder: TFolder, newLeaf: boolean) =>
    void openOrCreateFolderNote(
      app,
      folder,
      model.pluginSettings,
      model.sourcePath,
      newLeaf,
      onSavePluginSettings,
    );
  const performMove = async (sourcePath: string, folder: TFolder) => {
    if (await moveIntoFolder(app, sourcePath, folder)) onRefresh();
  };
  const onMoveIntoFolder = (
    sourcePath: string,
    folder: TFolder,
    fromFolderNote: boolean,
  ) => {
    if (!fromFolderNote) return performMove(sourcePath, folder);

    const source = app.vault.getAbstractFileByPath(sourcePath);
    if (!(source instanceof TFolder)) return;

    const message = `This is a folder note. Dragging it to ${folder.name} will move the folder ${source.name} there.`;
    new ConfirmationDialog(
      app,
      "Move folder?",
      () => performMove(sourcePath, folder),
      undefined,
      message,
    ).open();
  };
  const contextMenu: ContextMenuConfig = {
    app,
    settings: model.pluginSettings,
    sourcePath: model.sourcePath,
    currentFolderPath: model.folder.path,
    savePluginSettings: onSavePluginSettings,
    onRefresh,
  };

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
          onMoveIntoFolder={onMoveIntoFolder}
          contextMenu={contextMenu}
        />
      );
    }

    return (
      <ListView
        model={model}
        files={files}
        onMoveIntoFolder={onMoveIntoFolder}
        contextMenu={contextMenu}
      />
    );
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
      {/* {!Platform.isMobile && <Divider size="sm" />} */}
      <Divider size="sm" />
      <ActionsBar
        app={app}
        parentDropFolder={model.folder.parent}
        onMoveIntoFolder={onMoveIntoFolder}
        showParentNavigation={
          model.settings.showParentButton &&
          canGoToParentFolderNote(app, model.pluginSettings, model.blockFile)
        }
        onOpenSettings={onOpenSettings}
        onGoToParent={(newLeaf) =>
          void goToParentFolderNote(app, model.pluginSettings, {
            currentFile: model.blockFile,
            newLeaf,
            savePluginSettings: onSavePluginSettings,
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
            app={app}
            folderInfos={model.folders}
            onOpenFolderNote={onOpenFolderNote}
            onMoveIntoFolder={onMoveIntoFolder}
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
