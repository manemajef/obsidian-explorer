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

		containerEl.createEl("h2", { text: "Explorer defaults" });

		new Setting(containerEl)
			.setName("Default view")
			.setDesc("Applies when a code block does not override view.")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("list", "List")
					.addOption("cards", "Cards")
					.setValue(this.plugin.settings.view)
					.onChange(async (value) => {
						this.updateSetting("view", value as ExplorerSettings["view"]);
					});
			});

		new Setting(containerEl)
			.setName("Default sort")
			.setDesc("Sort order for notes.")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("oldest", "Oldest")
					.addOption("newest", "Newest")
					.addOption("edited", "Last edited")
					.addOption("name", "Name")
					.setValue(this.plugin.settings.sortBy)
					.onChange(async (value) => {
						this.updateSetting("sortBy", value as ExplorerSettings["sortBy"]);
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
					.onChange(async (value) => {
						this.updateSetting("depth", value);
					});
			});

		new Setting(containerEl)
			.setName("Default page size")
			.setDesc("Items per page when pagination is enabled.")
			.addText((text) => {
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.pageSize))
					.setValue(String(this.plugin.settings.pageSize))
					.onChange(async (value) => {
						const parsed = Number.parseInt(value, 10);
						if (!Number.isNaN(parsed) && parsed > 0) {
							this.updateSetting("pageSize", parsed);
						}
					});
			});

		new Setting(containerEl)
			.setName("Default card footer")
			.setDesc("What shows at the bottom of a card.")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("default", "Default")
					.addOption("folder", "Folder")
					.addOption("ctime", "Created")
					.addOption("mtime", "Modified")
					.addOption("desc", "Description")
					.addOption("none", "None")
					.setValue(this.plugin.settings.cardExt)
					.onChange(async (value) => {
						this.updateSetting("cardExt", value as ExplorerSettings["cardExt"]);
					});
			});

		new Setting(containerEl)
			.setName("Show folders")
			.setDesc("Show folder buttons when available.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showFolders).onChange((value) => {
					this.updateSetting("showFolders", value);
				});
			});

		new Setting(containerEl)
			.setName("Show notes")
			.setDesc("Show note files.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showNotes).onChange((value) => {
					this.updateSetting("showNotes", value);
				});
			});

		new Setting(containerEl)
			.setName("Only notes")
			.setDesc("Show only .md and .pdf files.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.onlyNotes).onChange((value) => {
					this.updateSetting("onlyNotes", value);
				});
			});

		new Setting(containerEl)
			.setName("Show unsupported files")
			.setDesc("Show code files (.js, .ts, .py, etc). Off by default to hide clutter.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showUnsupportedFiles).onChange((value) => {
					this.updateSetting("showUnsupportedFiles", value);
				});
			});

		new Setting(containerEl)
			.setName("Show breadcrumbs")
			.setDesc("Show navigation breadcrumbs.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showBreadcrumbs).onChange((value) => {
					this.updateSetting("showBreadcrumbs", value);
				});
			});

		new Setting(containerEl)
			.setName("Use glass")
			.setDesc("Add a .use-glass class to the explorer root.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.useGlass).onChange((value) => {
					this.updateSetting("useGlass", value);
				});
			});

		new Setting(containerEl).addButton((button) => {
			button.setButtonText("Reset defaults").onClick(async () => {
				this.plugin.settings = { ...DEFAULT_SETTINGS };
				await this.plugin.saveSettings();
				this.display();
			});
		});
	}

	private async updateSetting<K extends keyof ExplorerSettings>(key: K, value: ExplorerSettings[K]) {
		this.plugin.settings[key] = value;
		await this.plugin.saveSettings();
	}
}
