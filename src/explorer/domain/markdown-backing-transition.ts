import {
  completeAddMarkdownBacking,
  completeRemoveMarkdownBacking,
} from "./folder-page";

export async function executeAddMarkdownBacking<TFile>(effects: {
  confirmWrite: () => Promise<boolean>;
  writeMarkdown: () => Promise<TFile | null>;
  deleteStoredOverrides: () => void;
  openMarkdown: (file: TFile) => Promise<void>;
}): Promise<void> {
  if (!(await effects.confirmWrite())) return;
  const transition = completeAddMarkdownBacking(
    await effects.writeMarkdown(),
  );
  if (!transition) return;

  effects.deleteStoredOverrides();
  await effects.openMarkdown(transition.file);
}

export async function executeRemoveMarkdownBacking(effects: {
  confirmDelete: () => Promise<boolean>;
  deleteMarkdown: () => Promise<boolean>;
  storeOverrides: () => void;
  openFileFree: () => Promise<void>;
}): Promise<void> {
  if (!(await effects.confirmDelete())) return;
  const transition = completeRemoveMarkdownBacking(
    await effects.deleteMarkdown(),
  );
  if (!transition) return;

  effects.storeOverrides();
  await effects.openFileFree();
}
