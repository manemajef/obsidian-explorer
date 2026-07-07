import { App, TFile, TFolder } from "obsidian";
import { BlockSettings } from "../settings";
import { getFolderNoteForFolder } from "../lib/folder-note";
import { filterDisplayedFiles, shouldIndexFile } from "../lib/listing";
import {
  ExplorerFileNode,
  ExplorerFolderNode,
  type ExplorerNode,
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
    private app: App,
    folder: TFolder,
    excludedFolders: readonly string[] = [],
  ) {
    this.folder = folder;
    const prefix = folder.isRoot() ? "" : `${folder.path}/`;
    this.excludedFolderPaths = excludedFolders.map(
      (path) => `${prefix}${path}`,
    );
  }

  async load(
    includeSubfolders: boolean,
    includeNestedFolderNotes: boolean,
  ): Promise<void> {
    this.loadImmediate();
    if (includeSubfolders) {
      this.nestedFiles = await this.loadSubfolderFiles(includeNestedFolderNotes);
    }
  }

  async getAllContent(
    onChunk?: (chunk: ExplorerFileNode[]) => void,
  ): Promise<ExplorerFileNode[]> {
    return this.loadSubfolderFiles(true, onChunk);
  }

  getFilesToDisplay(settings: BlockSettings): ExplorerFileNode[] {
    return filterDisplayedFiles(
      settings.includeSubfolders ? this.nestedFiles : this.files,
      settings.displayedNotes,
    );
  }

  private loadImmediate(): void {
    this.children = [];
    this.files = [];
    this.folders = [];
    this.folderNotes = [];

    for (const child of this.folder.children) {
      if (child instanceof TFile && shouldIndexFile(child)) {
        const fileNode = new ExplorerFileNode(this.app, child);
        this.children.push(fileNode);
        this.files.push(fileNode);
      } else if (child instanceof TFolder && !this.isExcludedFolder(child)) {
        const folderNote = getFolderNoteForFolder(this.app, child);
        const folderNode = new ExplorerFolderNode(this.app, child);
        this.children.push(folderNode);
        this.folders.push(folderNode);
        if (folderNote) {
          this.folderNotes.push(new ExplorerFileNode(this.app, folderNote));
        }
      }
    }

    this.nestedFiles = [...this.files];
  }

  private async loadSubfolderFiles(
    includeFolderNotes: boolean,
    onChunk?: (chunk: ExplorerFileNode[]) => void,
  ): Promise<ExplorerFileNode[]> {
    const all: ExplorerFileNode[] = [];
    let pending: ExplorerFileNode[] = [];
    let sliceStart = window.performance.now();

    const collect = (file: TFile): void => {
      const node = new ExplorerFileNode(this.app, file);
      all.push(node);
      pending.push(node);
    };

    for (const file of this.app.vault.getFiles()) {
      if (!this.isDescendantFile(file) || this.isExcludedFile(file)) continue;
      if (
        shouldIndexFile(file) ||
        (includeFolderNotes && this.isNestedFolderNote(file))
      ) {
        collect(file);
      }

      if (onChunk && window.performance.now() - sliceStart >= WALK_BUDGET_MS) {
        if (pending.length > 0) {
          onChunk(pending);
          pending = [];
        }
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
        sliceStart = window.performance.now();
      }
    }

    if (onChunk && pending.length > 0) onChunk(pending);
    return all;
  }

  private isDescendantFile(file: TFile): boolean {
    if (this.folder.isRoot()) return true;
    return file.path.startsWith(`${this.folder.path}/`);
  }

  private isExcludedFile(file: TFile): boolean {
    const folderPath = file.parent?.path;
    if (!folderPath) return false;
    return this.excludedFolderPaths.some(
      (excludedPath) =>
        folderPath === excludedPath ||
        folderPath.startsWith(`${excludedPath}/`),
    );
  }

  private isNestedFolderNote(file: TFile): boolean {
    const parent = file.parent;
    if (!parent?.parent || parent.parent === this.folder) return false;
    return getFolderNoteForFolder(this.app, parent) === file;
  }

  private isExcludedFolder(folder: TFolder): boolean {
    return this.excludedFolderPaths.some(
      (excludedPath) =>
        folder.path === excludedPath ||
        folder.path.startsWith(`${excludedPath}/`),
    );
  }
}
