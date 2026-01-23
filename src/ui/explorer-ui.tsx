import React from "react";
import { App, TFile, TFolder } from "obsidian";
import { ExplorerSettings, FileInfo } from "../types";
import { FolderIndex } from "../services/folder-index";
import { Breadcrumbs } from "./components/breadcrumbs";
import { CardsView } from "./components/cards-view";
import { FolderButtons } from "./components/folder-buttons";
import { ListView } from "./components/list-view";
import { Pagination } from "./components/pagination";
import { SearchBar } from "./components/search-bar";
import { TreeView } from "./components/tree-view";
import { Icon } from "./components/shared";

interface ExplorerUIProps {
	app: App;
	sourcePath: string;
	folder: TFolder;
	settings: ExplorerSettings;
	folderIndex: FolderIndex;
	folderNotes: TFile[];
	fileInfos: FileInfo[];
	pageFiles: FileInfo[];
	usePaging: boolean;
	totalPages: number;
	currentPage: number;
	extForCard: string;
	searchMode: boolean;
	searchQuery: string;
	visibleCount: number;
	collapsedFolders: Set<string>;
	onOpenSettings: () => void;
	onNewFolder: () => void;
	onNewNote: () => void;
	onSearchToggle: () => void;
	onSearchInput: (query: string) => void;
	onCollapseToggle: () => void;
	onPageChange: (page: number) => void;
	onToggleFolder: (folderPath: string) => void;
}

export function ExplorerUI(props: ExplorerUIProps): JSX.Element {
	const {
		app,
		sourcePath,
		folder,
		settings,
		folderIndex,
		folderNotes,
		fileInfos,
		pageFiles,
		usePaging,
		totalPages,
		currentPage,
		extForCard,
		searchMode,
		searchQuery,
		visibleCount,
		collapsedFolders,
		onOpenSettings,
		onNewFolder,
		onNewNote,
		onSearchToggle,
		onSearchInput,
		onCollapseToggle,
		onPageChange,
		onToggleFolder,
	} = props;

	return (
		<>
			{settings.showBreadcrumbs ? (
				<Breadcrumbs app={app} sourcePath={sourcePath} folder={folder} />
			) : null}

			<FolderActions onOpenSettings={onOpenSettings} onNewFolder={onNewFolder} onNewNote={onNewNote} />

			{settings.showFolders && settings.view !== "tree" && folderNotes.length > 0 ? (
				<FolderButtons app={app} sourcePath={sourcePath} folderNotes={folderNotes} />
			) : null}

			<SearchBar
				searchMode={searchMode}
				searchQuery={searchQuery}
				allowSearch={settings.allowSearch}
				isTreeView={settings.view === "tree"}
				childrenSize={visibleCount}
				autoCollapseTree={settings.autoCollapseTree}
				onSearchToggle={onSearchToggle}
				onSearchInput={onSearchInput}
				onCollapseToggle={onCollapseToggle}
			/>

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
						{settings.view === "tree" ? (
							<TreeView
								app={app}
								sourcePath={sourcePath}
								files={fileInfos}
								folderIndex={folderIndex}
								settings={settings}
								collapsedFolders={collapsedFolders}
								onToggleFolder={onToggleFolder}
							/>
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

function FolderActions(props: {
	onOpenSettings: () => void;
	onNewFolder: () => void;
	onNewNote: () => void;
}): JSX.Element {
	const { onOpenSettings, onNewFolder, onNewNote } = props;

	return (
		<div className="folder-nav">
			<div className="explorer-actions-left" style={{ display: "flex", alignItems: "center", gap: "1em" }}>
				<button className="clickable-icon" onClick={onOpenSettings}>
					<Icon name="settings" />
				</button>

				<div
					className="explorer-actions-wrap"
					style={{
						display: "flex",
						gap: ".5em",
						borderInlineStart: "1px solid var(--background-modifier-border)",
						paddingInlineStart: "1em",
					}}
				>
					<button className="clickable-icon" onClick={onNewFolder}>
						<Icon name="folder-plus" />
					</button>
					<button className="clickable-icon" onClick={onNewNote}>
						<Icon name="file-plus-2" />
					</button>
				</div>
			</div>
		</div>
	);
}
