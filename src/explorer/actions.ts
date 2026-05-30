import { App, TAbstractFile, TFolder } from "obsidian";
import { promptAndCreateFolder, promptAndCreateNote } from "./vault/create";
import { moveIntoFolder } from "./vault/move";
import {
  canGoToParentFolderNote,
  createAndOpenFolderNote,
  goToParentFolderNote,
  openFolderNote,
  type FolderNoteSource,
  type SavePluginSettings,
} from "./folder-notes";
import { promptAndRenameFile, promptAndRenameFolder } from "./vault/edit";
import type { PluginSettings } from "./settings";
import { ExplorerFileNode, ExplorerFolderNode } from "./nodes";
import { ExplorerSession } from "./session";
import { ConfirmationDialog } from "../ui/modals/prompt-modal";

export class ExplorerActions {
  constructor(
    readonly app: App,
    readonly session: ExplorerSession,
    readonly sourcePath: string,
    readonly currentFolder: TFolder,
    readonly settings: PluginSettings,
    private readonly savePluginSettings: SavePluginSettings | undefined,
    private readonly refresh: () => void,
    private readonly refreshMetadata: () => void,
  ) {}

  get currentFolderPath(): string {
    return this.currentFolder.path;
  }

  createFolderNode(folder: TFolder): ExplorerFolderNode {
    return this.session.createFolderNode(folder);
  }

  canGoToParent(source: FolderNoteSource | null): boolean {
    return canGoToParentFolderNote(this.app, this.settings, source);
  }

  async goToParent(
    source: FolderNoteSource | null,
    newLeaf?: boolean,
  ): Promise<void> {
    await goToParentFolderNote(this.app, this.settings, {
      source,
      newLeaf,
    });
  }

  async openFile(file: ExplorerFileNode, newLeaf = false): Promise<void> {
    await this.app.workspace.openLinkText(file.path, this.sourcePath, newLeaf);
  }

  async openFolder(
    folder: ExplorerFolderNode | TFolder,
    newLeaf = false,
  ): Promise<void> {
    await openFolderNote(
      this.app,
      folder instanceof ExplorerFolderNode ? folder.folder : folder,
      this.settings,
      this.sourcePath,
      newLeaf,
    );
  }

  async createFolderNote(folder: ExplorerFolderNode): Promise<void> {
    await createAndOpenFolderNote(
      this.app,
      folder.folder,
      this.settings,
      this.sourcePath,
      false,
      this.savePluginSettings,
    );
  }

  async createFolder(): Promise<void> {
    await promptAndCreateFolder(this.app, this.currentFolder.path);
  }

  async createNote(): Promise<void> {
    await promptAndCreateNote(this.app, this.currentFolder.path);
  }

  async movePathIntoFolder(
    sourcePath: string,
    target: TFolder,
    fromFolderNote: boolean,
  ): Promise<void> {
    if (!fromFolderNote) {
      await this.performMove(sourcePath, target);
      return;
    }

    const source = this.app.vault.getAbstractFileByPath(sourcePath);
    if (!(source instanceof TFolder)) return;

    const message = `This is a folder note. Dragging it to ${target.name} will move the folder ${source.name} there.`;
    new ConfirmationDialog(
      this.app,
      "Move folder?",
      () => {
        void this.performMove(sourcePath, target);
      },
      undefined,
      message,
    ).open();
  }

  async renameFile(file: ExplorerFileNode): Promise<void> {
    if (await promptAndRenameFile(this.app, file.file)) this.refresh();
  }

  async renameFolder(folder: ExplorerFolderNode): Promise<void> {
    if (await promptAndRenameFolder(this.app, folder.folder)) this.refresh();
  }

  async deleteFile(file: ExplorerFileNode): Promise<void> {
    await this.deleteAndRefresh(file.file);
  }

  deleteFolder(folder: ExplorerFolderNode): void {
    new ConfirmationDialog(
      this.app,
      "Delete folder?",
      () => this.deleteAndRefresh(folder.folder),
      undefined,
      `This will delete the folder "${folder.name}" and all of its contents.`,
    ).open();
  }

  async deleteFolderNote(folder: ExplorerFolderNode): Promise<void> {
    const folderNote = folder.folderNote;
    if (folderNote) await this.deleteAndRefresh(folderNote);
  }

  async togglePin(file: ExplorerFileNode): Promise<void> {
    await file.togglePin();
    this.refreshMetadata();
  }

  async setProperty(
    file: ExplorerFileNode,
    key: string,
    value: unknown,
  ): Promise<void> {
    await file.setProperty(key, value);
    this.refresh();
  }

  private async performMove(
    sourcePath: string,
    target: TFolder,
  ): Promise<void> {
    if (await moveIntoFolder(this.app, sourcePath, target)) this.refresh();
  }

  private async deleteAndRefresh(file: TAbstractFile): Promise<void> {
    await this.app.fileManager.promptForDeletion(file);
    this.refresh();
  }
}
