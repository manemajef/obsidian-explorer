import { App, normalizePath, Notice, TAbstractFile, TFolder } from "obsidian";

export function canMoveIntoFolder(
  source: TAbstractFile,
  target: TFolder,
): boolean {
  if (source.parent?.path === target.path) return false;
  if (!(source instanceof TFolder)) return true;

  return (
    source.path !== target.path &&
    !target.path.startsWith(`${source.path}/`)
  );
}

export async function moveIntoFolder(
  app: App,
  sourcePath: string,
  target: TFolder,
): Promise<boolean> {
  const source = app.vault.getAbstractFileByPath(sourcePath);
  if (!source) {
    new Notice("Could not move item: it no longer exists.");
    return false;
  }
  if (!canMoveIntoFolder(source, target)) return false;

  const destinationPath = normalizePath(`${target.path}/${source.name}`);
  if (app.vault.getAbstractFileByPath(destinationPath)) {
    new Notice(`Could not move ${source.name}: an item with that name already exists.`);
    return false;
  }

  const progress =
    source instanceof TFolder
      ? new Notice(
          `Moving folder ${source.name} to ${target.name || "vault root"}`,
          0,
        )
      : null;

  try {
    if (progress) await afterNextPaint();
    await app.fileManager.renameFile(source, destinationPath);
    return true;
  } catch (error) {
    new Notice(`Could not move ${source.name}: ${error}`);
    return false;
  } finally {
    progress?.hide();
  }
}

function afterNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
}
