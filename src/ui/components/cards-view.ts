import { App, TFile, setIcon } from "obsidian";
import { FileInfo } from "../../types";
import { diffDays } from "../../utils/helpers";
import { isFolderNote } from "../../utils/file-utils";
import { createInternalLink } from "../../utils/link-utils";

export function renderCardsView(
	container: HTMLElement,
	files: FileInfo[],
	extForCard: string,
	app: App,
	sourcePath: string
): void {
	for (const fileInfo of files) {
		const cardWrapper = container.createDiv();
		const card = cardWrapper.createDiv({ cls: "explorer-card" });

		// Header
		const header = card.createDiv({ cls: "explorer-card-header" });

		// Link
		const linkSpan = header.createSpan({ cls: "explorer-card-link" });
		createInternalLink(linkSpan, fileInfo.file.path, fileInfo.file.basename, app, sourcePath);

		// Exts (pin/fav icon + file extension)
		const extsSpan = header.createSpan({ cls: "explorer-card-exts" });

		if (fileInfo.isPinned || fileInfo.isFav) {
			const propTag = extsSpan.createSpan({ cls: "prop-tag" });
			setIcon(propTag, fileInfo.isFav ? "heart" : "pin");
		}

		if (fileInfo.file.extension !== "md" && !isFolderNote(fileInfo.file)) {
			extsSpan.createEl("span", {
				cls: "ext-tag",
				text: fileInfo.file.extension,
			});
		}

		// Footer
		const footer = card.createDiv({ cls: "explorer-card-footer" });
		renderCardFooter(footer, fileInfo, extForCard, app, sourcePath);

		// Click handler (only if not clicking on a link)
		card.addEventListener("click", (e) => {
			if ((e.target as HTMLElement).closest("a")) return;
			app.workspace.openLinkText(fileInfo.file.path, sourcePath, false);
		});
	}
}

function renderCardFooter(
	footer: HTMLElement,
	fileInfo: FileInfo,
	extForCard: string,
	app: App,
	sourcePath: string
): void {
	switch (extForCard) {
		case "ctime":
			footer.createSpan({ text: diffDays(fileInfo.file.stat.ctime) });
			break;
		case "mtime":
			footer.createSpan({ text: diffDays(fileInfo.file.stat.mtime) });
			break;
		case "folder":
			const folder = isFolderNote(fileInfo.file)
				? fileInfo.file.parent?.parent
				: fileInfo.file.parent;
			if (folder) {
				const folderNotePath = `${folder.path}/${folder.name}.md`;
				const folderNote = app.vault.getAbstractFileByPath(folderNotePath);
				if (folderNote instanceof TFile) {
					const link = createInternalLink(footer, folderNotePath, folder.name, app, sourcePath);
					link.addEventListener("click", (e) => e.stopPropagation());
				} else {
					footer.createSpan({ text: folder.name });
				}
			}
			break;
		case "desc":
			if (fileInfo.description) {
				footer.createSpan({
					text:
						fileInfo.description.slice(0, 60) +
						(fileInfo.description.length > 60 ? "..." : ""),
				});
			}
			break;
		case "none":
			break;
	}
}
