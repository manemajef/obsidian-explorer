import {
  AbstractInputSuggest,
  App,
  SearchComponent,
  Setting,
  TFile,
} from "obsidian";
import {
  BLOCK_SETTING_GROUPS,
  BLOCK_SETTINGS_SCHEMA,
  BlockSettingKey,
  BlockSettings,
  SettingsSurface,
  getEnumOptionLabel,
  isPaginationEnabled,
} from "../explorer/settings";
import { getAllVaultFolders } from "../utils";

const PAGE_SIZE_PRESETS = [6, 12, 18, 24, 30, 36, 48, 60] as const;

function formatDepthOption(depth: number): string {
  if (depth === 0) return "Current folder only";
  if (depth === 1) return "1 subfolder level";
  return `${depth} subfolder levels`;
}

type SettingFieldContext = {
  app: App;
  sourcePath: string;
};

type FolderPickerControlOptions = {
  app: App;
  value: string[];
  availableFolders: string[];
  placeholder?: string;
  selectedContainerClass: string;
  addButtonText?: string;
  onChange: (paths: string[]) => void;
  single?: boolean;
  renderSelected?: boolean;
  emptyName?: string;
  emptyDescription?: string;
  selectedDescription?: string;
  clearButtonText?: string;
  emptyButtonText?: string;
  normalizeInput?: (path: string) => string;
};

type RenderSettingFieldsOptions = {
  container: HTMLElement;
  keys: BlockSettingKey[];
  settings: BlockSettings;
  surface: SettingsSurface;
  grouped?: boolean;
  onChange: <K extends BlockSettingKey>(
    key: K,
    value: BlockSettings[K],
  ) => void;
  fieldRefs: Map<BlockSettingKey, Setting>;
  context?: SettingFieldContext;
};

class FolderSuggest extends AbstractInputSuggest<string> {
  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private readonly folders: readonly string[],
  ) {
    super(app, inputEl);
  }

  protected getSuggestions(input: string): string[] {
    const query = input.trim().toLowerCase();
    return this.folders.filter((folder) =>
      folder.toLowerCase().includes(query),
    );
  }

  renderSuggestion(folder: string, el: HTMLElement): void {
    el.setText(folder);
  }
}

export function renderSettingFields({
  container,
  keys,
  settings,
  surface,
  grouped = true,
  onChange,
  fieldRefs,
  context,
}: RenderSettingFieldsOptions): void {
  if (!grouped) {
    for (const key of keys) {
      renderSettingField(
        container,
        key,
        settings,
        surface,
        onChange,
        fieldRefs,
        context,
      );
    }
    return;
  }

  const remaining = new Set(keys);

  for (const group of BLOCK_SETTING_GROUPS) {
    const groupKeys = keys.filter((key) => {
      return (
        remaining.has(key) && BLOCK_SETTINGS_SCHEMA[key].ui.group === group.id
      );
    });
    if (groupKeys.length === 0) continue;

    new Setting(container).setName(group.title).setHeading();
    for (const key of groupKeys) {
      remaining.delete(key);
      renderSettingField(
        container,
        key,
        settings,
        surface,
        onChange,
        fieldRefs,
        context,
      );
    }
  }

  for (const key of keys) {
    if (!remaining.has(key)) continue;
    renderSettingField(
      container,
      key,
      settings,
      surface,
      onChange,
      fieldRefs,
      context,
    );
  }
}

/**
 * Renders a single setting field into the container.
 * Shared between plugin settings tab and per-block modal.
 */
export function renderSettingField(
  container: HTMLElement,
  key: BlockSettingKey,
  settings: BlockSettings,
  surface: SettingsSurface,
  onChange: <K extends BlockSettingKey>(
    key: K,
    value: BlockSettings[K],
  ) => void,
  fieldRefs: Map<BlockSettingKey, Setting>,
  context?: SettingFieldContext,
): void {
  const field = BLOCK_SETTINGS_SCHEMA[key];
  const setting = new Setting(container).setName(field.label);

  if (field.description) {
    setting.setDesc(field.description);
  }

  if (field.kind === "boolean") {
    setting.addToggle((toggle) => {
      toggle.setValue(settings[key] as boolean).onChange((value) => {
        onChange(key, value as BlockSettings[typeof key]);
      });
    });
  } else if (field.kind === "number" && key === "pageSize") {
    setting.addDropdown((dropdown) => {
      const currentValue =
        typeof settings[key] === "number" && Number.isFinite(settings[key])
          ? settings[key]
          : field.defaultValue;
      const options = PAGE_SIZE_PRESETS.includes(
        currentValue as (typeof PAGE_SIZE_PRESETS)[number],
      )
        ? PAGE_SIZE_PRESETS
        : [...PAGE_SIZE_PRESETS, currentValue].sort((a, b) => a - b);

      for (const preset of options) {
        dropdown.addOption(String(preset), String(preset));
      }
      dropdown.setValue(String(currentValue)).onChange((value) => {
        onChange(key, Number.parseInt(value, 10));
      });
    });
  } else if (field.kind === "number" && key === "depth") {
    setting.addDropdown((dropdown) => {
      for (let depth = field.min; depth <= field.max; depth += field.step ?? 1) {
        dropdown.addOption(String(depth), formatDepthOption(depth));
      }
      dropdown.setValue(String(settings[key])).onChange((value) => {
        onChange(key, Number.parseInt(value, 10));
      });
    });
  } else if (field.kind === "number") {
    setting.addSlider((slider) => {
      slider
        .setLimits(field.min, field.max, field.step ?? 1)
        .setValue(settings[key] as number)
        .onChange((value) => {
          onChange(key, value as BlockSettings[typeof key]);
        });
    });
  } else if (field.kind === "folder-picker") {
    renderFolderPicker(
      container,
      setting,
      key,
      settings[key] as string[],
      onChange,
      context,
      field.placeholder,
    );
  } else {
    setting.addDropdown((dropdown) => {
      for (const option of field.options) {
        dropdown.addOption(option, getEnumOptionLabel(key, option));
      }
      dropdown.setValue(settings[key] as string).onChange((value) => {
        onChange(key, value as BlockSettings[typeof key]);
        if (key === "paginationStyle") {
          fieldRefs.get("pageSize")?.setDisabled(value === "none");
        }
      });
    });
  }

  if (key === "pageSize") {
    setting.setDisabled(!isPaginationEnabled(settings));
  }

  fieldRefs.set(key, setting);
}

