import { App, TFile, TFolder } from "obsidian";
import { FolderInfo } from "../types";
import { BlockSettings, PluginSettings } from "./settings";
import { FolderIndex } from "./listing";

export type ExplorerModel = {
  app: App;
  sourcePath: string;
  blockFile: TFile;
  folder: TFolder;
  settings: BlockSettings;
  pluginSettings: PluginSettings;
  folders: FolderInfo[];
  files: TFile[];
  folderNotes: TFile[];
  loadAllFiles: () => Promise<TFile[]>;
};

export async function buildExplorerModel(input: {
  app: App;
  sourcePath: string;
  settings: BlockSettings;
  pluginSettings: PluginSettings;
}): Promise<ExplorerModel | null> {
  const { app, sourcePath, settings, pluginSettings } = input;
  const blockFile = app.vault.getAbstractFileByPath(sourcePath);
  if (!(blockFile instanceof TFile) || !blockFile.parent) return null;

  const folder = blockFile.parent;
  const index = new FolderIndex(app, folder);
  await index.loadToDepth(settings.depth, settings.displayNestedFolderNotes);

  let allFiles: TFile[] | null = null;
  return {
    app,
    sourcePath,
    blockFile,
    folder,
    settings,
    pluginSettings,
    folders: index.folders,
    files: index.getFilesToDisplay(settings),
    folderNotes: index.folderNotes,
    loadAllFiles: async () => (allFiles ??= await index.getAllContent()),
  };
}
