import { Setting } from "obsidian";
import {
  BLOCK_SETTINGS_SCHEMA,
  BlockSettingKey,
  BlockSettings,
  SettingsSurface,
  getEnumOptionLabel,
  getSettingLabel,
} from "../settings/schema";

/**
 * Renders a single setting field into the container.
 * Shared between plugin settings tab and per-block modal.
 */
export function renderSettingField(
  container: HTMLElement,
  key: BlockSettingKey,
  settings: BlockSettings,
  surface: SettingsSurface,
  onChange: <K extends BlockSettingKey>(key: K, value: BlockSettings[K]) => void,
  fieldRefs: Map<BlockSettingKey, Setting>,
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
        if (key === "usePagination") {
          fieldRefs.get("pageSize")?.setDisabled(!value);
          fieldRefs.get("paginationStyle")?.setDisabled(!value);
        }
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
  } else {
    setting.addDropdown((dropdown) => {
      for (const option of field.options) {
        dropdown.addOption(option, getEnumOptionLabel(key, option));
      }
      dropdown.setValue(settings[key] as string).onChange((value) => {
        onChange(key, value as BlockSettings[typeof key]);
      });
    });
  }

  if (key === "pageSize" || key === "paginationStyle") {
    setting.setDisabled(!settings.usePagination);
  }

  fieldRefs.set(key, setting);
}
