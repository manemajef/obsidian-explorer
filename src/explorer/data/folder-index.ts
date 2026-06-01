import { TFile, TFolder } from "obsidian";
import { BlockSettings } from "../settings";
import { getFolderNoteForFolder } from "../lib/folder-note";
import { filterDisplayedFiles, shouldIndexFile } from "../lib/listing";
import {
  ExplorerFileNode,
  ExplorerFolderNode,
  type ExplorerNode,
  type ExplorerNodeFactory,
} from "../lib/nodes";

const WALK_BUDGET_MS = 16;

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
    this.excludedFolderPaths = excludedFolders.map(
      (path) => `${prefix}${path}`,
    );
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

  async getAllContent(
    onChunk?: (chunk: ExplorerFileNode[]) => void,
  ): Promise<ExplorerFileNode[]> {
    // load all sub files without depth limit; onChunk receives nodes as they're discovered
    return this.walkFolder(null, false, true, true, onChunk);
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
    onChunk?: (chunk: ExplorerFileNode[]) => void,
  ): Promise<ExplorerFileNode[]> {
    const all: ExplorerFileNode[] = [];
    let pending: ExplorerFileNode[] = [];
    let sliceStart = window.performance.now();
    const queue: Array<{ folder: TFolder; depth: number }> = [
      { folder: this.folder, depth: 0 },
    ];

    const collect = (file: TFile): void => {
      const node = this.nodeFactory.createFileNode(file);
      all.push(node);
      pending.push(node);
    };

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const child of current.folder.children) {
        if (child instanceof TFile && shouldIndexFile(child)) {
          collect(child);
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
            if (folderNote) collect(folderNote);
          }
          if (depth === null || current.depth < depth) {
            queue.push({ folder: child, depth: current.depth + 1 });
          }
        }

        if (
          yieldToBrowser &&
          window.performance.now() - sliceStart >= WALK_BUDGET_MS
        ) {
          if (onChunk && pending.length > 0) {
            onChunk(pending);
            pending = [];
          }
          await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
          sliceStart = window.performance.now();
        }
      }
    }

    if (onChunk && pending.length > 0) onChunk(pending);
    return all;
  }

  private isExcludedFolder(folder: TFolder): boolean {
    return this.excludedFolderPaths.some(
      (excludedPath) =>
        folder.path === excludedPath ||
        folder.path.startsWith(`${excludedPath}/`),
    );
  }
}
