import { App, TFile, TFolder } from "obsidian";

/**
 * Check if text contains RTL characters (Hebrew/Arabic)
 */
export function isRtl(text?: string): boolean {
  let checkText = text || "";
  if (!checkText) {
    const activeFile = (
      window as unknown as {
        app?: { workspace?: { getActiveFile?: () => TFile | null } };
      }
    ).app?.workspace?.getActiveFile?.();
    checkText = activeFile?.basename || "";
  }
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
  return rtlRegex.test(checkText);
}

/**
 * Format timestamp as relative time string
 */
export function diffDays(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * Check if a file is a folder note (foldername/foldername.md pattern)
 */
export function isFolderNote(file: TFile): boolean {
  if (!file.parent) return false;
  return file.basename === file.parent.name;
}

/**
 * Get the folder note for a given folder if it exists
 */
export function getFolderNotePath(folder: TFolder): string {
  return `${folder.path}/${folder.name}.md`;
}

export function getFolderNoteForFolder(
  app: App,
  folder: TFolder,
): TFile | null {
  const folderNotePath = getFolderNotePath(folder);
  const file = app.vault.getAbstractFileByPath(folderNotePath);
  return file instanceof TFile ? file : null;
}

/**
 * Check if a file is pinned via frontmatter
 */
export function isPinned(app: App, file: TFile): boolean {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter;
  return fm?.pin === true;
}

export function togglePin(app: App, file: TFile): void {
  void app.fileManager.processFrontMatter(
    file,
    (frontmatter: Record<string, unknown>) => {
      if (isPinned(app, file)) {
        delete frontmatter["pin"];
      } else {
        frontmatter["pin"] = true;
      }
    },
  );
}
