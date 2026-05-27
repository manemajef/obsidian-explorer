import { App, TFile, TFolder } from "obsidian";
import { FolderIndex } from "./listing";
import {
  ExplorerFileNode,
  ExplorerFolderNode,
  type ExplorerNodeFactory,
} from "./nodes";

export type IndexOptions = {
  depth: number;
  displayNestedFolderNotes: boolean;
  excludedFolders: readonly string[];
};

export class ExplorerSession implements ExplorerNodeFactory {
  private readonly indexes = new Map<string, FolderIndex>();

  constructor(readonly app: App) {}

  createFileNode(file: TFile): ExplorerFileNode {
    return new ExplorerFileNode(this.app, file);
  }

  createFolderNode(folder: TFolder): ExplorerFolderNode {
    return new ExplorerFolderNode(this.app, folder, this);
  }

  async getIndex(folder: TFolder, options: IndexOptions): Promise<FolderIndex> {
    const key = this.getIndexKey(folder, options);
    const cached = this.indexes.get(key);
    if (cached) return cached;

    const index = new FolderIndex(this, folder, options.excludedFolders);
    await index.loadToDepth(options.depth, options.displayNestedFolderNotes);
    this.indexes.set(key, index);
    return index;
  }

  invalidate(path?: string): void {
    if (!path) {
      this.indexes.clear();
      return;
    }

    for (const [key, index] of this.indexes) {
      if (index.folder.path === path || index.folder.path.startsWith(`${path}/`)) {
        this.indexes.delete(key);
      }
    }
  }

  private getIndexKey(folder: TFolder, options: IndexOptions): string {
    return JSON.stringify({
      path: folder.path,
      depth: options.depth,
      displayNestedFolderNotes: options.displayNestedFolderNotes,
      excludedFolders: [...options.excludedFolders],
    });
  }
}
