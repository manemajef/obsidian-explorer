import { App, TFile, TFolder } from "obsidian";
import { FolderInfo } from "../types";
import { BlockSettings } from "../settings/schema";
import { isFolderNote, getFolderNoteForFolder } from "./file-utils";

// Extensions to always exclude (images, data files)
const EXCLUDED_EXTENSIONS = [
  "json",
  "png",
  "jpeg",
  "jpg",
  "svg",
  "gif",
  "webp",
];

// Content files that most users want to see (vs code files)
const SUPPORTED_EXTENSIONS = [
  "md",
  "pdf",
  "canvas",
  "docx",
  "doc",
  "pptx",
  "ppt",
  "xlsx",
  "xls",
  "csv",
  "txt",
  "rtf",
  "html",
  "epub",
];

// Yield to the browser every CHUNK_SIZE files during a full walk so large
// vaults don't freeze the UI when search mode loads everything.
const WALK_CHUNK_SIZE = 200;

/**
 * Indexes a folder's contents up to a given depth, or the whole subtree.
 */
export class FolderIndex {
  readonly folder: TFolder;
  folders: FolderInfo[] = [];
  folderNotes: TFile[] = [];
  private app: App;
  private files: TFile[] = [];
  private nestedFiles: TFile[] = [];

  constructor(app: App, folder: TFolder) {
    this.app = app;
    this.folder = folder;
  }

  async loadToDepth(depth: number): Promise<void> {
    this.loadImmediate();
    if (depth > 0) {
      this.nestedFiles = await this.walkFolder(depth, true, false);
    }
  }

  async getAllContent(): Promise<TFile[]> {
    return this.walkFolder(null, false, true);
  }

  /**
   * Apply plugin-level visibility (showUnsupportedFiles).
   * Per-block visibility (onlyNotes, exclude-self) is applied later in file-listing.
   */
  getFilesToDisplay(settings: BlockSettings): TFile[] {
    const files = settings.depth > 0 ? this.nestedFiles : this.files;
    if (settings.showUnsupportedFiles) return files;
    return files.filter((f) =>
      SUPPORTED_EXTENSIONS.includes(f.extension.toLowerCase()),
    );
  }

  private loadImmediate(): void {
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
  }

  private shouldIncludeFile(file: TFile): boolean {
    if (isFolderNote(file)) return false;
    return !EXCLUDED_EXTENSIONS.includes(file.extension.toLowerCase());
  }

  /**
   * BFS traversal — files closer to root appear first.
   * - depth=null walks the whole subtree.
   * - includeFolderNotesAtFirstLevel: nested levels always include folder notes;
   *   the first level only does when this flag is set.
   * - yieldToBrowser pumps requestAnimationFrame every WALK_CHUNK_SIZE files.
   */
  private async walkFolder(
    depth: number | null,
    includeFolderNotesAtFirstLevel: boolean,
    yieldToBrowser: boolean,
  ): Promise<TFile[]> {
    const results: TFile[] = [];
    let processed = 0;
    const queue: Array<{ folder: TFolder; currentDepth: number }> = [
      { folder: this.folder, currentDepth: 0 },
    ];

    while (queue.length > 0) {
      const { folder, currentDepth } = queue.shift()!;

      for (const child of folder.children) {
        if (child instanceof TFile) {
          if (this.shouldIncludeFile(child)) {
            results.push(child);
          }
        } else if (child instanceof TFolder) {
          if (currentDepth > 0 || includeFolderNotesAtFirstLevel) {
            const folderNote = getFolderNoteForFolder(this.app, child);
            if (folderNote) results.push(folderNote);
          }
          if (depth === null || currentDepth < depth) {
            queue.push({ folder: child, currentDepth: currentDepth + 1 });
          }
        }

        if (yieldToBrowser) {
          processed += 1;
          if (processed >= WALK_CHUNK_SIZE) {
            processed = 0;
            await new Promise<void>((resolve) =>
              window.requestAnimationFrame(() => resolve()),
            );
          }
        }
      }
    }

    return results;
  }
}
