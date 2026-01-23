import { App, TFolder, setIcon } from "obsidian";
import { ExplorerSettings, FileInfo, FolderInfo } from "../../types";
import { isRtl } from "../../utils/helpers";
import { getFolderNoteForFolder } from "../../utils/file-utils";
import { createInternalLink } from "../../utils/link-utils";
import { FolderIndex } from "../../services/folder-index";

export function renderTreeView(
	container: HTMLElement,
	files: FileInfo[],
	folderIndex: FolderIndex,
	settings: ExplorerSettings,
	collapsedFolders: Set<string>,
	app: App,
	sourcePath: string
): void {
	const tree = container.createEl("ul", { cls: "explorer-ul" });

	// Group files by folder
	const filesByFolder = new Map<string, FileInfo[]>();

	// Add root level files
	const rootFiles = files.filter((f) => f.file.parent === folderIndex.folder);
	if (rootFiles.length > 0) {
		filesByFolder.set("", rootFiles);
	}

	// Group nested files by their parent folder
	for (const fileInfo of files) {
		if (fileInfo.file.parent !== folderIndex.folder) {
			const folderPath = fileInfo.file.parent?.path || "";
			const relativePath = folderPath.replace(folderIndex.folder.path + "/", "");

			if (!filesByFolder.has(relativePath)) {
				filesByFolder.set(relativePath, []);
			}
			filesByFolder.get(relativePath)!.push(fileInfo);
		}
	}

	// Render root files first
	const rootFilesList = filesByFolder.get("");
	if (rootFilesList) {
		for (const fileInfo of rootFilesList) {
			renderTreeItem(tree, fileInfo, app, sourcePath);
		}
	}

	// Render subfolders
	for (const folderInfo of folderIndex.folders) {
		renderTreeFolder(
			tree,
			folderInfo,
			filesByFolder,
			"",
			settings,
			collapsedFolders,
			app,
			sourcePath
		);
	}
}

function renderTreeFolder(
	container: HTMLElement,
	folderInfo: FolderInfo,
	filesByFolder: Map<string, FileInfo[]>,
	parentPath: string,
	settings: ExplorerSettings,
	collapsedFolders: Set<string>,
	app: App,
	sourcePath: string
): void {
	const folderPath = parentPath
		? `${parentPath}/${folderInfo.folder.name}`
		: folderInfo.folder.name;

	const isCollapsed = settings.autoCollapseTree
		? !collapsedFolders.has(folderPath)
		: collapsedFolders.has(folderPath);

	const li = container.createEl("li", {
		cls: `explorer-nested-li ${isCollapsed ? "explorer-li-collapsed" : ""}`,
	});

	const itemDiv = li.createDiv({ cls: "explorer-li-item" });
	const iconsDiv = itemDiv.createDiv({ cls: "explorer-li-icons" });

	// Collapse icon
	const collapseSpan = iconsDiv.createSpan({ cls: "explorer-li-collapse" });
	const collapseIcon = collapseSpan.createSpan({
		cls: isCollapsed ? "explorer-li-collapse-icon-close" : "explorer-li-collapse-icon-open",
	});
	setIcon(
		collapseIcon,
		isRtl()
			? isCollapsed
				? "chevron-left"
				: "chevron-down"
			: isCollapsed
				? "chevron-right"
				: "chevron-down"
	);

	// Bullet
	iconsDiv.createSpan({ cls: "explorer-li-bullet" });

	// Folder name link
	if (folderInfo.folderNote) {
		createInternalLink(
			itemDiv,
			folderInfo.folderNote.path,
			folderInfo.folder.name,
			app,
			sourcePath,
			["tree-folder-link"]
		);
	} else {
		itemDiv.createSpan({ text: folderInfo.folder.name, cls: "tree-folder-name" });
	}

	// Content container
	const contentUl = li.createEl("ul", {
		cls: `explorer-ul ${isCollapsed ? "is-collapsed" : ""}`,
	});

	// Toggle collapse on click (not on link)
	itemDiv.addEventListener("click", (e) => {
		if ((e.target as HTMLElement).closest("a")) return;

		if (collapsedFolders.has(folderPath)) {
			collapsedFolders.delete(folderPath);
		} else {
			collapsedFolders.add(folderPath);
		}

		const newCollapsed = settings.autoCollapseTree
			? !collapsedFolders.has(folderPath)
			: collapsedFolders.has(folderPath);

		li.toggleClass("explorer-li-collapsed", newCollapsed);
		contentUl.toggleClass("is-collapsed", newCollapsed);
		setIcon(
			collapseIcon,
			isRtl()
				? newCollapsed
					? "chevron-left"
					: "chevron-down"
				: newCollapsed
					? "chevron-right"
					: "chevron-down"
		);
		collapseIcon.className = newCollapsed
			? "explorer-li-collapse-icon-close"
			: "explorer-li-collapse-icon-open";
	});

	// Render files in this folder
	const folderFiles = filesByFolder.get(folderPath);
	if (folderFiles) {
		for (const fileInfo of folderFiles) {
			renderTreeItem(contentUl, fileInfo, app, sourcePath);
		}
	}

	// Render subfolders
	for (const child of folderInfo.folder.children) {
		if (child instanceof TFolder) {
			const subFolderInfo: FolderInfo = {
				folder: child,
				folderNote: getFolderNoteForFolder(app, child),
			};
			renderTreeFolder(
				contentUl,
				subFolderInfo,
				filesByFolder,
				folderPath,
				settings,
				collapsedFolders,
				app,
				sourcePath
			);
		}
	}
}

function renderTreeItem(
	container: HTMLElement,
	fileInfo: FileInfo,
	app: App,
	sourcePath: string
): void {
	const li = container.createEl("li", { cls: "explorer-li" });
	const itemDiv = li.createDiv({ cls: "explorer-li-item" });

	// Icons
	const iconsDiv = itemDiv.createDiv({ cls: "explorer-li-icons" });
	iconsDiv.createSpan({ cls: "explorer-li-bullet" });

	// Link
	const additionalClasses = fileInfo.isPinned || fileInfo.isFav ? ["is-pinned"] : [];
	createInternalLink(
		itemDiv,
		fileInfo.file.path,
		fileInfo.file.basename,
		app,
		sourcePath,
		additionalClasses
	);

	if (fileInfo.file.extension !== "md") {
		itemDiv.createSpan({
			cls: "ext-tag",
			text: ` .${fileInfo.file.extension}`,
		});
	}
}
