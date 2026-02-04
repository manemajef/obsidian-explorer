import { DEFAULT_SETTINGS } from "../constants";
import { ExplorerSettings } from "../types";

const SORT_OPTIONS: ExplorerSettings["sortBy"][] = [
  "newest",
  "oldest",
  "edited",
  "name",
];
const VIEW_OPTIONS: ExplorerSettings["view"][] = ["cards", "list"];
const CARD_EXT_OPTIONS: ExplorerSettings["cardExt"][] = [
  "folder",
  "ctime",
  "mtime",
  "desc",
  "none",
  "default",
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function resolveEffectiveSettings(
  pluginSettings: ExplorerSettings,
  blockSettings: Partial<ExplorerSettings>,
): ExplorerSettings {
  const merged: ExplorerSettings = {
    ...DEFAULT_SETTINGS,
    ...pluginSettings,
    ...blockSettings,
  };

  if (!SORT_OPTIONS.includes(merged.sortBy)) {
    merged.sortBy = DEFAULT_SETTINGS.sortBy;
  }
  if (!VIEW_OPTIONS.includes(merged.view)) {
    merged.view = DEFAULT_SETTINGS.view;
  }
  if (!CARD_EXT_OPTIONS.includes(merged.cardExt)) {
    merged.cardExt = DEFAULT_SETTINGS.cardExt;
  }

  merged.depth = clamp(merged.depth, 0, 10);
  merged.pageSize = clamp(merged.pageSize, 6, 100);

  return merged;
}

