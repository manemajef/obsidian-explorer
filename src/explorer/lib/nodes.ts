import { App, getAllTags, TAbstractFile, TFile, TFolder } from "obsidian";
import {
  getFolderNoteForFolder,
  getFolderNotePath,
  isFolderNote,
} from "./folder-note";
import { togglePin } from "../vault/edit";
import { getPreviewForNote } from "./content-peek";

export type ExplorerNode = ExplorerFileNode | ExplorerFolderNode;

export interface ExplorerNodeFactory {
  app: App;
  createFileNode(file: TFile): ExplorerFileNode;
  createFolderNode(folder: TFolder): ExplorerFolderNode;
}

export class ExplorerFileNode {
  readonly kind = "file";
  private cachedFrontmatter: Record<string, unknown> | undefined;
  private cachedTags: string[] | undefined;
  private cachedIsPinned: boolean | undefined;
  private cachedPreview: string | undefined;

  constructor(
    readonly app: App,
    readonly file: TFile,
  ) {}

  get preview(): string | undefined {
    return this.cachedPreview;
  }

  async loadPreview(): Promise<string | undefined> {
    if (this.cachedPreview !== undefined) {
      return this.cachedPreview;
    }
    this.cachedPreview = await getPreviewForNote(this.app, this.file);
    return this.preview;
  }

  get path(): string {
    return this.file.path;
  }

  get name(): string {
    return this.file.name;
  }

  get basename(): string {
    return this.file.basename;
  }

  get extension(): string {
    return this.file.extension;
  }

  get createdAt(): number {
    return this.file.stat.ctime;
  }

  get modifiedAt(): number {
    return this.file.stat.mtime;
  }

  get isMarkdown(): boolean {
    return this.extension.toLowerCase() === "md";
  }

  get isFolderNote(): boolean {
    return isFolderNote(this.file);
  }

  get displayName(): string {
    return this.isMarkdown ? this.basename : this.name;
  }

  get extensionLabel(): string | null {
    if (this.isFolderNote) return "folder";
    return this.isMarkdown ? null : this.extension;
  }

  get parentFolder(): TFolder | null {
    return this.file.parent;
  }

  get parentExplorerFolder(): TFolder | null {
    return this.isFolderNote
      ? (this.file.parent?.parent ?? null)
      : this.file.parent;
  }

  get hasParentFolderNote(): boolean {
    return Boolean(this.parentFolderNote);
  }

  get parentFolderNote(): TFile | null {
    const parent = this.parentExplorerFolder;
    return parent ? getFolderNoteForFolder(this.app, parent) : null;
  }

  get dragSource(): TAbstractFile {
    return this.isFolderNote && this.file.parent ? this.file.parent : this.file;
  }

  get dragFromFolderNote(): boolean {
    return this.isFolderNote;
  }

  get dropTargetFolder(): TFolder | null {
    return this.isFolderNote ? this.file.parent : null;
  }

  get description(): string | undefined {
    const frontmatter = this.frontmatter;
    return (frontmatter?.description || frontmatter?.desc) as
      | string
      | undefined;
  }

  get tags(): string[] {
    if (this.cachedTags) return this.cachedTags;
    const cache = this.app.metadataCache.getFileCache(this.file);
    this.cachedTags = cache
      ? (getAllTags(cache)?.map((tag) => tag.replace(/^#+\s*/g, "")) ?? [])
      : [];
    return this.cachedTags;
  }

  get frontmatter(): Record<string, unknown> | undefined {
    if (this.cachedFrontmatter) return this.cachedFrontmatter;
    this.cachedFrontmatter = this.app.metadataCache.getFileCache(
      this.file,
    )?.frontmatter;
    return this.cachedFrontmatter;
  }

  get properties(): Record<string, unknown> {
    return this.frontmatter ?? {};
  }

  getProperty<T = unknown>(key: string): T | undefined {
    return this.properties[key] as T | undefined;
  }

  async setProperty(key: string, value: unknown): Promise<void> {
    await this.app.fileManager.processFrontMatter(
      this.file,
      (frontmatter: Record<string, unknown>) => {
        if (value === undefined || value === null) {
          delete frontmatter[key];
        } else {
          frontmatter[key] = value;
        }
      },
    );
  }

  get isPinned(): boolean {
    if (this.cachedIsPinned !== undefined) return this.cachedIsPinned;
    this.cachedIsPinned = this.frontmatter?.pin === true;
    return this.cachedIsPinned;
  }

  async togglePin(): Promise<void> {
    this.setCachedPin(await togglePin(this.app, this.file));
  }

  private setCachedPin(isPinned: boolean): void {
    this.cachedIsPinned = isPinned;
    const frontmatter = { ...(this.frontmatter ?? {}) };
    if (isPinned) {
      frontmatter["pin"] = true;
    } else {
      delete frontmatter["pin"];
    }
    this.cachedFrontmatter = frontmatter;
  }
}

export class ExplorerFolderNode {
  readonly kind = "folder";

  constructor(
    readonly app: App,
    readonly folder: TFolder,
    private readonly nodeFactory?: ExplorerNodeFactory,
  ) {}

  get path(): string {
    return this.folder.path;
  }

  get name(): string {
    return this.folder.name;
  }

  get displayName(): string {
    return this.folder.name;
  }

  get folderNotePath(): string {
    return getFolderNotePath(this.folder);
  }

  get folderNote(): TFile | null {
    return getFolderNoteForFolder(this.app, this.folder);
  }

  get folderNoteNode(): ExplorerFileNode | null {
    const folderNote = this.folderNote;
    return folderNote
      ? (this.nodeFactory?.createFileNode(folderNote) ??
          new ExplorerFileNode(this.app, folderNote))
      : null;
  }

  get hasFolderNote(): boolean {
    return Boolean(this.folderNote);
  }
}
