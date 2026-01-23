import { TFile, TFolder } from "obsidian";

export interface ExplorerSettings {
	sortBy: "newest" | "oldest" | "edited" | "name";
	view: "cards" | "list" | "tree";
	depth: number;
	pageSize: number;
	onlyNotes: boolean;
	showFolders: boolean;
	showBreadcrumbs: boolean;
	allowSearch: boolean;
	cardExt: "folder" | "ctime" | "mtime" | "desc" | "none" | "default";
	autoCollapseTree: boolean;
	showNotes: boolean;
}

export interface FileInfo {
	file: TFile;
	isPinned: boolean;
	isFav: boolean;
	description?: string;
	tags?: string[];
}

export interface FolderInfo {
	folder: TFolder;
	folderNote: TFile | null;
}
