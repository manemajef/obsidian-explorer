import { App, TFolder, setIcon } from "obsidian";
import { isRtl } from "../../utils/helpers";
import { getFolderNoteForFolder } from "../../utils/file-utils";
import { createInternalLink } from "../../utils/link-utils";

export function renderBreadcrumbs(
	container: HTMLElement,
	folder: TFolder,
	app: App,
	sourcePath: string
): void {
	const breadcrumbsDiv = container.createDiv({ cls: "explorer-breadcrumbs" });

	const parts: { name: string; path: string }[] = [];
	let current: TFolder | null = folder;

	while (current && current.path !== "/") {
		parts.unshift({ name: current.name, path: current.path });
		current = current.parent;
	}

	// Home link
	const homeLink = breadcrumbsDiv.createEl("a", {
		cls: "explorer-breadcrumb-home internal-link",
		attr: {
			"data-href": "Home.md",
			href: "Home.md",
		},
	});
	setIcon(homeLink, "home");
	homeLink.addEventListener("click", (e) => {
		e.preventDefault();
		app.workspace.openLinkText("Home.md", sourcePath, false);
	});

	// Path parts
	for (const part of parts) {
		const separator = breadcrumbsDiv.createSpan({ cls: "explorer-breadcrumb-sep" });
		setIcon(separator, isRtl(part.name) ? "chevron-left" : "chevron-right");

		const folderObj = app.vault.getAbstractFileByPath(part.path);
		if (folderObj instanceof TFolder) {
			const folderNote = getFolderNoteForFolder(app, folderObj);
			if (folderNote) {
				createInternalLink(
					breadcrumbsDiv,
					folderNote.path,
					part.name,
					app,
					sourcePath,
					["explorer-breadcrumb-link"]
				);
			} else {
				breadcrumbsDiv.createSpan({
					cls: "explorer-breadcrumb-link",
					text: part.name,
				});
			}
		}
	}
}
