import { App, TFolder } from "obsidian";
import { FolderIndex } from "./folder-index";
import { ExplorerFolderNode } from "../lib/nodes";

export type IndexOptions = {
  depth: number;
  displayNestedFolderNotes: boolean;
  excludedFolders: readonly string[];
};

export class ExplorerSession {
  private readonly indexes = new Map<string, FolderIndex>();

  constructor(readonly app: App) {}

  createFolderNode(folder: TFolder): ExplorerFolderNode {
    return new ExplorerFolderNode(this.app, folder);
  }

  async getIndex(folder: TFolder, options: IndexOptions): Promise<FolderIndex> {
    const key = this.getIndexKey(folder, options);
    const cached = this.indexes.get(key);
    if (cached) return cached;

    const index = new FolderIndex(this.app, folder, options.excludedFolders);
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
      const indexPath = index.folder.path;
      if (
        indexPath === "" ||
        path === indexPath ||
        path.startsWith(indexPath + "/") ||
        indexPath.startsWith(path + "/")
      ) {
        this.indexes.delete(key);
      }
    }
  }

  private getIndexKey(folder: TFolder, options: IndexOptions): string {
    return [
      folder.path,
      options.depth,
      options.displayNestedFolderNotes ? 1 : 0,
      ...options.excludedFolders,
    ].join("\0");
  }
}