function renderFolderPicker(
  container: HTMLElement,
  setting: Setting,
  key: BlockSettingKey,
  value: string[],
  onChange: <K extends BlockSettingKey>(
    key: K,
    value: BlockSettings[K],
  ) => void,
  context: SettingFieldContext | undefined,
  placeholder: string | undefined,
): void {
  if (!context) {
    setting.setDisabled(true);
    return;
  }

  renderFolderPickerControl(container, setting, {
    app: context.app,
    value,
    availableFolders: getDescendantFolderPaths(context),
    placeholder,
    selectedContainerClass: "explorer-excluded-folders",
    addButtonText: "Exclude",
    onChange: (paths) => {
      onChange(key, paths as BlockSettings[typeof key]);
    },
  });
}

export function renderFolderPickerControl(
  container: HTMLElement,
  setting: Setting,
  options: FolderPickerControlOptions,
): void {
  const {
    app,
    availableFolders,
    placeholder,
    selectedContainerClass,
    addButtonText,
    onChange,
    single = false,
    renderSelected = true,
    emptyName,
    emptyDescription,
    selectedDescription,
    clearButtonText = "Remove",
    emptyButtonText,
    normalizeInput = (path) => path.trim(),
  } = options;
  let selected = [...options.value];
  let input = single ? (selected[0] ?? "") : "";
  let search: SearchComponent | null = null;
  const selectedEl = renderSelected
    ? container.createDiv(selectedContainerClass)
    : null;

  const renderSelectedFolders = (): void => {
    if (!selectedEl) return;
    selectedEl.empty();
    if (selected.length === 0 && emptyName) {
      const emptySetting = new Setting(selectedEl).setName(emptyName);
      if (emptyDescription) emptySetting.setDesc(emptyDescription);
      if (emptyButtonText) {
        emptySetting.addButton((button) => {
          button.setButtonText(emptyButtonText).setDisabled(true);
        });
      }
      return;
    }

    for (const path of selected) {
      const selectedSetting = new Setting(selectedEl).setName(path);
      if (selectedDescription) selectedSetting.setDesc(selectedDescription);
      selectedSetting.addButton((button) => {
        button.setButtonText(clearButtonText).onClick(() => {
          onUpdate(selected.filter((selectedPath) => selectedPath !== path));
        });
      });
    }
  };
  const onUpdate = (paths: string[]): void => {
    selected = paths;
    onChange(paths);
    renderSelectedFolders();
  };
  const add = (path: string): void => {
    const normalized = normalizeInput(path);
    if (single && normalized === "") {
      onUpdate([]);
      search?.setValue("");
      input = "";
      return;
    }

    if (!availableFolders.includes(normalized)) return;
    if (!single && selected.includes(normalized)) return;

    onUpdate(single ? [normalized] : [...selected, normalized]);
    search?.setValue(single ? normalized : "");
    input = single ? normalized : "";
  };

  setting.addSearch((component) => {
    search = component;
    component
      .setPlaceholder(placeholder ?? "")
      .setValue(input)
      .onChange((value) => {
        input = value;
        if (!single) return;

        const normalized = normalizeInput(value);
        if (normalized === "") {
          onUpdate([]);
        } else if (availableFolders.includes(normalized)) {
          onUpdate([normalized]);
        }
      });
    new FolderSuggest(app, component.inputEl, availableFolders).onSelect(add);
  });
  if (addButtonText) {
    setting.addButton((button) => {
      button.setButtonText(addButtonText).onClick(() => add(input));
    });
  }

  renderSelectedFolders();
}

function getDescendantFolderPaths(context: SettingFieldContext): string[] {
  const file = context.app.vault.getAbstractFileByPath(context.sourcePath);
  if (!(file instanceof TFile) || !file.parent) return [];

  const parentPath = file.parent.path;
  const prefix = file.parent.isRoot() ? "" : `${parentPath}/`;
  return getAllVaultFolders(context.app.vault.getRoot())
    .map((folder) => folder.path)
    .filter(
      (path) => path !== parentPath && path !== "/" && path.startsWith(prefix),
    )
    .map((path) => path.slice(prefix.length))
    .filter((path) => path.length > 0)
    .sort((a, b) => a.localeCompare(b));
}
