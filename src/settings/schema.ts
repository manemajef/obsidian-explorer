export type SortBy = "newest" | "oldest" | "edited" | "name";
export type ViewMode = "cards" | "list";
export type DirectionMode = "rtl" | "ltr" | "auto";
export type PaginationStyle = "modern" | "classic" | "none";
export type DisplayedNotes = "supported" | "markdown" | "all" | "none";

export type CardExt =
  | "folder"
  | "ctime"
  | "mtime"
  | "desc"
  | "none"
  | "default";

export type SettingsSurface = "plugin" | "block";
export type SettingsSection =
  | "core"
  | "behavior"
  | "display"
  | "appearance"
  | "navigation";

type SettingUiMeta = {
  surfaces: readonly SettingsSurface[];
  section: SettingsSection;
  order: number;
  labels?: Partial<Record<SettingsSurface, string>>;
};

type LegacySettingAlias<T> = {
  blockKeys: readonly string[];
  resolve: (source: Record<string, unknown>) => T | undefined;
};

type BaseSettingField<T> = {
  label: string;
  description?: string;
  blockKey: string;
  defaultValue: T;
  legacy?: LegacySettingAlias<T>;
  ui: SettingUiMeta;
};

type EnumSettingField<T extends string> = BaseSettingField<T> & {
  kind: "enum";
  options: readonly T[];
  optionLabels?: Partial<Record<T, string>>;
};

type NumberSettingField = BaseSettingField<number> & {
  kind: "number";
  min: number;
  max: number;
  step?: number;
};

type BooleanSettingField = BaseSettingField<boolean> & {
  kind: "boolean";
};

export type SettingField<T> =
  | EnumSettingField<Extract<T, string>>
  | NumberSettingField
  | BooleanSettingField;

const enumField = <T extends string>(
  field: Omit<EnumSettingField<T>, "kind">,
): EnumSettingField<T> => ({
  kind: "enum",
  ...field,
});

const numberField = (
  field: Omit<NumberSettingField, "kind">,
): NumberSettingField => ({
  kind: "number",
  ...field,
});

const booleanField = (
  field: Omit<BooleanSettingField, "kind">,
): BooleanSettingField => ({
  kind: "boolean",
  ...field,
});

