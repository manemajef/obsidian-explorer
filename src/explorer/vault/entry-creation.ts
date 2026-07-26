import { App, TFile, TFolder, normalizePath } from "obsidian";

export type CreateVaultEntryResult<T> =
  | { kind: "created"; entry: T }
  | { kind: "existing"; entry: T }
  | { kind: "collision"; path: string }
  | { kind: "failed"; error: unknown };

export function resolveExistingCreateTarget<T>(input: {
  entry: T | null;
  occupied: boolean;
  path: string;
}): Extract<
  CreateVaultEntryResult<T>,
  { kind: "existing" | "collision" }
> | null {
  if (input.entry) return { kind: "existing", entry: input.entry };
  return input.occupied ? { kind: "collision", path: input.path } : null;
}

export async function createVaultFolder(
  app: App,
  basePath: string,
  name: string,
): Promise<CreateVaultEntryResult<TFolder>> {
  const path = normalizePath(`${basePath}/${name}`);
  const existing = app.vault.getAbstractFileByPath(path);
  const target = resolveExistingCreateTarget({
    entry: existing instanceof TFolder ? existing : null,
    occupied: existing !== null,
    path,
  });
  if (target) return target;

  try {
    await app.vault.createFolder(path);
    const folder = app.vault.getAbstractFileByPath(path);
    return folder instanceof TFolder
      ? { kind: "created", entry: folder }
      : { kind: "collision", path };
  } catch (error) {
    return { kind: "failed", error };
  }
}

export async function createVaultNote(
  app: App,
  basePath: string,
  name: string,
): Promise<CreateVaultEntryResult<TFile>> {
  const path = normalizePath(`${basePath}/${name}.md`);
  const existing = app.vault.getAbstractFileByPath(path);
  const target = resolveExistingCreateTarget({
    entry: existing instanceof TFile ? existing : null,
    occupied: existing !== null,
    path,
  });
  if (target) return target;

  try {
    return { kind: "created", entry: await app.vault.create(path, "") };
  } catch (error) {
    return { kind: "failed", error };
  }
}
