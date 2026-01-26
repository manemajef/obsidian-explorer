import React from "react";
import { App, TFolder } from "obsidian";
import { ExplorerSettings, FileInfo, FolderInfo } from "../types";
import { Breadcrumbs } from "./components/breadcrumbs";
import { CardsView } from "./components/cards-view";
import { FolderButtons } from "./components/folder-buttons";
import { ListView } from "./components/list-view";
import { Pagination } from "./components/pagination";
import { SearchBar } from "./components/search-bar";
import { ActionsBar } from "./components/actions-bar";
interface ExplorerUIProps {
  app: App;
  sourcePath: string;
  folder: TFolder;
  effectiveSettings: ExplorerSettings;
  folderInfos: FolderInfo[];
  pageFiles: FileInfo[];
  usePaging: boolean;
  totalPages: number;
  currentPage: number;
  extForCard: string;
  searchMode: boolean;
  searchQuery: string;
  onOpenSettings: () => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onSearchToggle: () => void;
  onSearchInput: (query: string) => void;
  onPageChange: (page: number) => void;
}

export function ExplorerUI(props: ExplorerUIProps): JSX.Element {
  const {
    app,
    sourcePath,
    folder,
    effectiveSettings,
    folderInfos,
    pageFiles,
    usePaging,
    totalPages,
    currentPage,
    extForCard,
    searchMode,
    searchQuery,
    onOpenSettings,
    onNewFolder,
    onNewNote,
    onSearchToggle,
    onSearchInput,
    onPageChange,
  } = props;

  return (
    <>
      {effectiveSettings.showBreadcrumbs ? (
        <Breadcrumbs app={app} sourcePath={sourcePath} folder={folder} />
      ) : null}

      <ActionsBar
        onOpenSettings={onOpenSettings}
        onNewFolder={onNewFolder}
        onNewNote={onNewNote}
        onSearchToggle={onSearchToggle}
        searchMode={searchMode}
      />

      {effectiveSettings.showFolders && folderInfos.length > 0 ? (
        <FolderButtons
          app={app}
          sourcePath={sourcePath}
          folderInfos={folderInfos}
        />
      ) : null}
      <div className="explorer-search-row">
        <div className="explorer-search-col">
          <SearchBar
            searchMode={searchMode}
            searchQuery={searchQuery}
            onSearchToggle={onSearchToggle}
            onSearchInput={onSearchInput}
          />
        </div>
        {/* <div style={{ display: "flex" }}>
          <button className="clickable-icon" onClick={onNewNote}>
            <Icon name="plus" />
          </button>
        </div> */}
      </div>

      {effectiveSettings.showNotes ? (
        <div className="explorer-files-container">
          <div
            className={`explorer ${effectiveSettings.view === "cards" ? "explorer-notes-grid explorer-grid" : ""}`}
          >
            {effectiveSettings.view === "cards" ? (
              <CardsView
                app={app}
                sourcePath={sourcePath}
                files={pageFiles}
                extForCard={extForCard}
              />
            ) : null}
            {effectiveSettings.view === "list" ? (
              <ListView app={app} sourcePath={sourcePath} files={pageFiles} />
            ) : null}
          </div>

          {usePaging ? (
            <>
              <br />
              <Pagination
                app={app}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
