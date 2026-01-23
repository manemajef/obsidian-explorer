import { App } from "obsidian";
import { FileInfo } from "../../types";
import { createInternalLink } from "../../utils/link-utils";

export function renderListView(
	container: HTMLElement,
	files: FileInfo[],
	app: App,
	sourcePath: string
): void {
	for (const fileInfo of files) {
		const li = container.createEl("li", { cls: "explorer-list" });

		if (fileInfo.isPinned || fileInfo.isFav) {
			li.addClass("pinned");
		}

		createInternalLink(li, fileInfo.file.path, fileInfo.file.basename, app, sourcePath);

		if (fileInfo.file.extension !== "md") {
			li.createSpan({
				cls: "ext-tag",
				text: ` .${fileInfo.file.extension}`,
			});
		}
	}
}
