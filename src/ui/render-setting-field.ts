import {
  AbstractInputSuggest,
  App,
  SearchComponent,
  Setting,
  TFile,
} from "obsidian";
import {
  BLOCK_SETTINGS_SCHEMA,
  BlockSettingKey,
  BlockSettings,
  SettingsSurface,
  getEnumOptionLabel,
  getSettingLabel,
  isPaginationEnabled,
} from "../explorer/settings";

type SettingFieldContext = {
  app: App;
  sourcePath: string;
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
  const setting = new Setting(container).setName(getSettingLabel(key, surface));

  if (field.description) {
    setting.setDesc(field.description);
  }

  if (field.kind === "boolean") {
    setting.addToggle((toggle) => {
      toggle.setValue(settings[key] as boolean).onChange((value) => {
        onChange(key, value as BlockSettings[typeof key]);
      });
    });
  } else if (field.kind === "number") {
    setting.addSlider((slider) => {
      slider
        .setLimits(field.min, field.max, field.step ?? 1)
        .setValue(settings[key] as number)
        .setDynamicTooltip()
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

  const availableFolders = getDescendantFolderPaths(context);
  let selected = [...value];
  let input = "";
  let search: SearchComponent;
  const selectedEl = container.createDiv("explorer-excluded-folders");

  const update = (paths: string[]): void => {
    selected = paths;
    onChange(key, paths as BlockSettings[typeof key]);
    renderSelectedFolders();
  };
  const add = (path: string): void => {
    const normalized = path.trim();
    if (
      !availableFolders.includes(normalized) ||
      selected.includes(normalized)
    ) {
      return;
    }
    update([...selected, normalized]);
    search.setValue("");
    input = "";
  };
  const renderSelectedFolders = (): void => {
    selectedEl.empty();
    for (const path of selected) {
      new Setting(selectedEl).setName(path).addButton((button) => {
        button.setButtonText("Remove").onClick(() => {
          update(selected.filter((selectedPath) => selectedPath !== path));
        });
      });
    }
  };

  setting.addSearch((component) => {
    search = component;
    component.setPlaceholder(placeholder ?? "").onChange((value) => {
      input = value;
    });
    new FolderSuggest(
      context.app,
      component.inputEl,
      availableFolders,
    ).onSelect((path) => add(path));
  });
  setting.addButton((button) => {
    button.setButtonText("Exclude").onClick(() => add(input));
  });

  renderSelectedFolders();
}

function getDescendantFolderPaths(context: SettingFieldContext): string[] {
  const file = context.app.vault.getAbstractFileByPath(context.sourcePath);
  if (!(file instanceof TFile) || !file.parent) return [];

  const parentPath = file.parent.path;
  const prefix = file.parent.isRoot() ? "" : `${parentPath}/`;
  return context.app.vault
    .getAllFolders()
    .map((folder) => folder.path)
    .filter(
      (path) => path !== parentPath && path !== "/" && path.startsWith(prefix),
    )
    .map((path) => path.slice(prefix.length))
    .filter((path) => path.length > 0)
    .sort((a, b) => a.localeCompare(b));
}
