import { App, PluginSettingTab, Setting } from "obsidian";
import ExplorerPlugin from "../../main";
import { DEFAULT_SETTINGS } from "../constants";
import { ExplorerSettings } from "../types";

// Global plugin defaults UI (Obsidian settings tab).
export class ExplorerSettingsTab extends PluginSettingTab {
  plugin: ExplorerPlugin;

  constructor(app: App, plugin: ExplorerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("Block defaults").setHeading();
    containerEl.createEl("p", {
      text: "These can be overridden per code block.",
      cls: "setting-item-description",
    });

    new Setting(containerEl).setName("Default view").addDropdown((dropdown) => {
      dropdown
        .addOption("list", "List")
        .addOption("cards", "Cards")
        .setValue(this.plugin.settings.view)
        .onChange((value) => {
          void this.updateSetting("view", value as ExplorerSettings["view"]);
        });
    });

    new Setting(containerEl).setName("Default sort").addDropdown((dropdown) => {
      dropdown
        .addOption("oldest", "Oldest")
        .addOption("newest", "Newest")
        .addOption("edited", "Last edited")
        .addOption("name", "Name")
        .setValue(this.plugin.settings.sortBy)
        .onChange((value) => {
          void this.updateSetting("sortBy", value as ExplorerSettings["sortBy"]);
        });
    });

    new Setting(containerEl)
      .setName("Default depth")
      .setDesc("0 = current folder only; 1+ includes nested folders.")
      .addSlider((slider) => {
        slider
          .setLimits(0, 10, 1)
          .setValue(this.plugin.settings.depth)
          .setDynamicTooltip()
          .onChange((value) => {
            void this.updateSetting("depth", value);
          });
      });

    let pageSizeSetting: Setting | null = null;

    new Setting(containerEl)
      .setName("Enable pagination")
      .setDesc("Turn off to show all files in a single list.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.usePagination).onChange((value) => {
          void this.updateSetting("usePagination", value);
          pageSizeSetting?.setDisabled(!value);
        });
      });

    pageSizeSetting = new Setting(containerEl)
      .setName("Default page size")
      .addText((text) => {
        text
          .setPlaceholder(String(DEFAULT_SETTINGS.pageSize))
          .setValue(String(this.plugin.settings.pageSize))
          .onChange((value) => {
            const parsed = Number.parseInt(value, 10);
            if (!Number.isNaN(parsed) && parsed > 0) {
              void this.updateSetting("pageSize", parsed);
            }
          });
      });
    pageSizeSetting.setDisabled(!this.plugin.settings.usePagination);

    // ===== PLUGIN SETTINGS =====
    new Setting(containerEl).setName("Behavior").setHeading();

    new Setting(containerEl)
      .setName("Use glass effect")
      .setDesc("Add a .use-glass class to the explorer root for styling.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.useGlass).onChange((value) => {
          void this.updateSetting("useGlass", value);
        });
      });

    new Setting(containerEl)
      .setName("Show unsupported files")
      .setDesc(
        "Show code files (.js, .ts, .py, etc). Off by default to reduce clutter.",
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.showUnsupportedFiles)
          .onChange((value) => {
            void this.updateSetting("showUnsupportedFiles", value);
          });
      });

    // ===== BLOCK DEFAULTS =====
    // ===== DEFAULT DISPLAY =====

    new Setting(containerEl)
      .setName("Default card footer")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("default", "Default")
          .addOption("folder", "Folder")
          .addOption("ctime", "Created")
          .addOption("mtime", "Modified")
          .addOption("desc", "Description")
          .addOption("none", "None")
          .setValue(this.plugin.settings.cardExt)
          .onChange((value) => {
            void this.updateSetting("cardExt", value as ExplorerSettings["cardExt"]);
          });
      });
    new Setting(containerEl).setName("Default display").setHeading();
    containerEl.createEl("p", {
      text: "Visibility defaults for new blocks.",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("Show folders")
      .setDesc("Show folder buttons when available.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showFolders).onChange((value) => {
          void this.updateSetting("showFolders", value);
        });
      });

    new Setting(containerEl)
      .setName("Show notes")
      .setDesc("Show note files in the listing.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showNotes).onChange((value) => {
          void this.updateSetting("showNotes", value);
        });
      });

    new Setting(containerEl)
      .setName("Only notes")
      .setDesc("Show only notes and PDF files.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.onlyNotes).onChange((value) => {
          void this.updateSetting("onlyNotes", value);
        });
      });

    // Breadcrumbs shelved — uncomment when ready to ship
    // new Setting(containerEl)
    //   .setName("Show breadcrumbs")
    //   .setDesc("Show folder path navigation.")
    //   .addToggle((toggle) => {
    //     toggle
    //       .setValue(this.plugin.settings.showBreadcrumbs)
    //       .onChange((value) => {
    //         this.updateSetting("showBreadcrumbs", value);
    //       });
    //   });

    // ===== PLUGIN NAVIGATION =====

    new Setting(containerEl)
      .setName("Show parent folder button")
      .setDesc("Show a button to navigate to the parent folder.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.showParentButton)
          .onChange((value) => {
            void this.updateSetting("showParentButton", value);
          });
      });

    // ===== RESET =====
    new Setting(containerEl).addButton((button) => {
      button.setButtonText("Reset all to defaults").onClick(async () => {
        this.plugin.settings = { ...DEFAULT_SETTINGS };
        await this.plugin.saveSettings();
        this.display();
      });
    });
  }

  private async updateSetting<K extends keyof ExplorerSettings>(
    key: K,
    value: ExplorerSettings[K],
  ) {
    this.plugin.settings[key] = value;
    await this.plugin.saveSettings();
  }
}
