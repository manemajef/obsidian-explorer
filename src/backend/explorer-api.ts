import { App, TFile, TFolder } from "obsidian";
import { FolderIndex } from "./services/folder-index";
import {
  createFolderWithNote,
  createNewNote,
  openOrCreateFolderNote,
  promptAndCreateFolder,
  promptAndCreateNote,
  updateExplorerBlock,
} from "./services/vault-actions";
import {
  BuildRenderModelInput,
  BuildRenderModelOutput,
  UpdateBlockSettingsInput,
} from "./contracts";
import { resolveEffectiveSettings } from "./settings-resolver";
import { parseSettings } from "./services/block-settings";
import { BlockSettings } from "../settings/schema";

export class ExplorerAPI {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  resolveSettings(
    defaultBlockSettings: BlockSettings,
    blockSettings: Partial<BlockSettings>,
  ): BlockSettings {
    return resolveEffectiveSettings(defaultBlockSettings, blockSettings);
  }

  resolveSettingsFromSource(
    source: string,
    defaultBlockSettings: BlockSettings,
  ): BlockSettings {
    const blockSettings = parseSettings(source);
    return this.resolveSettings(defaultBlockSettings, blockSettings);
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
      input.defaultSettings,
      input.settings,
    );
  }

  async createFolder(basePath: string, name: string): Promise<void> {
    await createFolderWithNote(this.app, basePath, name);
  }

  async createNote(basePath: string, name: string): Promise<void> {
    await createNewNote(this.app, basePath, name);
  }

  async promptAndCreateFolder(basePath: string): Promise<void> {
    await promptAndCreateFolder(this.app, basePath);
  }

  async promptAndCreateNote(basePath: string): Promise<void> {
    await promptAndCreateNote(this.app, basePath);
  }

  async openFolderNote(
    folder: TFolder,
    sourcePath = "",
    newLeaf = false,
  ): Promise<void> {
    await openOrCreateFolderNote(this.app, folder, sourcePath, newLeaf);
  }
}
