import { App, Modal, Setting } from "obsidian";
import { ExplorerSettings } from "../../types";

// Per-block settings UI (applies to a single explorer code block).
export class ExplorerSettingsModal extends Modal {
	settings: ExplorerSettings;
	onSettingsChange: (settings: ExplorerSettings) => void;

	constructor(
		app: App,
		settings: ExplorerSettings,
		onSettingsChange: (settings: ExplorerSettings) => void
	) {
		super(app);
		this.settings = { ...settings };
		this.onSettingsChange = onSettingsChange;
	}

	private updateSetting<K extends keyof ExplorerSettings>(
		key: K,
		value: ExplorerSettings[K]
	): void {
		this.settings[key] = value;
		this.onSettingsChange(this.settings);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("explorer-settings-modal");

		new Setting(contentEl).setName("Explorer settings").setHeading();

		new Setting(contentEl)
			.setName("View")
			.setDesc("How to display files")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("cards", "Cards")
					.addOption("list", "List")
					.setValue(this.settings.view)
					.onChange((value) => {
						this.updateSetting("view", value as ExplorerSettings["view"]);
					});
			});

		new Setting(contentEl)
			.setName("Sort by")
			.setDesc("How to sort files")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("newest", "Newest first")
					.addOption("oldest", "Oldest first")
					.addOption("edited", "Recently edited")
					.addOption("name", "Name")
					.setValue(this.settings.sortBy)
					.onChange((value) => {
						this.updateSetting("sortBy", value as ExplorerSettings["sortBy"]);
					});
			});

		new Setting(contentEl)
			.setName("Subfolder depth")
			.setDesc("How many levels of subfolders to include (0 = direct children only)")
			.addSlider((slider) => {
				slider
					.setLimits(0, 10, 1)
					.setValue(this.settings.depth)
					.setDynamicTooltip()
					.onChange((value) => {
						this.updateSetting("depth", value);
					});
			});

		let pageSizeSetting: Setting | null = null;

		new Setting(contentEl)
			.setName("Enable pagination")
			.setDesc("Turn off to show all files in a single list.")
			.addToggle((toggle) => {
				toggle.setValue(this.settings.usePagination).onChange((value) => {
					this.updateSetting("usePagination", value);
					pageSizeSetting?.setDisabled(!value);
				});
			});

		pageSizeSetting = new Setting(contentEl)
			.setName("Page size")
			.setDesc("Number of items per page")
			.addSlider((slider) => {
				slider
					.setLimits(6, 48, 3)
					.setValue(this.settings.pageSize)
					.setDynamicTooltip()
					.onChange((value) => {
						this.updateSetting("pageSize", value);
					});
			});
		pageSizeSetting.setDisabled(!this.settings.usePagination);

		new Setting(contentEl)
			.setName("Card info")
			.setDesc("What to show on card footer")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("default", "Default (auto)")
					.addOption("ctime", "Creation date")
					.addOption("mtime", "Modified date")
					.addOption("folder", "Folder link")
					.addOption("desc", "Description")
					.addOption("none", "None")
					.setValue(this.settings.cardExt)
					.onChange((value) => {
						this.updateSetting("cardExt", value as ExplorerSettings["cardExt"]);
					});
			});

		new Setting(contentEl)
			.setName("Show folders")
			.setDesc("Show folder buttons")
			.addToggle((toggle) => {
				toggle.setValue(this.settings.showFolders).onChange((value) => {
					this.updateSetting("showFolders", value);
				});
			});

		new Setting(contentEl)
			.setName("Show notes")
			.setDesc("Show note files")
			.addToggle((toggle) => {
				toggle.setValue(this.settings.showNotes).onChange((value) => {
					this.updateSetting("showNotes", value);
				});
			});

		new Setting(contentEl)
			.setName("Only notes")
			.setDesc("Show only notes and PDF files")
			.addToggle((toggle) => {
				toggle.setValue(this.settings.onlyNotes).onChange((value) => {
					this.updateSetting("onlyNotes", value);
				});
			});

		// Breadcrumbs shelved — uncomment when ready to ship
		// new Setting(contentEl)
		// 	.setName("Show breadcrumbs")
		// 	.setDesc("Show navigation breadcrumbs")
		// 	.addToggle((toggle) => {
		// 		toggle.setValue(this.settings.showBreadcrumbs).onChange((value) => {
		// 			this.updateSetting("showBreadcrumbs", value);
		// 		});
		// 	});

		new Setting(contentEl).addButton((button) => {
			button
				.setButtonText("Close")
				.setCta()
				.onClick(() => this.close());
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}
