import { Platform } from "obsidian";
import {
  BLOCK_SETTINGS_SCHEMA,
  BLOCK_SETTING_KEYS,
  PLUGIN_SETTINGS_SCHEMA,
  PLUGIN_SETTING_KEYS,
  BlockSettingKey,
  BlockSettings,
  PluginGlobalSettings,
  PluginSettingKey,
  PluginSettings,
  SETTING_SECTIONS,
  SettingsSection,
  SettingsSurface,
} from "./schema";
import type { AnySettingField, BlockField } from "./types";

const BLOCK_KEY_TO_SETTING_KEY = BLOCK_SETTING_KEYS.reduce(
  (acc, key) => {
    acc[BLOCK_SETTINGS_SCHEMA[key].blockKey] = key;
    return acc;
  },
  {} as Record<string, BlockSettingKey>,
);

const LEGACY_BLOCK_KEYS = new Set(
  BLOCK_SETTING_KEYS.flatMap((key) => {
    const field = BLOCK_SETTINGS_SCHEMA[key] as BlockField;
    const legacy = field.legacy;
    if (legacy && "blockKeys" in legacy) {
      return legacy.blockKeys;
    }
    return [];
  }),
);

export function getSettingKeyForBlockKey(
  blockKey: string,
): BlockSettingKey | undefined {
  return BLOCK_KEY_TO_SETTING_KEY[blockKey];
}

export function isLegacySettingBlockKey(blockKey: string): boolean {
  return LEGACY_BLOCK_KEYS.has(blockKey);
}

export function createDefaultBlockSettings(): BlockSettings {
  const defaults = {} as Record<
    BlockSettingKey,
    BlockSettings[BlockSettingKey]
  >;
  for (const key of BLOCK_SETTING_KEYS) {
    const value = BLOCK_SETTINGS_SCHEMA[key].defaultValue;
    defaults[key] = (
      Array.isArray(value) ? [...value] : value
    ) as BlockSettings[typeof key];
  }
  return defaults as BlockSettings;
}

export const DEFAULT_BLOCK_SETTINGS: BlockSettings =
  createDefaultBlockSettings();

function createDefaultGlobalSettings(): PluginGlobalSettings {
  const defaults = {} as PluginGlobalSettings;

  for (const key of PLUGIN_SETTING_KEYS) {
    (defaults as Record<PluginSettingKey, unknown>)[key] =
      PLUGIN_SETTINGS_SCHEMA[key].defaultValue;
  }

  return defaults;
}

export function createDefaultPluginSettings(): PluginSettings {
  return {
    defaultBlockSettings: createDefaultBlockSettings(),
    ...createDefaultGlobalSettings(),
  };
}

export const DEFAULT_PLUGIN_SETTINGS: PluginSettings =
  createDefaultPluginSettings();

export function isPaginationEnabled(settings: BlockSettings): boolean {
  return settings.paginationStyle !== "none";
}

export function shouldDisplayNotes(settings: BlockSettings): boolean {
  return settings.displayedNotes !== "none";
}

export function getSettingKeysForSurface(
  surface: SettingsSurface,
): BlockSettingKey[] {
  return BLOCK_SETTING_KEYS.filter((key) =>
    BLOCK_SETTINGS_SCHEMA[key].ui.surfaces.includes(surface),
  ).sort((a, b) => {
    const surfaceA = BLOCK_SETTINGS_SCHEMA[a].ui.surfaceOrder?.[surface];
    const surfaceB = BLOCK_SETTINGS_SCHEMA[b].ui.surfaceOrder?.[surface];
    if (surfaceA !== undefined || surfaceB !== undefined) {
      return (
        (surfaceA ?? Number.MAX_SAFE_INTEGER) -
        (surfaceB ?? Number.MAX_SAFE_INTEGER)
      );
    }

    const sectionDiff =
      SETTING_SECTIONS.findIndex((s) => s.id === BLOCK_SETTINGS_SCHEMA[a].ui.section) -
      SETTING_SECTIONS.findIndex((s) => s.id === BLOCK_SETTINGS_SCHEMA[b].ui.section);
    return (
      sectionDiff ||
      BLOCK_SETTING_KEYS.indexOf(a) - BLOCK_SETTING_KEYS.indexOf(b)
    );
  });
}

