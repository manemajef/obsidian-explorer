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
		description: frontmatter?.description || frontmatter?.desc,
		tags: frontmatter?.tags || [],
	};
}

/**
 * Sort files by the given sort option
 */
export function sortFiles(
	files: TFile[],
	sortBy: "newest" | "oldest" | "edited" | "name"
): TFile[] {
	return [...files].sort((a, b) => {
		switch (sortBy) {
			case "newest":
				return b.stat.ctime - a.stat.ctime;
			case "oldest":
				return a.stat.ctime - b.stat.ctime;
			case "edited":
				return b.stat.mtime - a.stat.mtime;
			case "name":
				return a.name.localeCompare(b.name);
			default:
				return 0;
		}
	});
}

/**
 * Filter files by search query
 * Supports: plain text, #tag, @foldernote
 */
export function filterFiles(files: TFile[], query: string): TFile[] {
	if (!query) return files;

	const q = query.toLowerCase();

	// Tag search: #tagname
	if (q.startsWith("#")) {
		const tag = q.slice(1);
		return files.filter((f) => {
			const cache = (f as any).app?.metadataCache?.getFileCache(f);
			const tags = cache?.frontmatter?.tags || [];
			const tagList = Array.isArray(tags) ? tags : [String(tags)];
			return tagList.some((t: string) => t.toLowerCase().includes(tag));
		});
	}

	// Folder note search: @name
	if (q.startsWith("@")) {
		const term = q.slice(1);
		return files.filter((f) => {
			if (!isFolderNote(f)) return false;
			return f.basename.toLowerCase().includes(term);
		});
	}

	// Plain text search: name or path
	return files.filter(
		(f) =>
			f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
	);
}
