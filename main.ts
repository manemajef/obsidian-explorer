import { Plugin } from "obsidian";
import { ExplorerSettings } from "./src/types";
import { DEFAULT_SETTINGS } from "./src/constants";
import { parseSettings } from "./src/services/settings-parser";
import { ExplorerView } from "./src/ui/explorer-view";
import { ExplorerSettingsTab } from "./src/ui/settings-tab";

export default class ExplorerPlugin extends Plugin {
	settings: ExplorerSettings;
	createdFolderNotes: string[] = [];

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ExplorerSettingsTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("explorer", async (source, el, ctx) => {
			const parsedSettings = parseSettings(source);
			const settings: ExplorerSettings = { ...this.settings, ...parsedSettings };

			const view = new ExplorerView(this.app, el, settings, ctx);
			await view.render();
		});
	}

	onunload() {}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as
			| Partial<{ settings: ExplorerSettings; createdFolderNotes: string[] }>
			| ExplorerSettings
			| null;

		if (data && "settings" in data) {
			this.settings = { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) };
			this.createdFolderNotes = Array.isArray(data.createdFolderNotes)
				? data.createdFolderNotes
				: [];
			return;
		}

		this.settings = { ...DEFAULT_SETTINGS, ...(data ?? {}) };
	}

	async saveSettings(): Promise<void> {
		await this.saveData({
			settings: this.settings,
			createdFolderNotes: this.createdFolderNotes,
		});
	}

	async trackCreatedFolderNote(path: string): Promise<void> {
		if (this.createdFolderNotes.includes(path)) return;
		this.createdFolderNotes.push(path);
		await this.saveSettings();
	}
}
