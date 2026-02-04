import { DEFAULT_SETTINGS } from "../../constants";
import { ExplorerSettings } from "../../types";

/**
 * Parse per-block settings from explorer code block source text.
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
      case "depth": {
        const depthNum = parseInt(value, 10);
        if (!isNaN(depthNum) && depthNum >= 0 && depthNum <= 10) {
          settings.depth = depthNum;
        }
        break;
      }
      case "pageSize": {
        const pageSizeNum = parseInt(value, 10);
        if (!isNaN(pageSizeNum) && pageSizeNum >= 6 && pageSizeNum <= 100) {
          settings.pageSize = pageSizeNum;
        }
        break;
      }
      case "usePagination":
        settings.usePagination = value === "true";
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
      case "showParentButton":
        settings.showParentButton = value === "true";
        break;
      case "cardExt":
        if (
          ["folder", "ctime", "mtime", "desc", "none", "default"].includes(value)
        ) {
          settings.cardExt = value as ExplorerSettings["cardExt"];
        }
        break;
      case "showNotes":
        settings.showNotes = value === "true";
        break;
      case "useGlass":
        settings.useGlass = value === "true";
        break;
      case "showUnsupportedFiles":
        settings.showUnsupportedFiles = value === "true";
        break;
    }
  }

  return settings;
}

/**
 * Serialize settings into block syntax, emitting only non-default values.
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
  if (settings.usePagination !== DEFAULT_SETTINGS.usePagination) {
    lines.push(`usePagination: ${settings.usePagination}`);
  }
  if (settings.onlyNotes !== DEFAULT_SETTINGS.onlyNotes) {
    lines.push(`onlyNotes: ${settings.onlyNotes}`);
  }
  if (settings.showUnsupportedFiles !== DEFAULT_SETTINGS.showUnsupportedFiles) {
    lines.push(`showUnsupportedFiles: ${settings.showUnsupportedFiles}`);
  }
  if (settings.showFolders !== DEFAULT_SETTINGS.showFolders) {
    lines.push(`showFolders: ${settings.showFolders}`);
  }
  if (settings.showBreadcrumbs !== DEFAULT_SETTINGS.showBreadcrumbs) {
    lines.push(`showBreadcrumbs: ${settings.showBreadcrumbs}`);
  }
  if (settings.showParentButton !== DEFAULT_SETTINGS.showParentButton) {
    lines.push(`showParentButton: ${settings.showParentButton}`);
  }
  if (settings.cardExt !== DEFAULT_SETTINGS.cardExt) {
    lines.push(`cardExt: "${settings.cardExt}"`);
  }
  if (settings.showNotes !== DEFAULT_SETTINGS.showNotes) {
    lines.push(`showNotes: ${settings.showNotes}`);
  }
  if (settings.useGlass !== DEFAULT_SETTINGS.useGlass) {
    lines.push(`useGlass: ${settings.useGlass}`);
  }

  return lines.join("\n");
}