export function getSettingLabel(
  key: BlockSettingKey,
  surface: SettingsSurface,
): string {
  const field = BLOCK_SETTINGS_SCHEMA[key];
  return field.ui.labels?.[surface] ?? field.label;
}

export function getSettingSection(key: BlockSettingKey): SettingsSection {
  return BLOCK_SETTINGS_SCHEMA[key].ui.section;
}

export function getPluginSettingKeysForSection(
  section: SettingsSection,
): PluginSettingKey[] {
  return PLUGIN_SETTING_KEYS.filter(
    (key) => PLUGIN_SETTINGS_SCHEMA[key].ui.section === section,
  );
}

function isSettingVisible(
  field: AnySettingField,
  values: Record<string, unknown>,
): boolean {
  const visibleWhen = field.ui.visibleWhen;
  if (!visibleWhen) return true;

  if (
    visibleWhen.platform &&
    (visibleWhen.platform === "mobile") !== Platform.isMobile
  ) {
    return false;
  }

  if (visibleWhen.key !== undefined) {
    return values[visibleWhen.key] === visibleWhen.value;
  }

  return true;
}

export function isPluginSettingVisible(
  key: PluginSettingKey,
  settings: PluginSettings,
): boolean {
  return isSettingVisible(
    PLUGIN_SETTINGS_SCHEMA[key],
    settings as unknown as Record<string, unknown>,
  );
}

export function isBlockSettingVisible(
  key: BlockSettingKey,
  settings: BlockSettings,
): boolean {
  return isSettingVisible(
    BLOCK_SETTINGS_SCHEMA[key],
    settings as unknown as Record<string, unknown>,
  );
}

export function getEnumOptionLabel<K extends BlockSettingKey>(
  key: K,
  value: Extract<BlockSettings[K], string>,
): string {
  const field = BLOCK_SETTINGS_SCHEMA[key];
  if (field.kind !== "enum") return String(value);
  const labels = field.optionLabels as Record<string, string> | undefined;
  return labels?.[String(value)] ?? String(value);
}

export function getBlockSettingsOverrides(
  settings: BlockSettings,
  defaultSettings: BlockSettings = DEFAULT_BLOCK_SETTINGS,
): Partial<BlockSettings> {
  const overrides: Partial<BlockSettings> = {};

  for (const key of BLOCK_SETTING_KEYS) {
    if (!settingValuesEqual(settings[key], defaultSettings[key])) {
      (overrides as Record<BlockSettingKey, unknown>)[key] = settings[key];
    }
  }

  return overrides;
}

function settingValuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((value, index) => value === b[index])
    );
  }

  return a === b;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeFolderPaths(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const paths: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return undefined;

    const path = item.trim().replace(/^\/+|\/+$/g, "");
    if (!path || path.split("/").includes("..")) continue;
    if (!paths.includes(path)) paths.push(path);
  }

  return paths;
}

function applyLegacySettingAliases(
  source: Record<string, unknown>,
): Record<string, unknown> {
  const normalized = { ...source };

  for (const key of BLOCK_SETTING_KEYS) {
    const field = BLOCK_SETTINGS_SCHEMA[key] as BlockField;
    const legacy = field.legacy;
    if (!legacy) continue;

    if ("resolve" in legacy) {
      const legacyValue = legacy.resolve(source);
      if (legacyValue !== undefined) {
        normalized[key] = legacyValue;
      }
    } else if ("predecessor" in legacy && legacy.predecessor) {
      const predecessor = legacy.predecessor;
      if (predecessor in source) {
        const predValue = source[predecessor];
        if (legacy.valueMap && predValue !== undefined) {
          const keyStr = typeof predValue === "string" || typeof predValue === "number" || typeof predValue === "boolean" ? String(predValue) : "";
          const mappedValue = legacy.valueMap[keyStr];
          if (mappedValue !== undefined) {
            normalized[key] = mappedValue;
          }
        } else {
          normalized[key] = predValue;
        }
      }
    }
  }

  return normalized;
}

