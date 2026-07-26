import type { App, TFile, TFolder } from "obsidian";
import type { FolderDataStore } from "./data/folder-data-store";
import type { ExplorerLocation } from "./domain/explorer-location";
import type { OpenFileRequest } from "./domain/file-opening";
import type { OpenFolderRequest } from "./domain/folder-page";
import { addMarkdownBacking } from "./operations/add-markdown-backing";
import { createFolder } from "./operations/create-folder";
import { createNote } from "./operations/create-note";
import {
  deleteFile,
  deleteFolder,
} from "./operations/delete-entry";
import { openFile } from "./operations/open-file";
import { openFolderPage } from "./operations/open-folder-page";
import { openHomePage } from "./operations/open-homepage";
import { movePathIntoFolder } from "./operations/move-into-folder";
import { canNavigateToParent, navigateToParent } from "./operations/go-to-parent";
import { removeMarkdownBacking } from "./operations/remove-markdown-backing";
import {
  renameFile,
  renameFolder,
} from "./operations/rename-entry";
import { setPinned } from "./operations/set-pinned";
import type { BlockSettings, PluginSettings } from "./settings";

export type { OpenFileRequest } from "./domain/file-opening";
export type {
  FolderPageOpenIntent,
  OpenFolderRequest,
} from "./domain/folder-page";

type ExplorerApiDependencies = {
  app: App;
  folderDataStore: FolderDataStore;
  getBlockDefaults: () => BlockSettings;
  getSettings: () => PluginSettings;
  saveSettings: () => void | Promise<void>;
};

export class ExplorerApi {
  constructor(private readonly dependencies: ExplorerApiDependencies) {}

  at(location: ExplorerLocation | null): Explorer {
    return new BoundExplorer(this.dependencies, location);
  }
}

export interface Explorer {
  canGoToParent(): boolean;
  goToParent(newLeaf?: boolean): Promise<void>;
  openFile(file: TFile, request?: OpenFileRequest): Promise<void>;
  openFolder(folder: TFolder, request?: OpenFolderRequest): Promise<void>;
  createFolder(): Promise<boolean>;
  createNote(): Promise<boolean>;
  movePathIntoFolder(
    sourcePath: string,
    target: TFolder,
    fromFolderNote: boolean,
  ): Promise<boolean>;
  renameFile(file: TFile): Promise<boolean>;
  renameFolder(folder: TFolder, name?: string): Promise<boolean>;
  deleteFile(file: TFile): Promise<boolean>;
  deleteFolder(folder: TFolder): Promise<boolean>;
  openHomePage(newLeaf?: boolean): Promise<void>;
  setPinned(file: TFile, pinned: boolean): Promise<boolean>;
  addMarkdownBacking(settings?: BlockSettings): Promise<void>;
  removeMarkdownBacking(
    folder: TFolder,
    settings?: BlockSettings,
  ): Promise<void>;
}

class BoundExplorer implements Explorer {
  constructor(
    private readonly dependencies: ExplorerApiDependencies,
    private readonly location: ExplorerLocation | null,
  ) {}

  canGoToParent(): boolean {
    return canNavigateToParent(
      this.dependencies.app,
      this.dependencies.getSettings(),
      this.location,
    );
  }

  async goToParent(newLeaf?: boolean): Promise<void> {
    await navigateToParent({
      app: this.dependencies.app,
      settings: this.dependencies.getSettings(),
      location: this.location,
      newLeaf,
      savePluginSettings: this.dependencies.saveSettings,
    });
  }

  async openFile(
    file: TFile,
    request: OpenFileRequest = {},
  ): Promise<void> {
    await openFile({
      app: this.dependencies.app,
      file,
      sourcePath: this.location?.path ?? "",
      settings: this.dependencies.getSettings(),
      request,
    });
  }

  async openFolder(
    folder: TFolder,
    request: OpenFolderRequest = {},
  ): Promise<void> {
    await openFolderPage(
      this.dependencies.app,
      folder,
      this.dependencies.getSettings(),
      this.location?.path ?? "",
      request,
      this.dependencies.saveSettings,
    );
  }

  async createFolder(): Promise<boolean> {
    return createFolder({
      app: this.dependencies.app,
      location: this.location,
      settings: this.dependencies.getSettings(),
      savePluginSettings: this.dependencies.saveSettings,
    });
  }

  async createNote(): Promise<boolean> {
    return createNote({
      app: this.dependencies.app,
      location: this.location,
      settings: this.dependencies.getSettings(),
    });
  }

  async movePathIntoFolder(
    sourcePath: string,
    target: TFolder,
    fromFolderNote: boolean,
  ): Promise<boolean> {
    return movePathIntoFolder({
      app: this.dependencies.app,
      sourcePath,
      target,
      fromFolderNote,
    });
  }

  async renameFile(file: TFile): Promise<boolean> {
    return renameFile({ app: this.dependencies.app, file });
  }

  async renameFolder(folder: TFolder, name?: string): Promise<boolean> {
    return renameFolder({ app: this.dependencies.app, folder, name });
  }

  async deleteFile(file: TFile): Promise<boolean> {
    return deleteFile({ app: this.dependencies.app, file });
  }

  async deleteFolder(folder: TFolder): Promise<boolean> {
    return deleteFolder({ app: this.dependencies.app, folder });
  }

  async openHomePage(newLeaf = false): Promise<void> {
    await openHomePage(
      this.dependencies.app,
      this.dependencies.getSettings(),
      this.location?.path ?? "",
      newLeaf,
    );
  }

  async setPinned(file: TFile, pinned: boolean): Promise<boolean> {
    return setPinned({
      app: this.dependencies.app,
      file,
      pinned,
    });
  }

  async addMarkdownBacking(settings?: BlockSettings): Promise<void> {
    await addMarkdownBacking({
      app: this.dependencies.app,
      location: this.location,
      settings,
      folderDataStore: this.dependencies.folderDataStore,
      blockDefaults: this.dependencies.getBlockDefaults(),
      pluginSettings: this.dependencies.getSettings(),
      savePluginSettings: this.dependencies.saveSettings,
    });
  }

  async removeMarkdownBacking(
    folder: TFolder,
    settings?: BlockSettings,
  ): Promise<void> {
    await removeMarkdownBacking({
      app: this.dependencies.app,
      location: this.location,
      folder,
      settings,
      folderDataStore: this.dependencies.folderDataStore,
      blockDefaults: this.dependencies.getBlockDefaults(),
      pluginSettings: this.dependencies.getSettings(),
    });
  }
}
