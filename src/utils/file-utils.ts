import { App, TFile, TFolder } from "obsidian";
import { FileInfo } from "../types";

/**
 * Check if a file is a folder note (foldername/foldername.md pattern)
 */
export function isFolderNote(file: TFile): boolean {
	if (!file.parent) return false;
	return file.basename === file.parent.name;
}

/**
 * Get the folder note for a given folder if it exists
 */
export function getFolderNoteForFolder(app: App, folder: TFolder): TFile | null {
	const folderNotePath = `${folder.path}/${folder.name}.md`;
	const file = app.vault.getAbstractFileByPath(folderNotePath);
	return file instanceof TFile ? file : null;
}

/**
 * Get file metadata from frontmatter cache
 */
export function getFileInfo(app: App, file: TFile): FileInfo {
	const cache = app.metadataCache.getFileCache(file);
	const frontmatter = cache?.frontmatter;

	return {
		file,
		isPinned: frontmatter?.pin === true,
		isFav: frontmatter?.fav === true,
		description: frontmatter?.description || frontmatter?.desc,
		tags: frontmatter?.tags || [],
	};
}
