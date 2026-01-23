import { App, MarkdownPostProcessorContext, TFile, TFolder, setIcon, Notice } from "obsidian";
import { ExplorerSettings, FileInfo } from "../types";
import { isRtl } from "../utils/helpers";
import { getFileInfo, isFolderNote } from "../utils/file-utils";
import { FolderIndex } from "../services/folder-index";
import { serializeSettings } from "../services/settings-parser";

import { ExplorerSettingsModal } from "./modals/settings-modal";
import { PromptModal } from "./modals/prompt-modal";
import { renderBreadcrumbs } from "./components/breadcrumbs";
import { renderFolderButtons } from "./components/folder-buttons";
import { renderPagination } from "./components/pagination";
import { renderSearchBar } from "./components/search-bar";
import { renderCardsView } from "./components/cards-view";
import { renderListView } from "./components/list-view";
import { renderTreeView } from "./components/tree-view";

export class ExplorerView {
	app: App;
	container: HTMLElement;
	settings: ExplorerSettings;
	ctx: MarkdownPostProcessorContext;
	sourcePath: string;

	private folderIndex: FolderIndex | null = null;
	private currentPage = 0;
	private searchQuery = "";
	private searchMode = false;
	private collapsedFolders: Set<string> = new Set();

	constructor(
		app: App,
		container: HTMLElement,
		settings: ExplorerSettings,
		ctx: MarkdownPostProcessorContext
	) {
		this.app = app;
		this.container = container;
		this.settings = settings;
		this.ctx = ctx;
		this.sourcePath = ctx.sourcePath;
	}

	async render(): Promise<void> {
		this.container.empty();
		this.container.addClass("explorer-container");

		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || !activeFile.parent) {
			this.container.createEl("p", { text: "No active file or folder" });
			return;
		}

		const folder = activeFile.parent;
		this.container.setAttribute("dir", isRtl() ? "rtl" : "ltr");

		this.folderIndex = new FolderIndex(this.app, folder);
		await this.folderIndex.loadToDepth(this.settings.depth);

		if (this.settings.showBreadcrumbs) {
			renderBreadcrumbs(this.container, folder, this.app, this.sourcePath);
		}

		this.renderFolderActions(folder);

		if (
			this.settings.showFolders &&
			this.settings.view !== "tree" &&
			this.folderIndex.folderNotes.length > 0
		) {
			renderFolderButtons(this.container, this.folderIndex.folderNotes, this.app, this.sourcePath);
		}

		this.renderNotesActions();

