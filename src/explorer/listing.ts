import { TFile, TFolder } from "obsidian";
import { BlockSettings, DisplayedNotes } from "./settings";
import { getFolderNoteForFolder, isFolderNote } from "./file-utils";
import {
  ExplorerFileNode,
  ExplorerFolderNode,
  type ExplorerNode,
  type ExplorerNodeFactory,
} from "./nodes";

const WALK_CHUNK_SIZE = 200;
const EXCLUDED_EXTENSIONS = ["png", "jpeg", "jpg"];
const DEFAULT_DISPLAY_EXTENSIONS = ["md", "pdf", "base"];

export type ExplorerListing = ExplorerFileNode[];

export class FolderIndex {
  readonly folder: TFolder;
  children: ExplorerNode[] = [];
  folders: ExplorerFolderNode[] = [];
  folderNotes: ExplorerFileNode[] = [];
  private files: ExplorerFileNode[] = [];
  private nestedFiles: ExplorerFileNode[] = [];
  private readonly excludedFolderPaths: string[];

  constructor(
    private nodeFactory: ExplorerNodeFactory,
    folder: TFolder,
    excludedFolders: readonly string[] = [],
  ) {
    this.folder = folder;
    const prefix = folder.isRoot() ? "" : `${folder.path}/`;
    this.excludedFolderPaths = excludedFolders.map((path) => `${prefix}${path}`);
  }

  async loadToDepth(
    depth: number,
    includeNestedFolderNotes: boolean,
  ): Promise<void> {
    // if loading not just direct children of folder, use BFS to list the depth levels
    this.loadImmediate();
    if (depth > 0) {
      this.nestedFiles = await this.walkFolder(
        depth,
        false,
        includeNestedFolderNotes,
        false,
      );
    }
  }

  async getAllContent(): Promise<ExplorerFileNode[]> {
    // load all sub files without depth limit
    return this.walkFolder(null, false, true, true);
  }

  getFilesToDisplay(settings: BlockSettings): ExplorerFileNode[] {
    return filterDisplayedFiles(
      settings.depth > 0 ? this.nestedFiles : this.files,
      settings.displayedNotes,
    );
  }

  private loadImmediate(): void {
    // Load direct children of folder immediately.
    this.children = [];
    this.files = [];
    this.folders = [];
    this.folderNotes = [];

    for (const child of this.folder.children) {
      if (child instanceof TFile && shouldIndexFile(child)) {
        const fileNode = this.nodeFactory.createFileNode(child);
        this.children.push(fileNode);
        this.files.push(fileNode);
      } else if (child instanceof TFolder && !this.isExcludedFolder(child)) {
        const folderNote = getFolderNoteForFolder(this.nodeFactory.app, child);
        const folderNode = this.nodeFactory.createFolderNode(child);
        this.children.push(folderNode);
        this.folders.push(folderNode);
        if (folderNote) {
          this.folderNotes.push(this.nodeFactory.createFileNode(folderNote));
        }
      }
    }

    this.nestedFiles = [...this.files]; // direct files are a subset of nestedfiles
  }

  private async walkFolder(
    // BFS loading sub folders content
    depth: number | null, // null means no depth limit
    includeFolderNotesAtFirstLevel: boolean,
    includeFolderNotes: boolean,
    yieldToBrowser: boolean,
  ): Promise<ExplorerFileNode[]> {
    const results: TFile[] = [];
    let processed = 0;
    const queue: Array<{ folder: TFolder; depth: number }> = [
      { folder: this.folder, depth: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const child of current.folder.children) {
        if (child instanceof TFile && shouldIndexFile(child)) {
          results.push(child);
        } else if (child instanceof TFolder && !this.isExcludedFolder(child)) {
          const includeFolderNote =
            current.depth === 0
              ? includeFolderNotesAtFirstLevel
              : includeFolderNotes;
          if (includeFolderNote) {
            const folderNote = getFolderNoteForFolder(
              this.nodeFactory.app,
              child,
            );
            if (folderNote) results.push(folderNote);
          }
          if (depth === null || current.depth < depth) {
            queue.push({ folder: child, depth: current.depth + 1 });
          }
        }

        if (yieldToBrowser && ++processed >= WALK_CHUNK_SIZE) {
          processed = 0;
          await new Promise<void>((resolve) =>
            window.requestAnimationFrame(() => resolve()),
          );
        }
      }
    }

    return results.map((file) => this.nodeFactory.createFileNode(file));
  }

  private isExcludedFolder(folder: TFolder): boolean {
    return this.excludedFolderPaths.some(
      (excludedPath) =>
        folder.path === excludedPath ||
        folder.path.startsWith(`${excludedPath}/`),
    );
  }
}

export function buildExplorerListing(input: {
  // prepare listing for ui:
  // //apply visibility rules, remove source file, sort according to block setting, if a query exists apply to filter
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
  const queriedFiles = query
    ? // if query === "" then ignore and just return sorted files
      filterFiles(sortedFiles, query)
    : sortedFiles;

  return queriedFiles;
}

export function resolveCardFooterMode(settings: BlockSettings): string {
  if (settings.cardExt !== "default") return settings.cardExt;
  return settings.depth > 0 ? "folder" : "mtime";
}

function shouldIndexFile(file: TFile): boolean {
  return !isFolderNote(file) && !isExcludedExplorerFile(file);
}

function isExcludedExplorerFile(file: { extension: string }): boolean {
  return EXCLUDED_EXTENSIONS.includes(file.extension.toLowerCase());
}

function filterDisplayedFiles(
  files: ExplorerFileNode[],
  displayedNotes: DisplayedNotes,
): ExplorerFileNode[] {
  const visibleFiles = files.filter((file) => !isExcludedExplorerFile(file));

  switch (displayedNotes) {
    case "none":
      return [];
    case "markdown":
      return visibleFiles.filter(
        (file) => file.isMarkdown && !file.isFolderNote,
      );
    case "supported":
      return visibleFiles.filter((file) =>
        DEFAULT_DISPLAY_EXTENSIONS.includes(file.extension.toLowerCase()),
      );
    case "all":
      return visibleFiles;
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