function coerceFieldValue<K extends BlockSettingKey>(
  key: K,
  value: unknown,
  fallback: BlockSettings[K],
): BlockSettings[K] {
  const field = BLOCK_SETTINGS_SCHEMA[key];

  if (field.kind === "boolean") {
    return (typeof value === "boolean" ? value : fallback) as BlockSettings[K];
  }

  if (field.kind === "number") {
    const numeric =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number.parseInt(value, 10)
          : NaN;

    if (Number.isNaN(numeric)) return fallback;

    return clamp(numeric, field.min, field.max) as BlockSettings[K];
  }

  if (field.kind === "folder-picker") {
    return (normalizeFolderPaths(value) ?? fallback) as BlockSettings[K];
  }

  if (typeof value === "string" && field.options.includes(value as never)) {
    return value as BlockSettings[K];
  }

  return fallback;
}

function parseFieldValue<K extends BlockSettingKey>(
  key: K,
  value: unknown,
): BlockSettings[K] | undefined {
  const field = BLOCK_SETTINGS_SCHEMA[key];

  if (field.kind === "boolean") {
    return (typeof value === "boolean" ? value : undefined) as
      | BlockSettings[K]
      | undefined;
  }

  if (field.kind === "number") {
    const numeric =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number.parseInt(value, 10)
          : NaN;

    if (Number.isNaN(numeric) || numeric < field.min || numeric > field.max) {
      return undefined;
    }

    return numeric as BlockSettings[K];
  }

  if (field.kind === "folder-picker") {
    return normalizeFolderPaths(value) as BlockSettings[K] | undefined;
  }

  if (typeof value === "string" && field.options.includes(value as never)) {
    return value as BlockSettings[K];
  }

  return undefined;
}

export function coerceBlockSettings(
  input: Record<string, unknown> | null | undefined,
  fallback: BlockSettings = DEFAULT_BLOCK_SETTINGS,
): BlockSettings {
  const source = applyLegacySettingAliases(input ?? {});
  const normalized = {} as Record<
    BlockSettingKey,
    BlockSettings[BlockSettingKey]
  >;

  for (const key of BLOCK_SETTING_KEYS) {
    normalized[key] = coerceFieldValue(key, source[key], fallback[key]);
  }

  return normalized as BlockSettings;
}

export function coercePartialBlockSettings(
  input: Record<string, unknown> | null | undefined,
): Partial<BlockSettings> {
  const source = applyLegacySettingAliases(input ?? {});
  const normalized: Partial<BlockSettings> = {};

  for (const key of BLOCK_SETTING_KEYS) {
    if (!(key in source)) continue;
    const value = parseFieldValue(key, source[key]);
    if (value !== undefined) {
      (normalized as Record<BlockSettingKey, unknown>)[key] = value;
    }
  }

  return normalized;
}

export function resolveBlockSettings(
  defaultSettings: BlockSettings,
  blockOverrides: Partial<BlockSettings>,
): BlockSettings {
  const merged: Partial<Record<BlockSettingKey, unknown>> = {
    ...defaultSettings,
    ...blockOverrides,
  };

  return coerceBlockSettings(merged, defaultSettings);
}

function coercePluginSettingValue<K extends PluginSettingKey>(
  key: K,
  value: unknown,
  fallback: PluginGlobalSettings[K],
): PluginGlobalSettings[K] {
  const field = PLUGIN_SETTINGS_SCHEMA[key];
  if (field.kind === "boolean") {
    return (
      typeof value === "boolean" ? value : fallback
    ) as PluginGlobalSettings[K];
  }

  if (field.kind === "enum") {
    return (
      typeof value === "string" && field.options.includes(value as never)
        ? value
        : fallback
    ) as PluginGlobalSettings[K];
  }

  if (field.kind === "folder-picker") {
    return (normalizeFolderPaths(value) ?? fallback) as PluginGlobalSettings[K];
  }

  return (
    typeof value === "string" ? value : fallback
  ) as PluginGlobalSettings[K];
}

