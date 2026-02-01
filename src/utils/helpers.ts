import { TFile } from "obsidian";

/**
 * Check if text contains RTL characters (Hebrew/Arabic)
 */
export function isRtl(text?: string): boolean {
	let checkText = text || "";
	if (!checkText) {
		const activeFile = (window as unknown as { app?: { workspace?: { getActiveFile?: () => TFile | null } } }).app?.workspace?.getActiveFile?.();
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
 * Get file basename without extension
 */
export function removeExt(file: TFile): string {
	return file.basename;
}
