import { ExplorerSettings } from "./types";

export const DEFAULT_SETTINGS: ExplorerSettings = {
	sortBy: "oldest",
	view: "list",
	depth: 0,
	pageSize: 15,
	onlyNotes: false,
	showUnsupportedFiles: false,
	showFolders: true,
	showBreadcrumbs: false,
	cardExt: "default",
	showNotes: true,
	useGlass: true,
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

// Content files that most users want to see (vs code files)
export const SUPPORTED_EXTENSIONS = [
	"md",
	"pdf",
	"canvas",
	"docx",
	"doc",
	"pptx",
	"ppt",
	"xlsx",
	"xls",
	"csv",
	"txt",
	"rtf",
	"html",
	"epub",
];
