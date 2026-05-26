export type SortBy = "newest" | "oldest" | "edited" | "name" | "nameDesc";
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

type SettingVisibility = {
  key: string;
  value: unknown;
};

type SettingUiMeta = {
  surfaces: readonly SettingsSurface[];
  section: SettingsSection;
  order: number;
  labels?: Partial<Record<SettingsSurface, string>>;
  visibleWhen?: SettingVisibility;
};

type LegacySettingAlias<T> = {
  blockKeys: readonly string[];
  resolve: (source: Record<string, unknown>) => T | undefined;
};

type BaseSettingField<T> = {
  label: string;
  description?: string;
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

type TextSettingField = BaseSettingField<string> & {
  kind: "text";
  placeholder?: (vaultName: string) => string;
};

export type SettingField<T> =
  | EnumSettingField<Extract<T, string>>
  | NumberSettingField
  | BooleanSettingField
  | TextSettingField;

type AnySettingField =
  | EnumSettingField<string>
  | NumberSettingField
  | BooleanSettingField
  | TextSettingField;

type BlockField = (
  | EnumSettingField<string>
  | NumberSettingField
  | BooleanSettingField
) & {
  blockKey: string;
  legacy?: LegacySettingAlias<unknown>;
};

const enumField = <T extends string, F extends Omit<EnumSettingField<T>, "kind">>(
  field: F,
): F & { kind: "enum" } => ({
  kind: "enum",
  ...field,
});

const numberField = <F extends Omit<NumberSettingField, "kind">>(
  field: F,
): F & { kind: "number" } => ({
  kind: "number",
  ...field,
});

const booleanField = <F extends Omit<BooleanSettingField, "kind">>(
  field: F,
): F & { kind: "boolean" } => ({
  kind: "boolean",
  ...field,
});

const textField = <F extends Omit<TextSettingField, "kind">>(
  field: F,
): F & { kind: "text" } => ({
  kind: "text",
  ...field,
});

type DefinedBlockSchema<T extends Record<string, BlockField>> = {
  [K in keyof T]: T[K] & {
    description?: string;
    legacy?: LegacySettingAlias<unknown>;
    ui: SettingUiMeta;
  };
};

type DefinedPluginSchema<T extends Record<string, AnySettingField>> = {
  [K in keyof T]: T[K] & { ui: SettingUiMeta };
};

function defineBlockSchema<T extends Record<string, BlockField>>(
  schema: T,
): DefinedBlockSchema<T> {
  return schema as DefinedBlockSchema<T>;
}

function definePluginSchema<T extends Record<string, AnySettingField>>(
  schema: T,
): DefinedPluginSchema<T> {
  return schema as DefinedPluginSchema<T>;
}

function hasOwn(source: Record<string, unknown>, key: string): boolean {
  return key in source;
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

export const BLOCK_SETTINGS_SCHEMA = defineBlockSchema({
  view: enumField({
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
      labels: { plugin: "Default view" },
    },
  }),
  sortBy: enumField({
    label: "Sort by",
    description: "How to sort files",
    blockKey: "sortBy",
    defaultValue: "oldest",
    options: ["newest", "oldest", "edited", "name", "nameDesc"],
    optionLabels: {
      newest: "Newest",
      oldest: "Oldest",
      edited: "Last edited",
      name: "Name",
      nameDesc: "Name (reverse)",
    },
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      order: 20,
      labels: { plugin: "Default sort" },
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
      labels: { plugin: "Default depth" },
    },
  }),
  paginationStyle: enumField({
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
      labels: { plugin: "Pagination style" },
    },
    legacy: {
      blockKeys: ["usePagination"],
      resolve: resolveLegacyPaginationStyle,
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
      labels: { plugin: "Default page size" },
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
      labels: { plugin: "Default tag display" },
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
  showListBullets: booleanField({
    label: "Use bullets in lists",
    description: "display lists with bullets, turn off for plain lists",
    blockKey: "showListBullets",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "appearance",
      order: 11,
    },
  }),
  displayNestedFolderNotes: booleanField({
    label: "Display nested folder notes as notes",
    description:
      "When displaying nested notes, also show folder notes in the notes list.",
    blockKey: "displayNestedFolderNotes",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
      order: 9.5,
    },
  }),
  ShowIconsInCards: booleanField({
    label: "Show icons in cards view",
    blockKey: "showIconsInCards",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "appearance",
      order: 12,
    },
  }),
  cardExt: enumField({
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
      labels: { plugin: "Default card footer", block: "Card info" },
    },
  }),
  textDirection: enumField({
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
      labels: { plugin: "Default text direction" },
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
  displayedNotes: enumField({
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
      labels: { plugin: "Displayed notes" },
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
  askForFolderNoteCreation: booleanField({
    label: "Ask before folder note creation",
    description:
      "display a confirmation dialog before creating new foldernote when clicking on a folder in the ui",
    blockKey: "askForFolderNoteCreation",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
      order: 9.5,
    },
  }),
});

export const PLUGIN_SETTINGS_SCHEMA = definePluginSchema({
  useHomePage: booleanField({
    label: "Use homepage",
    description: "Open a root homepage when navigating above a root folder note.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
      order: 1,
    },
  }),
  openHomePageInNewTabs: booleanField({
    label: "Open homepage in new tabs",
    description: "Replace newly created empty tabs with the homepage.",
    defaultValue: false,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
      order: 2,
      visibleWhen: { key: "useHomePage", value: true },
    },
  }),
  homePageName: textField({
    label: "Homepage name",
    description: "Root note name. Leave empty to use the vault name.",
    defaultValue: "",
    placeholder: (vaultName: string) => vaultName,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
      order: 3,
      visibleWhen: { key: "useHomePage", value: true },
    },
  }),
});

