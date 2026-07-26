import type {
  FolderPageOpenIntent,
  OpenFolderRequest,
} from "./folder-page";
import {
  completeFolderPage,
  resolveFolderPageBacking,
} from "./folder-page";
import type { MissingFolderNoteBehavior } from "../settings";

export type MarkdownFolderPagePresentation = {
  method: "link" | "file";
  sourcePath: string;
  newLeaf: boolean;
  markNavigationPending: boolean;
  forceReadingMode: boolean;
};

export type OpenFolderPageEffects<TFolder, TFile> = {
  openHomepage: (sourcePath: string, newLeaf: boolean) => Promise<void>;
  findMarkdown: (folder: TFolder) => TFile | null;
  createMarkdown: (folder: TFolder) => Promise<TFile | null>;
  openMarkdown: (
    file: TFile,
    presentation: MarkdownFolderPagePresentation,
  ) => Promise<void>;
  openFileFree: (folder: TFolder, newLeaf: boolean) => Promise<void>;
};

export async function executeOpenFolderPage<TFolder, TFile>(input: {
  folder: TFolder;
  isRoot: boolean;
  missingBehavior: MissingFolderNoteBehavior;
  forceReadingMode: boolean;
  sourcePath: string;
  request?: OpenFolderRequest;
  effects: OpenFolderPageEffects<TFolder, TFile>;
}): Promise<void> {
  const { newLeaf = false, intent = "navigate" } = input.request ?? {};
  if (input.isRoot) {
    await input.effects.openHomepage(input.sourcePath, newLeaf);
    return;
  }

  const plan = resolveFolderPageBacking({
    existing: input.effects.findMarkdown(input.folder),
    missingBehavior: input.missingBehavior,
    intent,
  });
  const created =
    plan.kind === "create-markdown"
      ? await input.effects.createMarkdown(input.folder)
      : null;
  const page = completeFolderPage(input.folder, plan, created);
  if (!page) return;

  if (page.backing.kind === "file-free") {
    await input.effects.openFileFree(page.folder, newLeaf);
    return;
  }

  await input.effects.openMarkdown(
    page.backing.file,
    resolveMarkdownPresentation(
      intent,
      input.sourcePath,
      newLeaf,
      input.forceReadingMode,
    ),
  );
}

export function resolveMarkdownPresentation(
  intent: FolderPageOpenIntent,
  sourcePath: string,
  newLeaf: boolean,
  forceReadingMode: boolean,
): MarkdownFolderPagePresentation {
  if (intent === "created-folder") {
    return {
      method: "file",
      sourcePath: "",
      newLeaf,
      markNavigationPending: false,
      forceReadingMode: false,
    };
  }

  if (intent === "sidebar") {
    return {
      method: "link",
      sourcePath: "",
      newLeaf,
      markNavigationPending: false,
      forceReadingMode: false,
    };
  }

  return {
    method: "link",
    sourcePath,
    newLeaf,
    markNavigationPending: true,
    forceReadingMode,
  };
}
