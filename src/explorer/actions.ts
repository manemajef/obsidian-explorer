import { App, TFile, TFolder } from "obsidian";
import { promptAndCreateFolder, promptAndCreateNote } from "./vault/create";
import { moveIntoFolder } from "./vault/move";
import {
  canGoToParentFolderNote,
  goToParentFolderNote,
  openOrCreateFolderNote,
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

  canGoToParent(currentFile: TFile | null): boolean {
    return canGoToParentFolderNote(this.app, this.settings, currentFile);
  }

  async goToParent(
    currentFile: TFile | null,
    newLeaf?: boolean,
  ): Promise<void> {
    await goToParentFolderNote(this.app, this.settings, {
      currentFile,
      newLeaf,
      savePluginSettings: this.savePluginSettings,
    });
  }

  async openFile(file: ExplorerFileNode, newLeaf = false): Promise<void> {
    await this.app.workspace.openLinkText(file.path, this.sourcePath, newLeaf);
  }

  async openFolder(
    folder: ExplorerFolderNode | TFolder,
    newLeaf = false,
  ): Promise<void> {
    await openOrCreateFolderNote(
      this.app,
      folder instanceof ExplorerFolderNode ? folder.folder : folder,
      this.settings,
      this.sourcePath,
      newLeaf,
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

  deleteFile(file: ExplorerFileNode): void {
    void this.app.fileManager.promptForDeletion(file.file);
  }

  deleteFolder(folder: ExplorerFolderNode): void {
    new ConfirmationDialog(
      this.app,
      "Delete folder?",
      () => this.app.fileManager.promptForDeletion(folder.folder),
      undefined,
      `This will delete the folder "${folder.name}" and all of its contents.`,
    ).open();
  }

  deleteFolderNote(folder: ExplorerFolderNode): void {
    const folderNote = folder.folderNote;
    if (folderNote) void this.app.fileManager.promptForDeletion(folderNote);
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
}