type InferSettingValue<T> =
  T extends EnumSettingField<infer V>
    ? V
    : T extends NumberSettingField
      ? number
      : T extends BooleanSettingField
        ? boolean
        : T extends TextSettingField
          ? string
          : never;

export type BlockSettingKey = keyof typeof BLOCK_SETTINGS_SCHEMA;
export type BlockSettings = {
  -readonly [K in BlockSettingKey]: InferSettingValue<
    (typeof BLOCK_SETTINGS_SCHEMA)[K]
  >;
};

export type PluginSettingKey = keyof typeof PLUGIN_SETTINGS_SCHEMA;
export type PluginGlobalSettings = {
  -readonly [K in PluginSettingKey]: InferSettingValue<
    (typeof PLUGIN_SETTINGS_SCHEMA)[K]
  >;
};
export type PluginSettings = {
  defaultBlockSettings: BlockSettings;
} & PluginGlobalSettings;

export const BLOCK_SETTING_KEYS = Object.keys(
  BLOCK_SETTINGS_SCHEMA,
) as BlockSettingKey[];
export const PLUGIN_SETTING_KEYS = Object.keys(
  PLUGIN_SETTINGS_SCHEMA,
) as PluginSettingKey[];

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
    return (
      sectionDiff ||
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

export function getPluginSettingKeysForSection(
  section: SettingsSection,
): PluginSettingKey[] {
  return PLUGIN_SETTING_KEYS.filter(
    (key) => PLUGIN_SETTINGS_SCHEMA[key].ui.section === section,
  ).sort(
    (a, b) =>
      PLUGIN_SETTINGS_SCHEMA[a].ui.order - PLUGIN_SETTINGS_SCHEMA[b].ui.order,
  );
}

function isSettingVisible(
  field: AnySettingField,
  values: Record<string, unknown>,
): boolean {
  const visibleWhen = field.ui.visibleWhen;
  return !visibleWhen || values[visibleWhen.key] === visibleWhen.value;
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
