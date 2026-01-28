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
    isPinned: frontmatter?.pin === true || frontmatter?.fav === true,
  };
}

/**
 * Sort files by the given sort option, with pinned files first
 */
export function sortFiles(
  files: FileInfo[],
  sortBy: "newest" | "oldest" | "edited" | "name",
): FileInfo[] {
  return [...files].sort((a, b) => {
    // Pinned files first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    switch (sortBy) {
      case "newest":
        return b.file.stat.ctime - a.file.stat.ctime;
      case "oldest":
        return a.file.stat.ctime - b.file.stat.ctime;
      case "edited":
        return b.file.stat.mtime - a.file.stat.mtime;
      case "name":
        return a.file.name.localeCompare(b.file.name);
      default:
        return 0;
    }
  });
}

/**
 * Filter files by search query
 * Supports: plain text, #tag, @foldernote
 */
export function filterFiles(files: FileInfo[], query: string): FileInfo[] {
  if (!query) return files;

  const q = query.toLowerCase();

  // Tag search: #tagname
  if (q.startsWith("#")) {
    const tag = q.slice(1);
    return files.filter((fi) => {
      const tags = fi.tags || [];
      const tagList = Array.isArray(tags) ? tags : [String(tags)];
      return tagList.some((t: string) => t.toLowerCase().includes(tag));
    });
  }

  // Folder note search: @name
  if (q.startsWith("@")) {
    const term = q.slice(1);
    return files.filter((fi) => {
      if (!isFolderNote(fi.file)) return false;
      return fi.file.basename.toLowerCase().includes(term);
    });
  }

  // Plain text search: name or path
  return files.filter(
    (fi) =>
      fi.file.name.toLowerCase().includes(q) ||
      fi.file.path.toLowerCase().includes(q),
  );
}
