import { ExplorerSettings } from "./types";

export const DEFAULT_SETTINGS: ExplorerSettings = {
	sortBy: "oldest",
	view: "list",
	depth: 0,
	pageSize: 15,
	onlyNotes: false,
	showFolders: true,
	showBreadcrumbs: false,
	allowSearch: true,
	cardExt: "default",
	autoCollapseTree: false,
	showNotes: true,
};
export const FOLDERNOTE_TEMPLATE = "\n```explorer\n```\n"

export const EXCLUDED_EXTENSIONS = [
	"json",
	"png",
	"jpeg",
	"jpg",
	"svg",
	"gif",
	"webp",
];
