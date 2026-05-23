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

function sortQueryResultByRank<T>(
  items: T[],
  getRank: (item: T) => number,
): T[] {
  return items
    .map((item, index) => ({ item, rank: getRank(item), index }))
    .filter((entry) => entry.rank !== Infinity)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.item);
}

function rankText(text: string, query: string): number {
  if (text === query) return 0;
  if (text.startsWith(query)) return 1;
  if (text.includes(query)) return 2;
  return Infinity;
}

export function filterFiles(app: App, files: TFile[], query: string): TFile[] {
  const q = query.trim().toLowerCase();
  if (!q) return files;

  const tokens = q.split(/\s+/);

  return sortQueryResultByRank(files, (file) => {
    let totalRank = 0;

    for (const token of tokens) {
      const tokenRank = getTokenRank(app, file, token);

      // If any single token fails to match, the whole file is excluded
      if (tokenRank === Infinity) return Infinity;
      totalRank += tokenRank;
    }

    return totalRank;
  });
}

// token matcher
function getTokenRank(app: App, file: TFile, token: string): number {
  if (token.startsWith("#")) {
    return rankTagToken(app, file, token.slice(1));
  }
  if (token.startsWith("@") && token.length > 1) {
    return isFolderNote(file)
      ? rankText(file.basename.toLowerCase(), token.slice(1))
      : Infinity;
  }
  return rankGeneralToken(file, token);
}

function rankTagToken(app: App, file: TFile, tagQuery: string): number {
  const fileTags = getFileTags(app, file).map((t) => t.toLowerCase());
  let minRank = Infinity;

  for (const fileTag of fileTags) {
    // Nested tags support (e.g., #parent/child)
    const tagParts = fileTag.split("/");
    const partRanks = tagParts.map((part) => rankText(part, tagQuery));

    minRank = Math.min(minRank, ...partRanks, rankText(fileTag, tagQuery) + 1);
  }
  return minRank;
}

function rankGeneralToken(file: TFile, token: string): number {
  const fileBaseName = file.basename.toLowerCase();
  const filePath = file.path.toLowerCase();

  // Matching basename (0 penalty) or full path (1 penalty)
  return Math.min(rankText(fileBaseName, token), rankText(filePath, token) + 1);
}