export const BLOCK_SETTINGS_SCHEMA = {
  view: enumField<ViewMode>({
    label: "View",
    description: "How to display files",
    blockKey: "view",
    defaultValue: "list",
    options: ["cards", "list"],
    optionLabels: {
      cards: "Cards",
      list: "List",
    },
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      order: 10,
      labels: {
        plugin: "Default view",
      },
    },
  }),
  sortBy: enumField<SortBy>({
    label: "Sort by",
    description: "How to sort files",
    blockKey: "sortBy",
    defaultValue: "oldest",
    options: ["newest", "oldest", "edited", "name"],
    optionLabels: {
      newest: "Newest",
      oldest: "Oldest",
      edited: "Last edited",
      name: "Name",
    },
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      order: 20,
      labels: {
        plugin: "Default sort",
      },
    },
  }),
  depth: numberField({
    label: "Subfolder depth",
    description: "0 = current folder only, 1+ includes nested folders",
    blockKey: "depth",
    defaultValue: 0,
    min: 0,
    max: 10,
    step: 1,
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      order: 30,
      labels: {
        plugin: "Default depth",
      },
    },
  }),
  paginationStyle: enumField<PaginationStyle>({
    label: "Pagination style",
    description:
      "Load more appends pages, classic shows page buttons, none shows every file.",
    blockKey: "paginationStyle",
    defaultValue: "modern",
    options: ["modern", "classic", "none"],
    optionLabels: {
      modern: "Load more",
      classic: "Classic",
      none: "None",
    },
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      order: 40,
      labels: {
        plugin: "Pagination style",
      },
    },
    legacy: {
      blockKeys: ["usePagination"],
      resolve: resolveLegacyPaginationStyle,
    },
  }),
  showTags: booleanField({
    label: "Display Tags",
    description: "Show Tags in list and card view",
    blockKey: "showTags",
    defaultValue: true,
    ui: {
      surfaces: ["plugin", "block"],
      section: "display",
      order: 5,
      labels: {
        plugin: "Default tag display",
      },
    },
  }),
  pageSize: numberField({
    label: "Page size",
    description: "Number of items per page",
    blockKey: "pageSize",
    defaultValue: 15,
    min: 6,
    max: 100,
    step: 1,
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      order: 50,
      labels: {
        plugin: "Default page size",
      },
    },
  }),
  useGlass: booleanField({
    label: "Use glass action bar",
    description: "Use the glass style for the action bar controls",
    blockKey: "useGlass",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "appearance",
      order: 10,
    },
  }),
  cardExt: enumField<CardExt>({
    label: "Card footer",
    description: "What to show on card footer",
    blockKey: "cardExt",
    defaultValue: "default",
    options: ["folder", "ctime", "mtime", "desc", "none", "default"],
    optionLabels: {
      folder: "Folder",
      ctime: "Created",
      mtime: "Modified",
      desc: "Description",
      none: "None",
      default: "Default",
    },
    ui: {
      surfaces: ["plugin", "block"],
      section: "display",
      order: 10,
      labels: {
        plugin: "Default card footer",
        block: "Card info",
      },
    },
  }),
  textDirection: enumField<DirectionMode>({
    label: "Text direction",
    description:
      "Set explicit text direction for mixed RTL and LTR files (Arabic, Hebrew), for most users best to leave it `auto`.",
    blockKey: "textDirection",
    defaultValue: "auto",
    options: ["auto", "ltr", "rtl"],
    optionLabels: {
      rtl: "Right to left",
      ltr: "Left to right",
      auto: "Auto (based on filename)",
    },
    ui: {
      surfaces: ["plugin", "block"],
      section: "behavior",
      order: 50,
      labels: {
        plugin: "Default text direction",
      },
    },
  }),

  showFolders: booleanField({
    label: "Show folders",
    description: "Show folder buttons",
    blockKey: "showFolders",
    defaultValue: true,
    ui: {
      surfaces: ["plugin", "block"],
      section: "display",
      order: 20,
    },
  }),
  displayedNotes: enumField<DisplayedNotes>({
    label: "Displayed notes",
    description:
      "Show supported files or only Markdown. Select all for unsupported files, or none to hide.",
    blockKey: "displayedNotes",
    defaultValue: "supported",
    options: ["supported", "markdown", "all", "none"],
    optionLabels: {
      supported: "Supported files",
      markdown: "Only Markdown",
      all: "All files",
      none: "None",
    },
    ui: {
      surfaces: ["plugin", "block"],
      section: "display",
      order: 30,
      labels: {
        plugin: "Displayed notes",
      },
    },
    legacy: {
      blockKeys: ["showNotes", "onlyNotes", "showUnsupportedFiles"],
      resolve: resolveLegacyDisplayedNotes,
    },
  }),
  showParentButton: booleanField({
    label: "Show parent folder button",
    description: "Show a button to navigate to the parent folder",
    blockKey: "showParentButton",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
      order: 10,
    },
  }),
} as const;

type InferSettingValue<T> =
  T extends SettingField<infer V>
    ? V
    : T extends NumberSettingField
      ? number
      : T extends BooleanSettingField
        ? boolean
        : never;

export type BlockSettings = {
  -readonly [K in keyof typeof BLOCK_SETTINGS_SCHEMA]: InferSettingValue<
    (typeof BLOCK_SETTINGS_SCHEMA)[K]
  >;
};

export type BlockSettingKey = keyof BlockSettings;

export interface PluginSettings {
  defaultBlockSettings: BlockSettings;
}

export const BLOCK_SETTING_KEYS = Object.keys(
  BLOCK_SETTINGS_SCHEMA,
) as BlockSettingKey[];

const BLOCK_KEY_TO_SETTING_KEY = BLOCK_SETTING_KEYS.reduce(
  (acc, key) => {
    acc[BLOCK_SETTINGS_SCHEMA[key].blockKey] = key;
    return acc;
  },
  {} as Record<string, BlockSettingKey>,
);

const LEGACY_BLOCK_KEYS = new Set(
  BLOCK_SETTING_KEYS.flatMap(
    (key) => BLOCK_SETTINGS_SCHEMA[key].legacy?.blockKeys ?? [],
  ),
);

const SETTING_SECTION_SORT_ORDER: SettingsSection[] = [
  "core",
  "display",
  "behavior",
  "appearance",
  "navigation",
];