export function normalizePluginSettings(raw: unknown): PluginSettings {
  const pluginDefaults = createDefaultPluginSettings();

  if (!isRecord(raw)) return pluginDefaults;

  const globalSettings = {} as PluginGlobalSettings;
  const rawBlockDefaults = isRecord(raw.defaultBlockSettings)
    ? raw.defaultBlockSettings
    : {};

  for (const key of PLUGIN_SETTING_KEYS) {
    const field = PLUGIN_SETTINGS_SCHEMA[key] as AnySettingField;
    const legacy = field.legacy;

    let sourceValue: unknown = undefined;
    let hasValue = false;

    if (key in raw) {
      sourceValue = raw[key];
      hasValue = true;
    } else if (key in rawBlockDefaults) {
      sourceValue = rawBlockDefaults[key];
      hasValue = true;
    }

    if (!hasValue && legacy && "predecessor" in legacy && legacy.predecessor) {
      const predecessor = legacy.predecessor;
      if (predecessor in raw) {
        const predValue = raw[predecessor];
        if (legacy.valueMap && predValue !== undefined) {
          const keyStr = typeof predValue === "string" || typeof predValue === "number" || typeof predValue === "boolean" ? String(predValue) : "";
          sourceValue = legacy.valueMap[keyStr];
        } else {
          sourceValue = predValue;
        }
        hasValue = true;
      }
    }

    let fallback = pluginDefaults[key];
    if (legacy && "oldDefault" in legacy && legacy.oldDefault !== undefined) {
      fallback = legacy.oldDefault as typeof fallback;
    }

    (globalSettings as Record<PluginSettingKey, unknown>)[key] =
      coercePluginSettingValue(key, hasValue ? sourceValue : undefined, fallback);
  }

  return {
    defaultBlockSettings: isRecord(raw.defaultBlockSettings)
      ? coerceBlockSettings(
          raw.defaultBlockSettings,
          pluginDefaults.defaultBlockSettings,
        )
      : pluginDefaults.defaultBlockSettings,
    ...globalSettings,
  };
}

function formatBlockValue<K extends BlockSettingKey>(
  key: K,
  value: BlockSettings[K],
): string {
  const field = BLOCK_SETTINGS_SCHEMA[key];
  if (field.kind === "enum") return `"${String(value)}"`;
  if (field.kind === "folder-picker") return JSON.stringify(value);
  return String(value);
}

function parseBlockScalar(rawValue: string): unknown {
  if (rawValue === "true") return true;
  if (rawValue === "false") return false;
  if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
    try {
      return JSON.parse(rawValue) as unknown;
    } catch {
      return rawValue;
    }
  }
  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    return rawValue.slice(1, -1);
  }
  return rawValue;
}

export function parseSettings(source: string): Partial<BlockSettings> {
  const overrides: Record<string, unknown> = {};

  for (const line of source.trim().split("\n")) {
    const match = line.match(/^(\w+):\s*(.+?)\s*$/);
    if (!match) continue;

    const [, blockKey, value] = match;
    const settingKey = getSettingKeyForBlockKey(blockKey);
    overrides[settingKey ?? blockKey] = parseBlockScalar(value.trim());
  }

  return coercePartialBlockSettings(overrides);
}

export function serializeSettings(
  settings: BlockSettings,
  defaultSettings: BlockSettings = DEFAULT_BLOCK_SETTINGS,
): string {
  const overrides = getBlockSettingsOverrides(settings, defaultSettings);

  return BLOCK_SETTING_KEYS.filter((key) => key in overrides)
    .map((key) => {
      const blockKey = BLOCK_SETTINGS_SCHEMA[key].blockKey;
      return `${blockKey}: ${formatBlockValue(key, settings[key])}`;
    })
    .join("\n");
}
