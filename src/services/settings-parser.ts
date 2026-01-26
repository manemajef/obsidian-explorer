import { ExplorerSettings } from "../types";
import { DEFAULT_SETTINGS } from "../constants";

// Per-block settings parser/serializer for explorer code blocks.

/**
 * Parse settings from code block source text
 * Format: key: "value" or key: value
 */
export function parseSettings(source: string): Partial<ExplorerSettings> {
	const settings: Partial<ExplorerSettings> = {};
	const lines = source.trim().split("\n");

	for (const line of lines) {
		const match = line.match(/^(\w+):\s*["']?([^"'\n]+)["']?$/);
		if (!match) continue;

		const [, key, value] = match;

		switch (key) {
			case "sortBy":
				if (["newest", "oldest", "edited", "name"].includes(value)) {
					settings.sortBy = value as ExplorerSettings["sortBy"];
				}
				break;
			case "view":
				if (["cards", "list"].includes(value)) {
					settings.view = value as ExplorerSettings["view"];
				}
				break;
			case "depth":
				const depthNum = parseInt(value);
				if (!isNaN(depthNum) && depthNum >= 0 && depthNum <= 10) {
					settings.depth = depthNum;
				}
				break;
			case "pageSize":
				const pageSizeNum = parseInt(value);
				if (!isNaN(pageSizeNum) && pageSizeNum >= 6 && pageSizeNum <= 100) {
					settings.pageSize = pageSizeNum;
				}
				break;
			case "onlyNotes":
				settings.onlyNotes = value === "true";
				break;
			case "showFolders":
				settings.showFolders = value === "true";
				break;
			case "showBreadcrumbs":
				settings.showBreadcrumbs = value === "true";
				break;
			case "cardExt":
				if (["folder", "ctime", "mtime", "desc", "none", "default"].includes(value)) {
					settings.cardExt = value as ExplorerSettings["cardExt"];
				}
				break;
			case "showNotes":
				settings.showNotes = value === "true";
				break;
		}
	}

	return settings;
}

/**
 * Serialize settings back to code block format
 * Only includes non-default values
 */
export function serializeSettings(settings: ExplorerSettings): string {
	const lines: string[] = [];

	if (settings.sortBy !== DEFAULT_SETTINGS.sortBy) {
		lines.push(`sortBy: "${settings.sortBy}"`);
	}
	if (settings.view !== DEFAULT_SETTINGS.view) {
		lines.push(`view: "${settings.view}"`);
	}
	if (settings.depth !== DEFAULT_SETTINGS.depth) {
		lines.push(`depth: ${settings.depth}`);
	}
	if (settings.pageSize !== DEFAULT_SETTINGS.pageSize) {
		lines.push(`pageSize: ${settings.pageSize}`);
	}
	if (settings.onlyNotes !== DEFAULT_SETTINGS.onlyNotes) {
		lines.push(`onlyNotes: ${settings.onlyNotes}`);
	}
	if (settings.showFolders !== DEFAULT_SETTINGS.showFolders) {
		lines.push(`showFolders: ${settings.showFolders}`);
	}
	if (settings.showBreadcrumbs !== DEFAULT_SETTINGS.showBreadcrumbs) {
		lines.push(`showBreadcrumbs: ${settings.showBreadcrumbs}`);
	}
	if (settings.cardExt !== DEFAULT_SETTINGS.cardExt) {
		lines.push(`cardExt: "${settings.cardExt}"`);
	}
	if (settings.showNotes !== DEFAULT_SETTINGS.showNotes) {
		lines.push(`showNotes: ${settings.showNotes}`);
	}

	return lines.join("\n");
}
