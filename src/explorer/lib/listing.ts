import { TFile } from "obsidian";
import { BlockSettings, DisplayedNotes } from "../settings";
import { isFolderNote } from "./folder-note";
import { ExplorerFileNode } from "./nodes";

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

export type ExplorerListing = ExplorerFileNode[];

export function buildExplorerListing(input: {
  files: ExplorerFileNode[];
  settings: BlockSettings;
  sourcePath: string;
  query: string;
  sortBy: BlockSettings["sortBy"];
}): ExplorerListing {
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

export function filterDisplayedFiles(
  files: ExplorerFileNode[],
  displayedNotes: DisplayedNotes,
): ExplorerFileNode[] {
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

function sortFiles(
  files: ExplorerFileNode[],
  sortBy: "newest" | "oldest" | "edited" | "name" | "nameDesc",
): ExplorerFileNode[] {
  const pinned: ExplorerFileNode[] = [];
  const rest: ExplorerFileNode[] = [];
  for (const file of files) {
    (file.isPinned ? pinned : rest).push(file);
  }

  const compareFn = (a: ExplorerFileNode, b: ExplorerFileNode) => {
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

function filterFiles(
  files: ExplorerFileNode[],
  query: string,
): ExplorerFileNode[] {
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

function getTokenRank(file: ExplorerFileNode, token: string): number {
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

function rankTagToken(file: ExplorerFileNode, tagQuery: string): number {
  const fileTags = file.tags.map((tag) => tag.toLowerCase());
  let minRank = Infinity;

  for (const fileTag of fileTags) {
    const tagParts = fileTag.split("/");
    const partRanks = tagParts.map((part) => rankText(part, tagQuery));

    minRank = Math.min(minRank, ...partRanks, rankText(fileTag, tagQuery) + 1);
  }
  return minRank;
}

function rankGeneralToken(file: ExplorerFileNode, token: string): number {
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
