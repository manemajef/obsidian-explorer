import React from "react";
import { App, TFolder } from "obsidian";
import { ExplorerSettings, FileInfo, FolderInfo } from "../types";
import { Breadcrumbs } from "./components/breadcrumbs";
import { CardsView } from "./components/cards-view";
import { FolderButtons } from "./components/folder-buttons";
import { ListView } from "./components/list-view";
import { Pagination } from "./components/pagination";
import { SearchBar } from "./components/search-bar";
import { Icon } from "./components/shared";
interface ExplorerUIProps {
  app: App;
  sourcePath: string;
  folder: TFolder;
  settings: ExplorerSettings;
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
    settings,
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
      {settings.showBreadcrumbs ? (
        <Breadcrumbs app={app} sourcePath={sourcePath} folder={folder} />
      ) : null}

      <FolderActions
        onOpenSettings={onOpenSettings}
        onNewFolder={onNewFolder}
        onNewNote={onNewNote}
        onSearchToggle={onSearchToggle}
        searchMode={searchMode}
      />

      {settings.showFolders && folderInfos.length > 0 ? (
        <FolderButtons
          app={app}
          sourcePath={sourcePath}
          folderInfos={folderInfos}
        />
      ) : null}
      <div
        style={{
          // border: "solid 1px red",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: "1" }}>
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

      {settings.showNotes ? (
        <div className="explorer-files-container">
          <div
            className={`explorer ${settings.view === "cards" ? "explorer-notes-grid explorer-grid" : ""}`}
          >
            {settings.view === "cards" ? (
              <CardsView
                app={app}
                sourcePath={sourcePath}
                files={pageFiles}
                extForCard={extForCard}
              />
            ) : null}
            {settings.view === "list" ? (
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

// function NotesAction(props: {
//   onNewNote: () => void;

// }): JSX.Element {

// }

function FolderActions(props: {
  onOpenSettings: () => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onSearchToggle: () => void;
  searchMode: boolean;
}): JSX.Element {
  const { onOpenSettings, onNewFolder, onNewNote, onSearchToggle, searchMode } =
    props;

  return (
    <div
      id="explorer-actions"
      className="folder-nav justify-between"
      style={{ marginBottom: "1em" }}
    >
      {/* <div
        className="explorer-actions-left"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1em",
        }}
      > */}
      <div className="flex gap-2">
        <button className="clickable-icon action-icon" onClick={onOpenSettings}>
          <Icon name="settings-2" />
        </button>
        {/* <SearchBar /> */}
      </div>
      <div>
        <div className="flex">
          <div className="action-icons">
            <button className="clickable-icon" onClick={onNewFolder}>
              <Icon name="folder-plus" />
            </button>
            <button className="clickable-icon" onClick={onNewNote}>
              <Icon name="file-plus-2" />
            </button>
          </div>
          <div
            className="explorer-actions-wrap flex gap-2"
            style={{
              display: "flex",
              gap: ".5em",
              borderInlineStart: "1px solid var(--background-modifier-border)",
              paddingInlineStart: "1em",
              marginInlineStart: "1em",
            }}
          >
            <button
              type="button"
              className="clickable-icon action-icon"
              onClick={onSearchToggle}
            >
              <Icon name={searchMode ? "undo-2" : "search"} />
            </button>
          </div>
        </div>
      </div>
      {/* </div> */}
    </div>
  );
}
