import {
  booleanField,
  defineBlockSchema,
  definePluginSchema,
  enumField,
  folderPickerField,
  numberField,
  textField,
  type BooleanSettingField,
  type EnumSettingField,
  type FolderPickerSettingField,
  type NumberSettingField,
  type TextSettingField,
} from "./types";

export type SortBy = "newest" | "oldest" | "edited" | "name" | "nameDesc";
export type ViewMode = "cards" | "list";
export type ListStyle = "markdown" | "modern" | "plain";
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

export type { SettingField, SettingsSection, SettingsSurface } from "./types";

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
    description: "How to display files.",
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
      surfaceOrder: { block: 10 },
      labels: { plugin: "Default view" },
    },
  }),

  listStyle: enumField({
    label: "List style",
    description: "The visual style to use for list views.",
    blockKey: "listStyle",
    defaultValue: "markdown",
    options: ["markdown", "modern", "plain"],
    optionLabels: {
      markdown: "Markdown",
      modern: "Modern",
      plain: "Plain Markdown",
    },
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      order: 11,
      surfaceOrder: { block: 11 },
      visibleWhen: { key: "view", value: "list" },
    },
  }),

  sortBy: enumField({
    label: "Sort by",
    description: "How to sort files.",
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
      surfaceOrder: { block: 20 },
      labels: { plugin: "Default sort" },
    },
  }),
  depth: numberField({
    label: "Subfolder depth",
    description:
      "Use 0 for the current folder only. Higher values include nested folders.",
    blockKey: "depth",
    defaultValue: 0,
    min: 0,
    max: 10,
    step: 1,
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      order: 30,
      surfaceOrder: { block: 30 },
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
      surfaceOrder: { block: 80 },
      labels: { plugin: "Pagination style" },
    },
    legacy: {
      blockKeys: ["usePagination"],
      resolve: resolveLegacyPaginationStyle,
    },
  }),
  pageSize: numberField({
    label: "Page size",
    description: "Number of items per page.",
    blockKey: "pageSize",
    defaultValue: 15,
    min: 6,
    max: 100,
    step: 1,
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      order: 50,
      surfaceOrder: { block: 90 },
      labels: { plugin: "Default page size" },
    },
  }),
  showTags: booleanField({
    label: "Display tags",
    description: "Show tags in list and card views.",
    blockKey: "showTags",
    defaultValue: true,
    ui: {
      surfaces: ["plugin", "block"],
      section: "display",
      order: 5,
      surfaceOrder: { block: 70 },
      labels: { plugin: "Default tag display" },
    },
  }),
  cardExt: enumField({
    label: "Card footer",
    description: "What to show in the card footer.",
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
      surfaceOrder: { block: 60 },
      labels: { plugin: "Default card footer", block: "Card info" },
    },
  }),
  textDirection: enumField({
    label: "Text direction",
    description:
      "Set the text direction for mixed RTL and LTR filenames. Auto is best for most users.",
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
      surfaceOrder: { block: 100 },
      labels: { plugin: "Default text direction" },
    },
  }),
  showFolders: booleanField({
    label: "Show folders",
    description: "Show folder buttons.",
    blockKey: "showFolders",
    defaultValue: true,
    ui: {
      surfaces: ["plugin", "block"],
      section: "display",
      order: 20,
      surfaceOrder: { block: 40 },
    },
  }),
  excludedFolders: folderPickerField({
    label: "Excluded folders",
    description: "Hide selected nested folders and everything inside them.",
    blockKey: "excludedFolders",
    defaultValue: [],
    placeholder: "Choose a nested folder",
    ui: {
      surfaces: ["block"],
      section: "display",
      order: 25,
      surfaceOrder: { block: 110 },
    },
  }),
  displayedNotes: enumField({
    label: "Displayed notes",
    description:
      "Show supported files, only Markdown files, all files, or no notes.",
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
      surfaceOrder: { block: 50 },
      labels: { plugin: "Displayed notes" },
    },
    legacy: {
      blockKeys: ["showNotes", "onlyNotes", "showUnsupportedFiles"],
      resolve: resolveLegacyDisplayedNotes,
    },
  }),
});

export const PLUGIN_SETTINGS_SCHEMA = definePluginSchema({
  useHomePage: booleanField({
    label: "Use homepage",
    description:
      "Open a root homepage when navigating above a root folder note.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "homepage",
      order: 1,
    },
  }),
  openHomePageInNewTabs: booleanField({
    label: "Open homepage in new tabs",
    description: "Replace newly created empty tabs with the homepage.",
    defaultValue: false,
    ui: {
      surfaces: ["plugin"],
      section: "homepage",
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
      section: "homepage",
      order: 3,
      visibleWhen: { key: "useHomePage", value: true },
    },
  }),
  forceReadingMode: booleanField({
    label: "Always open folder notes in reading mode",
    description:
      "Open folder notes in reading mode even when the default mode is editing.",
    defaultValue: false,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
      order: 4,
    },
  }),
  askForFolderNoteCreation: booleanField({
    label: "Ask before creating folder notes",
    description:
      "Show a confirmation dialog before creating a folder note from a folder click.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
      order: 5,
    },
  }),
  displayNestedFolderNotes: booleanField({
    label: "Display nested folder notes as notes",
    description:
      "When nested notes are shown, include folder notes in the notes list.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
      order: 6,
    },
  }),
  alwaysUseModernListInMobile: booleanField({
    label: "Use modern list style on mobile",
    description:
      "Use the modern list style on mobile, even when a block is set to Markdown or Plain.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "appearance",
      order: 9.5,
      visibleWhen: { platform: "mobile" },
    },
  }),
  showParentButton: booleanField({
    label: "Show parent folder button",
    description: "Show a button that navigates to the parent folder.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "appearance",
      order: 12.5,
    },
  }),
  syncFolderNotes: booleanField({
    label: "Sync folder notes on rename",
    description:
      "Keep folders and their matching folder notes synchronized when either is renamed.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
      order: 6.9,
    },
  }),
  useGlass: booleanField({
    label: "Use glass action bar",
    description: "Use the glass style for action bar controls.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "appearance",
      order: 10,
    },
  }),
  ShowIconsInCards: booleanField({
    label: "Show icons in cards view",
    description: "Show icons in card footers.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "appearance",
      order: 12,
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
        : T extends FolderPickerSettingField
          ? string[]
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
