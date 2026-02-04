import { Plugin } from "obsidian";
import { ExplorerSettings } from "./src/types";
import { DEFAULT_SETTINGS } from "./src/constants";
import { parseSettings } from "./src/backend/services/block-settings";
import { resolveEffectiveSettings } from "./src/backend/settings-resolver";
import { ExplorerBridge } from "./src/plugin/obsidian/explorer-bridge";
import { ExplorerSettingsTab } from "./src/ui/settings-tab";

export default class ExplorerPlugin extends Plugin {
	settings: ExplorerSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ExplorerSettingsTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("explorer", async (source, el, ctx) => {
			const blockSettings = parseSettings(source);
			const effectiveSettings = resolveEffectiveSettings(
				this.settings,
				blockSettings
			);
			const bridge = new ExplorerBridge(this.app, el, effectiveSettings, ctx);
			await bridge.render();
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
