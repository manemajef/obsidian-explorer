import { App, TFile } from "obsidian";
import { removeExt } from "../../utils/helpers";
import { createInternalLink } from "../../utils/link-utils";

export function renderFolderButtons(
	container: HTMLElement,
	folderNotes: TFile[],
	app: App,
	sourcePath: string
): void {
	const foldersContainer = container.createDiv({ cls: "explorer-folders-grid" });

	for (const folderNote of folderNotes) {
		const btn = foldersContainer.createEl("button", {
			cls: "explorer-folder-card",
		});

		btn.addEventListener("click", (e) => {
			// Only open if not clicking directly on the link (link handles itself)
			if (!(e.target as HTMLElement).closest("a")) {
				app.workspace.openLinkText(folderNote.path, sourcePath, false);
			}
		});

		createInternalLink(btn, folderNote.path, removeExt(folderNote), app, sourcePath);
	}
}
