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
export type MissingFolderNoteBehavior = "smart" | "create" | "manual";
export type CardExt =
  | "folder"
  | "ctime"
  | "mtime"
  | "desc"
  | "none"
  | "default";

export const SETTING_SECTIONS = [
  {
    id: "navigation",
    title: "Navigation",
    description: undefined,
  },
  {
    id: "foldernotes",
    title: "Folder Notes",
    description: "Markdown folder notes behaviour",
  },
  {
    id: "homepage",
    title: "Homepage",
    description: undefined,
  },
  {
    id: "visibility",
    title: "Visibility",
    description: "Control visibility of elements in the UI",
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Plugin-wide visuals that apply to every explorer.",
  },
  {
    id: "core",
    title: "Block defaults",
    description: "These can be overridden per code block.",
  },
  {
    id: "display",
    title: "Default display",
    description: "Visibility defaults for new blocks.",
  },
  {
    id: "behavior",
    title: "Behavior",
    description: undefined,
  },
] as const;

export type SettingsSection = (typeof SETTING_SECTIONS)[number]["id"];

export type { SettingField, SettingsSurface } from "./types";

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
      surfaceOrder: { block: 11 },
      visibleWhen: { key: "view", value: "list" },
    },
  }),
  compactCards: booleanField({
    label: "Compact cards",
    description: "Turn on to make cards dencer and fit more in the view",
    defaultValue: true,
    blockKey: "compactCards",
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      surfaceOrder: { block: 11.1 },
      visibleWhen: { key: "view", value: "cards" },
    },
  }),
  // compact: booleanField({
  //   label: "Compact view",
  //   description: "Compact view to fit more content. emmits previews",
  //   defaultValue: false,
  // })

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
    defaultValue: 30,
    min: 6,
    max: 60,
    step: 1,
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
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
      surfaceOrder: { block: 60 },
      labels: { plugin: "Default card footer", block: "Card info" },
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
      surfaceOrder: { block: 50 },
      labels: { plugin: "Displayed notes" },
    },
    legacy: {
      blockKeys: ["showNotes", "onlyNotes", "showUnsupportedFiles"],
      resolve: resolveLegacyDisplayedNotes,
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
      surfaceOrder: { block: 100 },
      labels: { plugin: "Default text direction" },
    },
  }),
});

export const PLUGIN_SETTINGS_SCHEMA = definePluginSchema({
  createFolderNoteOnNewFolder: booleanField({
    label: "Create Markdown folder notes for new folders",
    description:
      "When you create a folder from Explorer, also create a Markdown folder note file. Off keeps new folders file-free — you can add a file later from the folder note's settings.",
    defaultValue: false,
    ui: {
      surfaces: ["plugin"],
      section: "foldernotes",
    },
    legacy: {
      oldDefault: true,
    },
  }),
  missingFolderNoteBehavior: enumField({
    label: "Create missing folder notes when",
    description: "Choose when Explorer creates the Markdown note.",
    defaultValue: "manual",
    options: ["manual", "smart", "create"],
    optionLabels: {
      smart: "Clicking missing links and edits",
      create: "Always create",
      manual: "Edits only",
    },
    ui: {
      surfaces: ["plugin"],
      section: "foldernotes",
      // visibleWhen: { key: "createFolderNoteOnNewFolder", value: true },
    },
    legacy: {
      oldDefault: "create",
    },
  }),
  forceReadingMode: booleanField({
    label: "Always open folder notes in reading mode",
    description:
      "Open folder notes in reading mode even when the default mode is editing.",
    defaultValue: false,
    ui: {
      surfaces: ["plugin"],
      section: "foldernotes",
    },
  }),
  askForFolderNoteCreation: booleanField({
    label: "Ask before creating folder notes",
    description:
      "Show a confirmation dialog before creating a folder note from a folder click.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "foldernotes",
      visibleWhen: { key: "missingFolderNoteBehaviour", value: "create" },
    },
  }),
  syncFolderNotes: booleanField({
    label: "Sync folder notes on rename",
    description:
      "Keep folders and their matching folder notes synchronized when either is renamed.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "foldernotes",
    },
    legacy: {
      oldDefault: false,
    },
  }),
  displayNestedFolderNotes: booleanField({
    label: "Display nested folder notes as notes",
    description:
      "When nested notes are shown, include folder notes in the notes list.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "visibility",
    },
  }),

  hideFolderNotesInFileExplorer: booleanField({
    label: "Hide folder-note files in Obsidian sidebar",
    description:
      "Hide Markdown folder-note files from Obsidian's built-in file tree.",
    defaultValue: false,
    ui: {
      surfaces: ["plugin"],
      section: "visibility",
    },
  }),
  openFolderViewFromSidebar: booleanField({
    label: "Open folder views from sidebar explorer",
    description:
      "Open explorer folders when clicking their name in the Obsidian sidebar.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
    },
    legacy: {
      predecessor: "sidebarFolderClickBehavior",
      valueMap: {
        nothing: false,
        virtual: true,
        existing: true,
      },
    },
  }),
  useHomePage: booleanField({
    label: "Use homepage",
    description:
      "Open a root homepage when navigating above a root folder note.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "homepage",
    },
  }),
  openHomePageInNewTabs: booleanField({
    label: "Open homepage in new tabs",
    description: "Replace newly created empty tabs with the homepage.",
    defaultValue: false,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
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
      visibleWhen: { key: "useHomePage", value: true },
    },
  }),
  homePageNoteInbox: folderPickerField({
    label: "Inbox for homepage notes",
    description:
      "Create notes from the homepage in this folder. Leave empty for the vault root.",
    defaultValue: [],
    placeholder: "Choose an inbox folder",
    ui: {
      surfaces: ["plugin"],
      section: "homepage",
      visibleWhen: { key: "useHomePage", value: true },
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
      visibleWhen: { platform: "mobile" },
    },
  }),
  useGlass: booleanField({
    label: "Use glass action bar",
    description: "Use the glass style for action bar controls.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "appearance",
    },
  }),
  useLinkColorInCard: booleanField({
    label: "Use link color in card header",
    description: "Turn off to use text color in cards link instead",
    defaultValue: false,
    ui: {
      surfaces: ["plugin"],
      section: "appearance",
    },
  }),
  ShowIconsInCards: booleanField({
    label: "Show icons in cards view",
    description: "Show icons in card footers.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "appearance",
    },
  }),
  showParentButton: booleanField({
    label: "Show parent folder button",
    description: "Show a button that navigates to the parent folder.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "visibility",
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
