import { App, TFile, TFolder } from "obsidian";
import { FileInfo, FolderInfo } from "../types";
import { BlockSettings, DisplayedNotes } from "./settings";
import {
  filterFiles,
  getFileInfo,
  getFolderNoteForFolder,
  isFolderNote,
  sortFiles,
} from "./file-utils";

const WALK_CHUNK_SIZE = 200;
const EXCLUDED_EXTENSIONS = ["png", "jpeg", "jpg"];
const DEFAULT_DISPLAY_EXTENSIONS = ["md", "pdf", "base"];

export interface ExplorerListing {
  files: TFile[];
  fileInfos: FileInfo[];
}

export class FolderIndex {
  readonly folder: TFolder;
  folders: FolderInfo[] = [];
  folderNotes: TFile[] = [];
  private files: TFile[] = [];
  private nestedFiles: TFile[] = [];

  constructor(
    private app: App,
    folder: TFolder,
  ) {
    this.folder = folder;
  }

  async loadToDepth(depth: number): Promise<void> {
    this.loadImmediate();
    if (depth > 0) this.nestedFiles = await this.walkFolder(depth, true, false);
  }

  async getAllContent(): Promise<TFile[]> {
    return this.walkFolder(null, false, true);
  }

  getFilesToDisplay(settings: BlockSettings): TFile[] {
    return filterDisplayedFiles(
      settings.depth > 0 ? this.nestedFiles : this.files,
      settings.displayedNotes,
    );
  }

  private loadImmediate(): void {
    this.files = [];
    this.folders = [];
    this.folderNotes = [];

    for (const child of this.folder.children) {
      if (child instanceof TFile && shouldIndexFile(child)) {
        this.files.push(child);
      } else if (child instanceof TFolder) {
        const folderNote = getFolderNoteForFolder(this.app, child);
        this.folders.push({ folder: child, folderNote });
        if (folderNote) this.folderNotes.push(folderNote);
      }
    }

    this.nestedFiles = [...this.files];
  }

  private async walkFolder(
    depth: number | null,
    includeFolderNotesAtFirstLevel: boolean,
    yieldToBrowser: boolean,
  ): Promise<TFile[]> {
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
        } else if (child instanceof TFolder) {
          if (current.depth > 0 || includeFolderNotesAtFirstLevel) {
            const folderNote = getFolderNoteForFolder(this.app, child);
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

    return results;
  }
}

export function buildExplorerListing(input: {
  app: App;
  files: TFile[];
  settings: BlockSettings;
  sourcePath: string;
  query: string;
  sortBy: BlockSettings["sortBy"];
}): ExplorerListing {
  const { app, files, settings, sourcePath, query, sortBy } = input;
  const visibleFiles = filterDisplayedFiles(
    files.filter((f) => f.path !== sourcePath),
    settings.displayedNotes,
  );
  const sortedFiles = sortFiles(app, visibleFiles, sortBy);
  const queriedFiles = query ? filterFiles(app, sortedFiles, query) : sortedFiles;

  return {
    files: queriedFiles,
    fileInfos: queriedFiles.map((file) => getFileInfo(app, file)),
  };
}

export function resolveCardFooterMode(settings: BlockSettings): string {
  if (settings.cardExt !== "default") return settings.cardExt;
  return settings.depth > 0 ? "folder" : "ctime";
}

function shouldIndexFile(file: TFile): boolean {
  return !isFolderNote(file) && !isExcludedExplorerFile(file);
}

function isExcludedExplorerFile(file: TFile): boolean {
  return EXCLUDED_EXTENSIONS.includes(file.extension.toLowerCase());
}

function filterDisplayedFiles(
  files: TFile[],
  displayedNotes: DisplayedNotes,
): TFile[] {
  const visibleFiles = files.filter((file) => !isExcludedExplorerFile(file));

  switch (displayedNotes) {
    case "none":
      return [];
    case "markdown":
      return visibleFiles.filter((file) => file.extension.toLowerCase() === "md");
    case "supported":
      return visibleFiles.filter((file) =>
        DEFAULT_DISPLAY_EXTENSIONS.includes(file.extension.toLowerCase()),
      );
    case "all":
      return visibleFiles;
  }
}