export function getSettingKeysForSurface(
  surface: SettingsSurface,
): BlockSettingKey[] {
  return BLOCK_SETTING_KEYS.filter((key) =>
    BLOCK_SETTINGS_SCHEMA[key].ui.surfaces.includes(surface),
  ).sort((a, b) => {
    const sectionDiff =
      SETTING_SECTION_SORT_ORDER.indexOf(BLOCK_SETTINGS_SCHEMA[a].ui.section) -
      SETTING_SECTION_SORT_ORDER.indexOf(BLOCK_SETTINGS_SCHEMA[b].ui.section);

    if (sectionDiff !== 0) {
      return sectionDiff;
    }

    return (
      BLOCK_SETTINGS_SCHEMA[a].ui.order - BLOCK_SETTINGS_SCHEMA[b].ui.order
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

export function getSettingSurfaces(
  key: BlockSettingKey,
): readonly SettingsSurface[] {
  return BLOCK_SETTINGS_SCHEMA[key].ui.surfaces;
}

export function getSettingKeyForBlockKey(
  blockKey: string,
): BlockSettingKey | undefined {
  return BLOCK_KEY_TO_SETTING_KEY[blockKey];
}

export function isLegacySettingBlockKey(blockKey: string): boolean {
  return LEGACY_BLOCK_KEYS.has(blockKey);
}

export function getEnumOptionLabel<K extends BlockSettingKey>(
  key: K,
  value: Extract<BlockSettings[K], string>,
): string {
  const field = BLOCK_SETTINGS_SCHEMA[key];
  if (field.kind !== "enum") {
    return String(value);
  }

  const labels = field.optionLabels as Record<string, string> | undefined;
  return labels?.[String(value)] ?? String(value);
}

export function createDefaultBlockSettings(): BlockSettings {
  const defaults = {} as Record<
    BlockSettingKey,
    BlockSettings[BlockSettingKey]
  >;
  for (const key of BLOCK_SETTING_KEYS) {
    defaults[key] = BLOCK_SETTINGS_SCHEMA[key].defaultValue;
  }
  return defaults as BlockSettings;
}

export const DEFAULT_BLOCK_SETTINGS: BlockSettings =
  createDefaultBlockSettings();

export function createDefaultPluginSettings(): PluginSettings {
  return {
    defaultBlockSettings: createDefaultBlockSettings(),
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

export function getBlockSettingsOverrides(
  settings: BlockSettings,
  defaultSettings: BlockSettings = DEFAULT_BLOCK_SETTINGS,
): Partial<BlockSettings> {
  const overrides: Partial<BlockSettings> = {};

  for (const key of BLOCK_SETTING_KEYS) {
    if (settings[key] !== defaultSettings[key]) {
      (overrides as Record<BlockSettingKey, unknown>)[key] = settings[key];
    }
  }

  return overrides;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hasOwn(source: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function coerceLegacyBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function resolveLegacyPaginationStyle(
  source: Record<string, unknown>,
): PaginationStyle | undefined {
  const usePagination = coerceLegacyBoolean(source.usePagination);
  if (usePagination === false) return "none";
  if (!hasOwn(source, "paginationStyle") && usePagination === true) {
    return "modern";
  }
  return undefined;
}

function resolveLegacyDisplayedNotes(
  source: Record<string, unknown>,
): DisplayedNotes | undefined {
  if (hasOwn(source, "displayedNotes")) return undefined;

  const showNotes = coerceLegacyBoolean(source.showNotes);
  const onlyNotes = coerceLegacyBoolean(source.onlyNotes);
  const showUnsupportedFiles = coerceLegacyBoolean(source.showUnsupportedFiles);

  if (showNotes === false) return "none";
  if (onlyNotes === true) return "markdown";
  if (showUnsupportedFiles === true) return "all";
  if (
    hasOwn(source, "showNotes") ||
    hasOwn(source, "onlyNotes") ||
    hasOwn(source, "showUnsupportedFiles")
  ) {
    return "supported";
  }
  return undefined;
}

function applyLegacySettingAliases(
  source: Record<string, unknown>,
): Record<string, unknown> {
  const normalized = { ...source };

  for (const key of BLOCK_SETTING_KEYS) {
    const legacyValue = BLOCK_SETTINGS_SCHEMA[key].legacy?.resolve(source);
    if (legacyValue !== undefined) {
      normalized[key] = legacyValue;
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

    if (Number.isNaN(numeric)) {
      return fallback;
    }

    return clamp(numeric, field.min, field.max) as BlockSettings[K];
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
    if (!hasOwn(source, key)) continue;
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

export function normalizePluginSettings(raw: unknown): PluginSettings {
  const pluginDefaults = createDefaultPluginSettings();

  if (!isRecord(raw) || !isRecord(raw.defaultBlockSettings)) {
    return pluginDefaults;
  }

  return {
    defaultBlockSettings: coerceBlockSettings(
      raw.defaultBlockSettings as Record<string, unknown>,
      pluginDefaults.defaultBlockSettings,
    ),
  };
}
