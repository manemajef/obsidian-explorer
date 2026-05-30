import { App, TFile, TFolder } from "obsidian";
import { BlockSettings, PluginSettings } from "./settings";
import {
  ExplorerFileNode,
  ExplorerFolderNode,
  type ExplorerNode,
} from "./nodes";
import { ExplorerSession } from "./session";
import type { ExplorerLocation } from "./folder-notes";

export type ExplorerModel = {
  app: App;
  sourcePath: string;
  location: ExplorerLocation;
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
  sourceFolder?: TFolder;
  settings: BlockSettings;
  pluginSettings: PluginSettings;
}): Promise<ExplorerModel | null> {
  const { app, session, sourcePath, sourceFolder, settings, pluginSettings } =
    input;
  const sourceFile = app.vault.getAbstractFileByPath(sourcePath);
  if (!sourceFolder && (!(sourceFile instanceof TFile) || !sourceFile.parent))
    return null;

  const folder = sourceFolder ?? (sourceFile instanceof TFile
    ? sourceFile.parent
    : null);
  if (!folder) return null;

  const index = await session.getIndex(folder, {
    depth: settings.depth,
    displayNestedFolderNotes: pluginSettings.displayNestedFolderNotes,
    excludedFolders: settings.excludedFolders,
  });

  let allFiles: ExplorerFileNode[] | null = null;
  return {
    app,
    sourcePath,
    location: {
      folder,
      path: sourcePath,
      file: sourceFile instanceof TFile ? sourceFile : null,
    },
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
