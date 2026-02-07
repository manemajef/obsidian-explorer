export type SortBy = "newest" | "oldest" | "edited" | "name";
export type ViewMode = "cards" | "list";
export type CardExt =
  | "folder"
  | "ctime"
  | "mtime"
  | "desc"
  | "none"
  | "default";

export type SettingsSurface = "plugin" | "block";
export type SettingsSection = "core" | "behavior" | "display" | "navigation";

type SettingUiMeta = {
  surfaces: readonly SettingsSurface[];
  section: SettingsSection;
  order: number;
  labels?: Partial<Record<SettingsSurface, string>>;
};

type BaseSettingField<T> = {
  label: string;
  description?: string;
  blockKey: string;
  defaultValue: T;
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
  usePagination: booleanField({
    label: "Enable pagination",
    description: "Turn off to show all files in one list",
    blockKey: "usePagination",
    defaultValue: true,
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      order: 40,
    },
  }),
  showTags: booleanField({
    label: "Display Tags",
    description: "Show Tags in list and card view",
    blockKey: "showTags",
    defaultValue: true,
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      order: 25,
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
  showUnsupportedFiles: booleanField({
    label: "Show unsupported files",
    description: "Show code files and uncommon formats",
    blockKey: "showUnsupportedFiles",
    defaultValue: false,
    ui: {
      surfaces: ["plugin"],
      section: "behavior",
      order: 20,
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
  showNotes: booleanField({
    label: "Show notes",
    description: "Show note files in the listing",
    blockKey: "showNotes",
    defaultValue: true,
    ui: {
      surfaces: ["plugin", "block"],
      section: "display",
      order: 30,
    },
  }),
  onlyNotes: booleanField({
    label: "Only notes",
    description: "Show only notes and PDFs",
    blockKey: "onlyNotes",
    defaultValue: false,
    ui: {
      surfaces: ["plugin", "block"],
      section: "display",
      order: 40,
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
  // Kept in schema for parser compatibility, hidden from current UIs.
  showBreadcrumbs: booleanField({
    label: "Show breadcrumbs",
    description: "Show path navigation",
    blockKey: "showBreadcrumbs",
    defaultValue: true,
    ui: {
      surfaces: [],
      section: "display",
      order: 99,
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

export function getSettingKeysForSurface(
  surface: SettingsSurface,
): BlockSettingKey[] {
  return BLOCK_SETTING_KEYS.filter((key) =>
    BLOCK_SETTINGS_SCHEMA[key].ui.surfaces.includes(surface),
  ).sort(
    (a, b) =>
      BLOCK_SETTINGS_SCHEMA[a].ui.order - BLOCK_SETTINGS_SCHEMA[b].ui.order,
  );
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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

export function coerceBlockSettings(
  input: Partial<Record<BlockSettingKey, unknown>> | null | undefined,
  fallback: BlockSettings = DEFAULT_BLOCK_SETTINGS,
): BlockSettings {
  const source = input ?? {};
  const normalized = {} as Record<
    BlockSettingKey,
    BlockSettings[BlockSettingKey]
  >;

  for (const key of BLOCK_SETTING_KEYS) {
    normalized[key] = coerceFieldValue(key, source[key], fallback[key]);
  }

  return normalized as BlockSettings;
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

  if (!isRecord(raw)) {
    return pluginDefaults;
  }

  const nestedDefaults = raw.defaultBlockSettings;
  if (isRecord(nestedDefaults)) {
    return {
      defaultBlockSettings: coerceBlockSettings(
        nestedDefaults as Partial<Record<BlockSettingKey, unknown>>,
        pluginDefaults.defaultBlockSettings,
      ),
    };
  }

  // Backward compatibility: pre-refactor saved data was a flat settings object.
  const legacy: Partial<Record<BlockSettingKey, unknown>> = {};
  let hasLegacyValue = false;

  for (const key of BLOCK_SETTING_KEYS) {
    if (key in raw) {
      legacy[key] = raw[key];
      hasLegacyValue = true;
    }
  }

  if (!hasLegacyValue) {
    return pluginDefaults;
  }

  return {
    defaultBlockSettings: coerceBlockSettings(
      legacy,
      pluginDefaults.defaultBlockSettings,
    ),
  };
}
