import React from "react";
import { App, TFolder } from "obsidian";
import { ExplorerSettings, FolderInfo } from "../types";
import { useExplorerState } from "./hooks/use-explorer-state";
import { Breadcrumbs } from "./components/breadcrumbs";
import { CardsView } from "./components/cards-view";
import { FolderButtons } from "./components/folder-buttons";
import { ListView } from "./components/list-view";
import { Pagination } from "./components/pagination";
import { SearchBar } from "./components/search-bar";
import { ActionsBar } from "./components/actions-bar";
import { TFile } from "obsidian";

interface ExplorerUIProps {
	app: App;
	sourcePath: string;
	folder: TFolder;
	effectiveSettings: ExplorerSettings;
	folderInfos: FolderInfo[];
	depthFiles: TFile[];
	folderNotes: TFile[];
	getAllFiles: () => Promise<TFile[]>;
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

	const {
		searchMode,
		searchQuery,
		toggleSearch,
		setSearchQuery,
		currentPage,
		setCurrentPage,
		pageFileInfos,
		totalPages,
		usePaging,
		extForCard,
	} = useExplorerState({
		app,
		depthFiles,
		folderNotes,
		settings: effectiveSettings,
		getAllFiles,
	});

	return (
		<>
			{effectiveSettings.showBreadcrumbs && (
				<Breadcrumbs app={app} sourcePath={sourcePath} folder={folder} />
			)}

			<ActionsBar
				onOpenSettings={onOpenSettings}
				onNewFolder={onNewFolder}
				onNewNote={onNewNote}
				onSearchToggle={toggleSearch}
				searchMode={searchMode}
			/>

			{effectiveSettings.showFolders && folderInfos.length > 0 && (
				<FolderButtons
					app={app}
					sourcePath={sourcePath}
					folderInfos={folderInfos}
				/>
			)}

			<div className="explorer-search-row">
				<div className="explorer-search-col">
					<SearchBar
						searchMode={searchMode}
						searchQuery={searchQuery}
						onSearchToggle={toggleSearch}
						onSearchInput={setSearchQuery}
					/>
				</div>
			</div>

			{effectiveSettings.showNotes && (
				<div className="explorer-files-container">
					<div
						className={`explorer ${effectiveSettings.view === "cards" ? "explorer-notes-grid explorer-grid" : ""}`}
					>
						{effectiveSettings.view === "cards" && (
							<CardsView
								app={app}
								sourcePath={sourcePath}
								files={pageFileInfos}
								extForCard={extForCard}
							/>
						)}
						{effectiveSettings.view === "list" && (
							<ListView
								app={app}
								sourcePath={sourcePath}
								files={pageFileInfos}
							/>
						)}
					</div>

					{usePaging && (
						<>
							<br />
							<Pagination
								app={app}
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={setCurrentPage}
							/>
						</>
					)}
				</div>
			)}
		</>
	);
}
