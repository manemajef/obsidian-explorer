import { App, TFile, TFolder } from "obsidian";
import { ExplorerSettings, FolderInfo } from "../types";
import { EXCLUDED_EXTENSIONS } from "../constants";
import { isFolderNote, getFolderNoteForFolder } from "../utils/file-utils";

export type GetAllContentOptions = {
  onBatch?: (batch: TFile[]) => void;
  chunkSize?: number;
  signal?: AbortSignal;
  includeFolderNotes?: boolean;
};

/**
 * Indexes folder contents with support for nested loading
 */
export class FolderIndex {
  app: App;
  folder: TFolder;
  folderNote: TFile | null;
  files: TFile[] = [];
  folders: FolderInfo[] = [];
  folderNotes: TFile[] = [];
  nestedFiles: TFile[] = [];
  childrenSize: number = 0;

  constructor(app: App, folder: TFolder) {
    this.app = app;
    this.folder = folder;
    this.folderNote = getFolderNoteForFolder(app, folder);
  }

  /**
   * Load immediate children of the folder
   */
  loadImmediate(): void {
    this.files = [];
    this.folders = [];
    this.folderNotes = [];

    for (const child of this.folder.children) {
      if (child instanceof TFile) {
        if (this.shouldIncludeFile(child)) {
          this.files.push(child);
        }
      } else if (child instanceof TFolder) {
        const folderNote = getFolderNoteForFolder(this.app, child);
        this.folders.push({ folder: child, folderNote });
        if (folderNote) {
          this.folderNotes.push(folderNote);
        }
      }
    }

    this.nestedFiles = [...this.files];
    this.childrenSize = this.files.length + this.folders.length;
  }

  /**
   * Load folder contents to a specific depth
   */
  async loadToDepth(depth: number): Promise<void> {
    this.loadImmediate();
    if (depth > 0) {
      this.nestedFiles = await this.walkFolder({
        depth,
        includeFolderNotes: true,
      });
    }
  }

  /**
   * Reset and reload to specific depth
   */
  async resetDepth(depth: number): Promise<void> {
    this.nestedFiles = [];
    await this.loadToDepth(depth);
  }

  async getAllContent(options: GetAllContentOptions = {}): Promise<TFile[]> {
    return this.walkFolder({
      depth: null,
      includeFolderNotes: options.includeFolderNotes ?? true,
      onBatch: options.onBatch,
      chunkSize: options.chunkSize ?? 200,
      signal: options.signal,
    });
  }
  /**
   * Check if a file should be included in the listing
   */
  private shouldIncludeFile(file: TFile): boolean {
    if (isFolderNote(file)) return false;
    const ext = file.extension.toLowerCase();
    if (EXCLUDED_EXTENSIONS.includes(ext)) return false;
    return true;
  }

  /**
   * Get files to display based on current settings
   */
  getFilesToDisplay(settings: ExplorerSettings): TFile[] {
    let files = settings.depth > 0 ? this.nestedFiles : this.files;

    if (settings.onlyNotes) {
      files = files.filter(
        (f) => f.extension === "md" || f.extension === "pdf",
      );
    }

    return files;
  }

  private async walkFolder(options: {
    depth: number | null;
    includeFolderNotes: boolean;
    onBatch?: (batch: TFile[]) => void;
    chunkSize?: number;
    signal?: AbortSignal;
  }): Promise<TFile[]> {
    const {
      depth,
      includeFolderNotes,
      onBatch,
      chunkSize = 0,
      signal,
    } = options;

    const results: TFile[] = [];
    let batch: TFile[] = [];
    let processed = 0;

    const visit = async (
      folder: TFolder,
      remaining: number | null,
    ): Promise<void> => {
      for (const child of folder.children) {
        if (signal?.aborted) return;

        if (child instanceof TFile) {
          if (this.shouldIncludeFile(child)) {
            results.push(child);
            batch.push(child);
          }
        } else if (child instanceof TFolder) {
          if (includeFolderNotes) {
            const folderNote = getFolderNoteForFolder(this.app, child);
            if (folderNote) {
              results.push(folderNote);
              batch.push(folderNote);
            }
          }
          if (remaining === null || remaining > 0) {
            await visit(child, remaining === null ? null : remaining - 1);
          }
        }

        if (chunkSize > 0) {
          processed += 1;
          if (processed >= chunkSize) {
            processed = 0;
            if (batch.length) {
              onBatch?.(batch);
              batch = [];
            }
            await new Promise<void>((resolve) =>
              window.requestAnimationFrame(() => resolve()),
            );
          }
        }
      }
    };

    await visit(this.folder, depth);

    if (batch.length) {
      onBatch?.(batch);
    }

    return results;
  }
}
