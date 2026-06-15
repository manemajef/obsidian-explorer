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
import { Platform } from "obsidian";

export type SortBy = "newest" | "oldest" | "edited" | "name" | "nameDesc";
export type ViewMode = "cards" | "list";
export type ListStyle = "markdown" | "modern" | "plain";
export type DirectionMode = "rtl" | "ltr" | "auto";
export type PaginationStyle = "modern" | "classic" | "none";
export type DisplayedNotes = "supported" | "markdown" | "all" | "none";
export type MissingFolderNoteBehavior = "smart" | "create" | "manual";

export const SETTING_SECTIONS = [
  {
    id: "navigation",
    title: "Navigation",
    description: undefined,
  },
  {
    id: "foldernotes",
    title: "Folder notes",
    description: "Markdown folder note behavior.",
  },
  {
    id: "homepage",
    title: "Homepage",
    description: undefined,
  },
  {
    id: "visibility",
    title: "Visibility",
    description: "Control which elements appear in Explorer views.",
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Plugin-wide visuals that apply to every Explorer view.",
  },
  {
    id: "core",
    title: "Block defaults",
    description: "These can be overridden per code block.",
  },
  {
    id: "display",
    title: "Default display",
    description: "Default visibility options for new blocks.",
  },
  {
    id: "behavior",
    title: "Behavior",
    description: undefined,
  },
] as const;

export type SettingsSection = (typeof SETTING_SECTIONS)[number]["id"];

export const BLOCK_SETTING_GROUPS = [
  {
    id: "view",
    title: "View",
  },
  {
    id: "navigation",
    title: "Navigation",
  },
  {
    id: "listing",
    title: "Listing",
  },
  {
    id: "pagination",
    title: "Pagination",
  },
  {
    id: "appearance",
    title: "Appearance",
  },
  {
    id: "excluded",
    title: "Excluded folders",
  },
  {
    id: "behavior",
    title: "Behavior",
  },
] as const;

export type BlockSettingsGroup = (typeof BLOCK_SETTING_GROUPS)[number]["id"];

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

export const PLUGIN_SETTINGS_SCHEMA = definePluginSchema({
  // NAVIGATION
  showTitlebarActions: booleanField({
    label: "Show titlebar actions",
    description:
      "Show Explorer navigation buttons in the active note titlebar.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
    },
  }),

  openFolderViewFromSidebar: booleanField({
    label: "Open folder views from sidebar",
    description:
      "Open Explorer folder views when clicking folder names in the Obsidian sidebar.",
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
      "Open a root-level homepage when navigating above a root folder note.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "navigation",
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

  // FOLDERNOTEs
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
  createFolderNoteOnNewFolder: booleanField({
    label: "Create Markdown folder notes for new folders",
    description:
      "When creating a folder from Explorer, also create a Markdown folder note file. Turn this off to keep new folders file-free until you add a file from the folder note settings.",
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
    description: "Choose when Explorer creates missing Markdown folder notes.",
    defaultValue: "manual",
    options: ["manual", "smart", "create"],
    optionLabels: {
      smart: "Missing links and edits",
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
  askForFolderNoteCreation: booleanField({
    label: "Ask before creating folder notes",
    description:
      "Show a confirmation dialog before creating a folder note from folder navigation.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "foldernotes",
      visibleWhen: { key: "missingFolderNoteBehavior", value: "create" },
    },
  }),

  // HOMEPAGE
  showHomePageInTitlebar: booleanField({
    label: "Show homepage button in titlebar",
    description:
      "Show a home button in the note titlebar to quickly navigate to the homepage.",
    defaultValue: true,
    ui: {
      surfaces: ["plugin"],
      section: "homepage",
      // visibleWhen: { key: "useHomePage", value: true },
      visibleWhen: () => false,
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
  // VISIBILITY
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
  showTitlearActionsOnMobile: booleanField({
    label: "Show title bar actions in mobile",
    description:
      "By default this is off, since mobile has limited space. toggle on for easy navigation",
    defaultValue: false,
    ui: {
      surfaces: ["plugin"],
      section: "visibility",
      visibleWhen: { key: "showTitlebarActions", value: true },
    },
  }),

  useLinkColorInCard: booleanField({
    label: "Use link color in card header",
    description: "Use the theme link color for card titles.",
    defaultValue: false,
    ui: {
      surfaces: ["plugin"],
      section: "appearance",
      visibleWhen: () => false,
    },
  }),
  isDev: booleanField({
    label: "is dev",
    defaultValue: false,
    ui: {
      surfaces: ["plugin"],
      section: "visibility",
      visibleWhen: () => false,
    },
  }),
});

////////////////////// block settings //////////////////////
////////////////////// block settings //////////////////////

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
      group: "view",
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
      group: "view",
      visibleWhen: { key: "view", value: "list" },
    },
  }),
  compactCards: booleanField({
    label: "Compact cards",
    description: "Use denser card spacing to fit more cards in the view.",
    defaultValue: true,
    blockKey: "compactCards",
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      group: "view",
      visibleWhen: (values) => {
        if (values.view !== "cards") return false;
        if (Platform.isMobile && values.adaptToMobile !== false) return false;
        return true;
      },
    },
  }),
  adaptToMobile: booleanField({
    label: "Adapt to mobile",
    description:
      "Use mobile-friendly list and card layouts on small screens. Turn this off to keep desktop view behavior on mobile.",
    defaultValue: true,
    blockKey: "adaptToMobile",
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      group: "view",
      visibleWhen: { platform: "mobile" },
    },
    legacy: {
      blockKeys: ["alwaysUseModernListInMobile"],
      resolve: (source) =>
        coerceLegacyBoolean(source.alwaysUseModernListInMobile),
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
      group: "listing",
    },
  }),
  displayedNotes: enumField({
    label: "Notes to show",
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
      group: "listing",
    },
    legacy: {
      blockKeys: ["showNotes", "onlyNotes", "showUnsupportedFiles"],
      resolve: resolveLegacyDisplayedNotes,
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
      group: "listing",
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
      group: "pagination",
    },
  }),

  paginationStyle: enumField({
    label: "Pagination style",
    description:
      "Choose whether to append pages, show page buttons, or display every file.",
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
      group: "pagination",
      visibleWhen: { platform: "desktop" },
    },
    legacy: {
      blockKeys: ["usePagination"],
      resolve: resolveLegacyPaginationStyle,
    },
  }),

  showPreviews: booleanField({
    label: "Show previews",
    description: "Show note previews in cards and modern list views.",
    blockKey: "showPreviews",
    defaultValue: true,
    ui: {
      surfaces: ["plugin", "block"],
      section: "display",
      group: "appearance",
    },
  }),
  showTags: booleanField({
    label: "Show tags",
    description: "Show tags in list and card views.",
    blockKey: "showTags",
    defaultValue: true,
    ui: {
      surfaces: ["plugin", "block"],
      section: "display",
      group: "appearance",
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
      group: "listing",
    },
  }),
  compactActionBar: booleanField({
    label: "Compact action bar",
    description: "Use plain, tighter action bar controls.",
    defaultValue: false,
    blockKey: "compactActionBar",
    ui: {
      surfaces: ["plugin", "block"],
      section: "core",
      group: "appearance",
    },
    legacy: {
      blockKeys: ["useGlass"],
      resolve: (source) => {
        const useGlass = coerceLegacyBoolean(source.useGlass);
        return useGlass === undefined ? undefined : !useGlass;
      },
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
      group: "excluded",
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
      group: "behavior",
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
