import { TFile } from "obsidian";
import { BlockSettings, DisplayedNotes } from "../settings";
import { isFolderNote } from "./folder-note";

const DEFAULT_DISPLAY_EXTENSIONS = [
  "md",
  "pdf",
  "base",
  "canva",
  "jpeg",
  "jpg",
  "png",
  "svg",
];

export type ExplorerListingFile = {
  file: TFile;
  path: string;
  name: string;
  basename: string;
  extension: string;
  isMarkdown: boolean;
  isFolderNote: boolean;
  isPinned: boolean;
  tags: string[];
};

export type ExplorerListing<T extends ExplorerListingFile> = T[];

export function buildExplorerListing<T extends ExplorerListingFile>(input: {
  files: T[];
  settings: BlockSettings;
  sourcePath: string;
  query: string;
  sortBy: BlockSettings["sortBy"];
}): ExplorerListing<T> {
  const { files, settings, sourcePath, query, sortBy } = input;
  const visibleFiles = filterDisplayedFiles(
    files.filter((file) => file.path !== sourcePath),
    settings.displayedNotes,
  );
  const sortedFiles = sortFiles(visibleFiles, sortBy);
  const queriedFiles = query ? filterFiles(sortedFiles, query) : sortedFiles;

  return queriedFiles;
}

export function shouldIndexFile(file: TFile): boolean {
  return !isFolderNote(file);
}

export function filterDisplayedFiles<T extends ExplorerListingFile>(
  files: T[],
  displayedNotes: DisplayedNotes,
): T[] {
  switch (displayedNotes) {
    case "none":
      return [];
    case "markdown":
      return files.filter(
        (file) => file.isMarkdown && !(file.isFolderNote && !file.isPinned),
      );
    case "supported":
      return files.filter((file) =>
        DEFAULT_DISPLAY_EXTENSIONS.includes(file.extension.toLowerCase()),
      );
    case "all":
      return files;
  }
}

function sortFiles<T extends ExplorerListingFile>(
  files: T[],
  sortBy: "newest" | "oldest" | "edited" | "name" | "nameDesc",
): T[] {
  const pinned: T[] = [];
  const rest: T[] = [];
  for (const file of files) {
    (file.isPinned ? pinned : rest).push(file);
  }

  const compareFn = (a: T, b: T) => {
    switch (sortBy) {
      case "newest":
        return b.file.stat.ctime - a.file.stat.ctime;
      case "oldest":
        return a.file.stat.ctime - b.file.stat.ctime;
      case "edited":
        return b.file.stat.mtime - a.file.stat.mtime;
      case "name":
        return a.name.localeCompare(b.name);
      case "nameDesc":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  };

  pinned.sort(compareFn);
  rest.sort(compareFn);
  return [...pinned, ...rest];
}

function filterFiles<T extends ExplorerListingFile>(
  files: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return files;

  const tokens = q.split(/\s+/);

  return sortQueryResultByRank(files, (file) => {
    let totalRank = 0;

    for (const token of tokens) {
      const tokenRank = getTokenRank(file, token);

      if (tokenRank === Infinity) return Infinity;
      totalRank += tokenRank;
    }

    return totalRank;
  });
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

function getTokenRank(file: ExplorerListingFile, token: string): number {
  if (token.startsWith("#")) {
    return rankTagToken(file, token.slice(1));
  }
  if (token.startsWith("@") && token.length > 1) {
    return file.isFolderNote
      ? rankText(file.basename.toLowerCase(), token.slice(1))
      : Infinity;
  }
  return rankGeneralToken(file, token);
}

function rankTagToken(file: ExplorerListingFile, tagQuery: string): number {
  const fileTags = file.tags.map((tag) => tag.toLowerCase());
  let minRank = Infinity;

  for (const fileTag of fileTags) {
    const tagParts = fileTag.split("/");
    const partRanks = tagParts.map((part) => rankText(part, tagQuery));

    minRank = Math.min(minRank, ...partRanks, rankText(fileTag, tagQuery) + 1);
  }
  return minRank;
}

function rankGeneralToken(file: ExplorerListingFile, token: string): number {
  const fileBaseName = file.basename.toLowerCase();
  const filePath = file.path.toLowerCase();

  return Math.min(rankText(fileBaseName, token), rankText(filePath, token) + 1);
}

function rankText(text: string, query: string): number {
  if (text === query) return 0;
  if (text.startsWith(query)) return 1;
  if (text.includes(query)) return 2;
  return Infinity;
}
