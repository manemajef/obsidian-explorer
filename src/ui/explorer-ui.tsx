import React, { useEffect, useState } from "react";
import { App, TFile, TFolder } from "obsidian";
import { ExplorerSettings, FolderInfo } from "../types";
import { GetAllContentOptions } from "../services/folder-index";
import { useExplorerSearch } from "./hooks/use-explorer-search";
import { useExplorerViewModel } from "./hooks/use-explorer-view-model";
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
  depthFiles: TFile[];
  folderNotes: TFile[];
  getAllFiles: (options?: GetAllContentOptions) => Promise<TFile[]>;
  onOpenSettings: () => void;
  onNewFolder: () => void;
  onNewNote: () => void;
}

export function ExplorerUI(props: ExplorerUIProps): JSX.Element {
  const {
    app,
    sourcePath,
    folder,
    effectiveSettings,
    folderInfos,
    depthFiles,
    folderNotes,
    getAllFiles,
    onOpenSettings,
    onNewFolder,
    onNewNote,
  } = props;

  const [currentPage, setCurrentPage] = useState(0);
  const { searchMode, searchQuery, setSearchQuery, toggleSearch, allFiles } =
    useExplorerSearch({ getAllFiles, clearOnClose: true });

  const { extForCard, pageFiles, totalPages, usePaging } = useExplorerViewModel(
    {
      app,
      settings: effectiveSettings,
      depthFiles,
      folderNotes,
      allFiles,
      searchQuery,
      currentPage,
    },
  );

  useEffect(() => {
    if (currentPage === 0) return;
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(totalPages - 1, 0));
    }
  }, [currentPage, totalPages]);

  const handleSearchInput = (query: string): void => {
    setSearchQuery(query);
    setCurrentPage(0);
  };

  return (
    <>
      {effectiveSettings.showBreadcrumbs ? (
        <Breadcrumbs app={app} sourcePath={sourcePath} folder={folder} />
      ) : null}

      <ActionsBar
        onOpenSettings={onOpenSettings}
        onNewFolder={onNewFolder}
        onNewNote={onNewNote}
        onSearchToggle={toggleSearch}
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
            onSearchToggle={toggleSearch}
            onSearchInput={handleSearchInput}
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
                onPageChange={setCurrentPage}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
