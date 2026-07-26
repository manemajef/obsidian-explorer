import type { MissingFolderNoteBehavior } from "../settings";

export type FolderPageOpenIntent =
  | "navigate"
  | "explicit"
  | "save"
  | "sidebar"
  | "created-folder";

export type OpenFolderRequest = {
  newLeaf?: boolean;
  intent?: FolderPageOpenIntent;
};

export type FolderPageBacking<TFile> =
  | { kind: "markdown"; file: TFile }
  | { kind: "file-free" };

export type FolderPage<TFolder, TFile> = {
  folder: TFolder;
  backing: FolderPageBacking<TFile>;
};

export type FolderPageBackingPlan<TFile> =
  | { kind: "markdown"; file: TFile }
  | { kind: "create-markdown" }
  | { kind: "file-free" };

export type AddedMarkdownBacking<TFile> = {
  file: TFile;
  deleteStoredOverrides: true;
};

export type RemovedMarkdownBacking = {
  storeOverrides: true;
  openFileFree: true;
};

export function resolveFolderPageBacking<TFile>(input: {
  existing: TFile | null;
  missingBehavior: MissingFolderNoteBehavior;
  intent: FolderPageOpenIntent;
}): FolderPageBackingPlan<TFile> {
  if (input.existing) return { kind: "markdown", file: input.existing };

  if (shouldCreateMarkdown(input.missingBehavior, input.intent)) {
    return { kind: "create-markdown" };
  }

  return { kind: "file-free" };
}

export function completeFolderPage<TFolder, TFile>(
  folder: TFolder,
  plan: FolderPageBackingPlan<TFile>,
  created: TFile | null = null,
): FolderPage<TFolder, TFile> | null {
  if (plan.kind === "create-markdown") {
    return created
      ? { folder, backing: { kind: "markdown", file: created } }
      : null;
  }

  return { folder, backing: plan };
}

export function completeAddMarkdownBacking<TFile>(
  file: TFile | null,
): AddedMarkdownBacking<TFile> | null {
  return file ? { file, deleteStoredOverrides: true } : null;
}

export function completeRemoveMarkdownBacking(
  deleted: boolean,
): RemovedMarkdownBacking | null {
  return deleted ? { storeOverrides: true, openFileFree: true } : null;
}

function shouldCreateMarkdown(
  missingBehavior: MissingFolderNoteBehavior,
  intent: FolderPageOpenIntent,
): boolean {
  if (intent === "save") return true;
  if (intent === "sidebar" || intent === "created-folder") return false;

  switch (missingBehavior) {
    case "create":
      return true;
    case "smart":
      return intent === "explicit";
    case "manual":
      return false;
  }
}
