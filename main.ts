import { Plugin } from "obsidian";
import { ExplorerSettings } from "./src/types";
import { DEFAULT_SETTINGS } from "./src/constants";
import { parseSettings } from "./src/services/settings-parser";
import { ExplorerView } from "./src/ui/explorer-view";

export default class ExplorerPlugin extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor("explorer", async (source, el, ctx) => {
			const parsedSettings = parseSettings(source);
			const settings: ExplorerSettings = { ...DEFAULT_SETTINGS, ...parsedSettings };

			const view = new ExplorerView(this.app, el, settings, ctx);
			await view.render();
		});
	}

	onunload() {}
}
