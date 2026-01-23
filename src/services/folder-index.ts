import { App, TFile, TFolder } from "obsidian";
import { ExplorerSettings, FolderInfo } from "../types";
import { EXCLUDED_EXTENSIONS } from "../constants";
import { isFolderNote, getFolderNoteForFolder } from "../utils/file-utils";

/**
 * Indexes folder contents with support for nested loading
 */
export class FolderIndex {
	app: App;
	folder: TFolder;
	folderNote: TFile | null;
	files: TFile[] = [];
	folders: FolderInfo[] = [];
	folderNotes: TFile[] = [];
	nestedFiles: TFile[] = [];
	childrenSize: number = 0;

	constructor(app: App, folder: TFolder) {
		this.app = app;
		this.folder = folder;
		this.folderNote = getFolderNoteForFolder(app, folder);
	}

	/**
	 * Load immediate children of the folder
	 */
	loadImmediate(): void {
		this.files = [];
		this.folders = [];
		this.folderNotes = [];

		for (const child of this.folder.children) {
			if (child instanceof TFile) {
				if (this.shouldIncludeFile(child)) {
					this.files.push(child);
				}
			} else if (child instanceof TFolder) {
				const folderNote = getFolderNoteForFolder(this.app, child);
				this.folders.push({ folder: child, folderNote });
				if (folderNote) {
					this.folderNotes.push(folderNote);
				}
			}
		}

		this.nestedFiles = [...this.files];
		this.childrenSize = this.files.length + this.folders.length;
	}

	/**
	 * Load folder contents to a specific depth
	 */
	async loadToDepth(depth: number): Promise<void> {
		this.loadImmediate();
		if (depth > 0) {
			await this.loadNestedAsync(depth - 1);
		}
	}

	/**
	 * Recursively load nested folders
	 */
	private async loadNestedAsync(remainingDepth: number): Promise<void> {
		if (remainingDepth < 0) return;

		const promises = this.folders.map(async (folderInfo) => {
			const subIndex = new FolderIndex(this.app, folderInfo.folder);
			subIndex.loadImmediate();

			for (const file of subIndex.files) {
				this.nestedFiles.push(file);
			}

			for (const fn of subIndex.folderNotes) {
				this.nestedFiles.push(fn);
			}

			if (remainingDepth > 0) {
				for (const subFolderInfo of subIndex.folders) {
					const deepIndex = new FolderIndex(this.app, subFolderInfo.folder);
					await deepIndex.loadToDepth(remainingDepth);
					this.nestedFiles.push(...deepIndex.nestedFiles);
				}
			}
		});

		await Promise.all(promises);
	}

	/**
	 * Reset and reload to specific depth
	 */
	async resetDepth(depth: number): Promise<void> {
		this.nestedFiles = [];
		await this.loadToDepth(depth);
	}

	/**
	 * Check if a file should be included in the listing
	 */
	private shouldIncludeFile(file: TFile): boolean {
		if (isFolderNote(file)) return false;
		const ext = file.extension.toLowerCase();
		if (EXCLUDED_EXTENSIONS.includes(ext)) return false;
		return true;
	}

	/**
	 * Get files to display based on current settings
	 */
	getFilesToDisplay(settings: ExplorerSettings): TFile[] {
		let files = settings.depth > 0 ? this.nestedFiles : this.files;

		if (settings.onlyNotes) {
			files = files.filter((f) => f.extension === "md" || f.extension === "pdf");
		}

		return files;
	}
}
