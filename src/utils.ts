import { TFile, TFolder } from "obsidian";

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
  return /[\u0590-\u05FF\u0600-\u06FF]/.test(checkText);
}

export function diffDays(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "Now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return `${Math.floor(diffMins / 60)} hours ago`;
  if (days === 1) return "Yesterday";
  if (days === 7) return "One week ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function getAllVaultFolders(root: TFolder): TFolder[] {
  const folders: TFolder[] = [];

  const visit = (folder: TFolder): void => {
    folders.push(folder);
    for (const child of folder.children) {
      if (child instanceof TFolder) visit(child);
    }
  };

  visit(root);
  return folders;
}

export function isElement(value: unknown): value is Element {
  return Boolean(value && (value as Node).instanceOf?.(Element));
}

export function isHTMLElement(value: unknown): value is HTMLElement {
  return Boolean(value && (value as Node).instanceOf?.(HTMLElement));
}
