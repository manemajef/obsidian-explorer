import { Plugin } from "obsidian";
import { ExplorerSettings } from "./src/types";
import { DEFAULT_SETTINGS } from "./src/constants";
import { parseSettings } from "./src/services/settings-parser";
import { ExplorerView } from "./src/ui/explorer-view";
import { ExplorerSettingsTab } from "./src/ui/settings-tab";

export default class ExplorerPlugin extends Plugin {
	settings: ExplorerSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ExplorerSettingsTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("explorer", async (source, el, ctx) => {
			const pluginSettings = this.settings;
			const blockSettings = parseSettings(source);
			const effectiveSettings: ExplorerSettings = {
				...pluginSettings,
				...blockSettings,
			};

			// Per-block settings override plugin defaults for this render.
			const view = new ExplorerView(this.app, el, effectiveSettings, ctx);
			await view.render();
		});
	}

	onunload() {}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as Partial<ExplorerSettings> | null;
		this.settings = { ...DEFAULT_SETTINGS, ...(data ?? {}) };
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
