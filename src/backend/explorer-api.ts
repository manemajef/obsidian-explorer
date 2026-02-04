import { App, TFile, TFolder } from "obsidian";
import { FolderIndex } from "./services/folder-index";
import {
  createFolderWithNote,
  createNewNote,
  openOrCreateFolderNote,
  updateExplorerBlock,
} from "./services/vault-actions";
import { ExplorerSettings } from "../types";
import {
  BuildRenderModelInput,
  BuildRenderModelOutput,
  UpdateBlockSettingsInput,
} from "./contracts";
import { resolveEffectiveSettings } from "./settings-resolver";

export class ExplorerAPI {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  resolveSettings(
    pluginSettings: ExplorerSettings,
    blockSettings: Partial<ExplorerSettings>,
  ): ExplorerSettings {
    return resolveEffectiveSettings(pluginSettings, blockSettings);
  }

  async buildRenderModel(
    input: BuildRenderModelInput,
  ): Promise<BuildRenderModelOutput | null> {
    const blockFile = this.app.vault.getAbstractFileByPath(input.sourcePath);
    if (!(blockFile instanceof TFile) || !blockFile.parent) {
      return null;
    }

    const folder = blockFile.parent;
    const folderIndex = new FolderIndex(this.app, folder);
    await folderIndex.loadToDepth(input.settings.depth);

    const depthFiles = folderIndex.getFilesToDisplay(input.settings);
    let cachedAllFiles: TFile[] | null = null;

    return {
      folder,
      folderInfos: folderIndex.folders,
      depthFiles,
      folderNotes: folderIndex.folderNotes,
      getAllFiles: async () => {
        if (cachedAllFiles) {
          return cachedAllFiles;
        }
        cachedAllFiles = await folderIndex.getAllContent();
        return cachedAllFiles;
      },
    };
  }

  async updateBlockSettings(input: UpdateBlockSettingsInput): Promise<void> {
    await updateExplorerBlock(
      this.app,
      input.container,
      input.ctx,
      input.sourcePath,
      input.settings,
    );
  }

  async createFolder(basePath: string, name: string): Promise<void> {
    await createFolderWithNote(this.app, basePath, name);
  }

  async createNote(basePath: string, name: string): Promise<void> {
    await createNewNote(this.app, basePath, name);
  }

  async openFolderNote(
    folder: TFolder,
    sourcePath = "",
    newLeaf = false,
  ): Promise<void> {
    await openOrCreateFolderNote(this.app, folder, sourcePath, newLeaf);
  }
}