		if (this.settings.showNotes) {
			this.renderFiles();
		}
	}

	private renderFolderActions(folder: TFolder): void {
		const actionsDiv = this.container.createDiv({ cls: "folder-nav" });

		const leftDiv = actionsDiv.createDiv({
			cls: "explorer-actions-left",
			attr: { style: "display: flex; align-items: center; gap: 1em;" },
		});

		// Settings button
		const settingsBtn = leftDiv.createEl("button", { cls: "clickable-icon" });
		setIcon(settingsBtn, "settings");
		settingsBtn.addEventListener("click", () => this.openSettings());

		// Separator + action buttons
		const actionsWrap = leftDiv.createDiv({
			cls: "explorer-actions-wrap",
			attr: {
				style:
					"display: flex; gap: .5em; border-inline-start: 1px solid var(--background-modifier-border); padding-inline-start: 1em;",
			},
		});

		// New folder button
		const newFolderBtn = actionsWrap.createEl("button", { cls: "clickable-icon" });
		setIcon(newFolderBtn, "folder-plus");
		newFolderBtn.addEventListener("click", () => this.promptNewFolder(folder.path));

		// New note button
		const newNoteBtn = actionsWrap.createEl("button", { cls: "clickable-icon" });
		setIcon(newNoteBtn, "file-plus-2");
		newNoteBtn.addEventListener("click", () => this.createNewNote(folder.path));
	}

	private renderNotesActions(): void {
		const visibleCount = this.getRenderedChildrenCount();
		renderSearchBar(this.container, {
			searchMode: this.searchMode,
			searchQuery: this.searchQuery,
			allowSearch: this.settings.allowSearch,
			isTreeView: this.settings.view === "tree",
			childrenSize: visibleCount,
			autoCollapseTree: this.settings.autoCollapseTree,
			onSearchToggle: () => {
				this.searchMode = !this.searchMode;
				if (!this.searchMode) {
					this.searchQuery = "";
					this.currentPage = 0;
				}
				this.render();
			},
			onSearchInput: (query) => {
				this.searchQuery = query;
				this.currentPage = 0;
				this.renderFilesOnly();
			},
			onCollapseToggle: () => {
				this.settings.autoCollapseTree = !this.settings.autoCollapseTree;
				this.updateSourceBlock(this.settings);
				this.render();
			},
		});
	}

	private getRenderedChildrenCount(): number {
		if (!this.folderIndex) return 0;

		let files = this.folderIndex.getFilesToDisplay(this.settings);

		if (!this.settings.showFolders) {
			files = [...this.folderIndex.folderNotes, ...files];
		}

		files = this.filterFiles(files);
		files = this.sortFiles(files);

		return files.length;
	}

	private renderFilesOnly(): void {
		const existingFiles = this.container.querySelector(".explorer-files-container");
		if (existingFiles) existingFiles.remove();

		const filesContainer = this.container.createDiv({ cls: "explorer-files-container" });
		this.renderFilesInto(filesContainer);
	}

	private renderFiles(): void {
		const filesContainer = this.container.createDiv({ cls: "explorer-files-container" });
		this.renderFilesInto(filesContainer);
	}

	private renderFilesInto(container: HTMLElement): void {
		if (!this.folderIndex) return;

		let files = this.folderIndex.getFilesToDisplay(this.settings);

		if (!this.settings.showFolders) {
			files = [...this.folderIndex.folderNotes, ...files];
		}

		files = this.filterFiles(files);
		files = this.sortFiles(files);

		const fileInfos = files.map((f) => getFileInfo(this.app, f));

		// Sort pinned to top
		fileInfos.sort((a, b) => {
			if (a.isPinned && !b.isPinned) return -1;
			if (!a.isPinned && b.isPinned) return 1;
			if (a.isFav && !b.isFav) return -1;
			if (!a.isFav && b.isFav) return 1;
			return 0;
		});

		const usePaging = fileInfos.length > this.settings.pageSize && this.settings.view !== "tree";
		const totalPages = Math.ceil(fileInfos.length / this.settings.pageSize);
		const startIdx = this.currentPage * this.settings.pageSize;
		const pageFiles = usePaging
			? fileInfos.slice(startIdx, startIdx + this.settings.pageSize)
			: fileInfos;

		const extForCard =
			this.settings.cardExt !== "default"
				? this.settings.cardExt
				: this.settings.depth > 0
					? "folder"
					: "ctime";

		const useGrid = this.settings.view === "cards";
		const filesDiv = container.createDiv({
			cls: `explorer ${useGrid ? "explorer-notes-grid explorer-grid" : ""}`,
		});

		switch (this.settings.view) {
			case "cards":
				renderCardsView(filesDiv, pageFiles, extForCard, this.app, this.sourcePath);
				break;
			case "list":
				renderListView(filesDiv, pageFiles, this.app, this.sourcePath);
				break;
			case "tree":
				renderTreeView(
					filesDiv,
					fileInfos,
					this.folderIndex,
					this.settings,
					this.collapsedFolders,
					this.app,
					this.sourcePath
				);
				break;
		}

		if (usePaging) {
			container.createEl("br");
			renderPagination(container, this.currentPage, totalPages, this.app, (page) => {
				this.currentPage = page;
				this.renderFilesOnly();
			});
		}
	}

	private filterFiles(files: TFile[]): TFile[] {
		if (!this.searchQuery) return files;

		const query = this.searchQuery.toLowerCase();

		if (query.startsWith("#")) {
			const tag = query.slice(1);
			return files.filter((f) => {
				const info = getFileInfo(this.app, f);
				return info.tags?.some((t) => t.toLowerCase().includes(tag));
			});
		}

		if (query.startsWith("@")) {
			const searchTerm = query.slice(1);
			return files.filter((f) => {
				if (!isFolderNote(f)) return false;
				return f.basename.toLowerCase().includes(searchTerm);
			});
		}

		return files.filter(
			(f) => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query)
		);
	}

	private sortFiles(files: TFile[]): TFile[] {
		const sorted = [...files];

		switch (this.settings.sortBy) {
			case "newest":
				sorted.sort((a, b) => b.stat.ctime - a.stat.ctime);
				break;
			case "oldest":
				sorted.sort((a, b) => a.stat.ctime - b.stat.ctime);
				break;
			case "edited":
				sorted.sort((a, b) => b.stat.mtime - a.stat.mtime);
				break;
			case "name":
				sorted.sort((a, b) => a.name.localeCompare(b.name));
				break;
		}

		return sorted;
	}

	private openSettings(): void {
		new ExplorerSettingsModal(this.app, this.settings, async (newSettings) => {
			this.settings = newSettings;
			await this.updateSourceBlock(newSettings);
			await this.render();
		}).open();
	}

	private async updateSourceBlock(settings: ExplorerSettings): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(this.sourcePath);
		if (!(file instanceof TFile)) return;

		const sectionInfo = this.ctx.getSectionInfo(this.container);
		if (!sectionInfo) {
			// Fallback: try regex approach
			const content = await this.app.vault.read(file);
			const newSource = serializeSettings(settings);
			const regex = /```explorer\n[\s\S]*?```/;
			const replacement = newSource ? `\`\`\`explorer\n${newSource}\n\`\`\`` : "```explorer\n```";
			const newContent = content.replace(regex, replacement);
			if (newContent !== content) {
				await this.app.vault.modify(file, newContent);
			}
			return;
		}

		const content = await this.app.vault.read(file);
		const lines = content.split("\n");
		const { lineStart, lineEnd } = sectionInfo;

		const newSource = serializeSettings(settings);
		const newBlock = newSource ? `\`\`\`explorer\n${newSource}\n\`\`\`` : "```explorer\n```";

		const newLines = [...lines.slice(0, lineStart), newBlock, ...lines.slice(lineEnd + 1)];

		const newContent = newLines.join("\n");
		if (newContent !== content) {
			await this.app.vault.modify(file, newContent);
		}
	}

	private async promptNewFolder(basePath: string): Promise<void> {
		const name = await this.promptForName("New Folder", "Enter folder name");
		if (!name) return;

		const folderPath = `${basePath}/${name}`;
		const folderNotePath = `${folderPath}/${name}.md`;

		try {
			await this.app.vault.createFolder(folderPath);
			await this.app.vault.create(folderNotePath, "");
			const file = this.app.vault.getAbstractFileByPath(folderNotePath);
			if (file instanceof TFile) {
				await this.app.workspace.getLeaf().openFile(file);
			}
		} catch (e) {
			new Notice(`Failed to create folder: ${e}`);
		}
	}

	private async createNewNote(basePath: string): Promise<void> {
		const name = await this.promptForName("New Note", "Enter note name");
		if (!name) return;

		const notePath = `${basePath}/${name}.md`;

		try {
			await this.app.vault.create(notePath, "");
			const file = this.app.vault.getAbstractFileByPath(notePath);
			if (file instanceof TFile) {
				await this.app.workspace.getLeaf().openFile(file);
			}
		} catch (e) {
			new Notice(`Failed to create note: ${e}`);
		}
	}

	private promptForName(title: string, placeholder: string): Promise<string | null> {
		return new Promise((resolve) => {
			new PromptModal(this.app, title, placeholder, resolve).open();
		});
	}
}
