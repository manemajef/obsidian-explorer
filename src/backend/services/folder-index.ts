import { App, TFile, TFolder } from "obsidian";
import { ExplorerSettings, FolderInfo } from "../../types";
import { EXCLUDED_EXTENSIONS, SUPPORTED_EXTENSIONS } from "../../constants";
import { isFolderNote, getFolderNoteForFolder } from "../../utils/file-utils";

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
      includeFolderNotes: options.includeFolderNotes ?? false,
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
      // Strict: only notes and PDFs
      files = files.filter(
        (f) => f.extension === "md" || f.extension === "pdf",
      );
    } else if (!settings.showUnsupportedFiles) {
      // Default: show content files, hide code files
      files = files.filter((f) =>
        SUPPORTED_EXTENSIONS.includes(f.extension.toLowerCase()),
      );
    }

    return files;
  }

  /**
   * BFS traversal - files closer to root appear first
   */
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

    // BFS queue: [folder, currentDepth]
    const queue: Array<{ folder: TFolder; currentDepth: number }> = [
      { folder: this.folder, currentDepth: 0 },
    ];

    while (queue.length > 0) {
      if (signal?.aborted) break;

      const { folder, currentDepth } = queue.shift()!;

      for (const child of folder.children) {
        if (signal?.aborted) break;

        if (child instanceof TFile) {
          if (this.shouldIncludeFile(child)) {
            results.push(child);
            batch.push(child);
          }
        } else if (child instanceof TFolder) {
          // includeFolderNotes only applies to first level; nested levels always show folder notes
          if (currentDepth > 0 || includeFolderNotes) {
            const folderNote = getFolderNoteForFolder(this.app, child);
            if (folderNote) {
              results.push(folderNote);
              batch.push(folderNote);
            }
          }
          // Add to queue if within depth limit (null = unlimited)
          if (depth === null || currentDepth < depth) {
            queue.push({ folder: child, currentDepth: currentDepth + 1 });
          }
        }

        // Batch processing for large folders
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
    }

    if (batch.length) {
      onBatch?.(batch);
    }

    return results;
  }
}
