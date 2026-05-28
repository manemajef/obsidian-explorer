import { App, TFile, TFolder } from "obsidian";
import { BlockSettings, PluginSettings } from "./settings";
import {
  ExplorerFileNode,
  ExplorerFolderNode,
  type ExplorerNode,
} from "./nodes";
import { ExplorerSession } from "./session";

export type ExplorerModel = {
  app: App;
  sourcePath: string;
  blockFile: TFile;
  folder: TFolder;
  session: ExplorerSession;
  settings: BlockSettings;
  pluginSettings: PluginSettings;
  children: ExplorerNode[];
  folders: ExplorerFolderNode[];
  files: ExplorerFileNode[];
  folderNotes: ExplorerFileNode[];
  loadAllFiles: (
    onChunk?: (chunk: ExplorerFileNode[]) => void,
  ) => Promise<ExplorerFileNode[]>;
};

export async function buildExplorerModel(input: {
  app: App;
  session: ExplorerSession;
  sourcePath: string;
  settings: BlockSettings;
  pluginSettings: PluginSettings;
}): Promise<ExplorerModel | null> {
  const { app, session, sourcePath, settings, pluginSettings } = input;
  const blockFile = app.vault.getAbstractFileByPath(sourcePath);
  if (!(blockFile instanceof TFile) || !blockFile.parent) return null;

  const folder = blockFile.parent;
  const index = await session.getIndex(folder, {
    depth: settings.depth,
    displayNestedFolderNotes: pluginSettings.displayNestedFolderNotes,
    excludedFolders: settings.excludedFolders,
  });

  let allFiles: ExplorerFileNode[] | null = null;
  return {
    app,
    sourcePath,
    blockFile,
    folder,
    session,
    settings,
    pluginSettings,
    children: index.children,
    folders: index.folders,
    files: index.getFilesToDisplay(settings),
    folderNotes: index.folderNotes,
    loadAllFiles: async (onChunk) => {
      if (allFiles) return allFiles;
      allFiles = await index.getAllContent(onChunk);
      return allFiles;
    },
  };
}
