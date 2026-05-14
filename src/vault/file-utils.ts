import { App, getAllTags, TFile, TFolder } from "obsidian";
import { FileInfo } from "../types";

/**
 * Check if text contains RTL characters (Hebrew/Arabic)
 */
export function isRtl(text?: string): boolean {
  let checkText = text || "";
  if (!checkText) {
    const activeFile = (
      window as unknown as {
        app?: { workspace?: { getActiveFile?: () => TFile | null } };
      }
    ).app?.workspace?.getActiveFile?.();
    checkText = activeFile?.basename || "";
  }
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
  return rtlRegex.test(checkText);
}

/**
 * Format timestamp as relative time string
 */
export function diffDays(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

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
export function getFolderNoteForFolder(
  app: App,
  folder: TFolder,
): TFile | null {
  const folderNotePath = `${folder.path}/${folder.name}.md`;
  const file = app.vault.getAbstractFileByPath(folderNotePath);
  return file instanceof TFile ? file : null;
}

/**
 * Check if a file is pinned via frontmatter
 */
export function isPinned(app: App, file: TFile): boolean {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter;
  return fm?.pin === true;
}

function getFileTags(app: App, file: TFile): string[] {
  const cache = app.metadataCache.getFileCache(file);
  if (!cache) return [];
  return getAllTags(cache)?.map((t) => t.replace(/^#+\s*/g, "")) ?? [];
}

function togglePin(app: App, file: TFile): void {
  void app.fileManager.processFrontMatter(
    file,
    (frontmatter: Record<string, unknown>) => {
      if (isPinned(app, file)) {
        delete frontmatter["pin"];
      } else {
        frontmatter["pin"] = true;
      }
    },
  );
}

export function getFileInfo(app: App, file: TFile): FileInfo {
  const cache = app.metadataCache.getFileCache(file);
  const frontmatter = cache?.frontmatter;
  const tags = getFileTags(app, file);
  return {
    file,
    description: (frontmatter?.description || frontmatter?.desc) as
      | string
      | undefined,
    tags: tags,
    isPinned: isPinned(app, file),
    togglePin: () => togglePin(app, file),
  };
}

/**
 * Sort TFiles by the given sort option, with pinned files first
 */
export function sortFiles(
  app: App,
  files: TFile[],
  sortBy: "newest" | "oldest" | "edited" | "name",
): TFile[] {
  const pinned: TFile[] = [];
  const rest: TFile[] = [];
  for (const f of files) {
    (isPinned(app, f) ? pinned : rest).push(f);
  }

  const compareFn = (a: TFile, b: TFile) => {
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
  };

  pinned.sort(compareFn);
  rest.sort(compareFn);
  return [...pinned, ...rest];
}

/**
 * Filter TFiles by search query
 * Supports: plain text, #tag, @foldernote
 */
export function filterFiles(app: App, files: TFile[], query: string): TFile[] {
  if (!query) return files;

  const q = query.toLowerCase();

  // Tag search: #tagname
  if (q.startsWith("#")) {
    const tag = q.slice(1);
    return files.filter((f) => {
      const tags = (getFileTags(app, f) || []) as string | string[];
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
      f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q),
  );
}
