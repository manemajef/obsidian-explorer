import { App, TFile, TFolder } from "obsidian";
import { BlockSettings, PluginSettings } from "./settings";
import {
  ExplorerFileNode,
  ExplorerFolderNode,
  type ExplorerNode,
} from "./data/explorer-nodes";
import { resolveFolderPageBacking } from "./domain/folder-page";
import type { ExplorerLocation } from "./domain/explorer-location";
import { ExplorerSession } from "./data/session";

export {
  ExplorerFileNode,
  ExplorerFolderNode,
  type ExplorerNode,
} from "./data/explorer-nodes";

export type ExplorerModel = {
  app: App;
  sourcePath: string;
  location: ExplorerLocation;
  folder: TFolder;
  settings: BlockSettings;
  pluginSettings: PluginSettings;
  children: ExplorerNode[];
  folders: ExplorerFolderNode[];
  files: ExplorerFileNode[];
  folderNotes: ExplorerFileNode[];
  missingFolderLinkCreatesMarkdown: boolean;
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

  const folder =
    sourceFolder ?? (sourceFile instanceof TFile ? sourceFile.parent : null);
  if (!folder) return null;

  const index = await session.getIndex(folder, {
    includeSubfolders: settings.includeSubfolders,
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
    settings,
    pluginSettings,
    children: index.children,
    folders: index.folders.sort((a, b) => a.name.localeCompare(b.name)),
    files: index.getFilesToDisplay(settings),
    folderNotes: index.folderNotes,
    missingFolderLinkCreatesMarkdown:
      resolveFolderPageBacking({
        existing: null,
        missingBehavior: pluginSettings.missingFolderNoteBehavior,
        intent: "explicit",
      }).kind === "create-markdown",
    loadAllFiles: async (onChunk) => {
      if (allFiles) return allFiles;
      allFiles = await index.getAllContent(onChunk);
      return allFiles;
    },
  };
}
