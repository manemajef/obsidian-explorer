import { App, Keymap, Plugin, TFolder } from "obsidian";
import { getFolderNoteForFolder, isFolderNote } from "../lib/folder-note";
import type { PluginSettings } from "../settings";
import { openVirtualFolderNote } from "../navigation/virtual-folder-note";

type FileExplorerFolderNoteBehaviorOptions = {
  app: App;
  getSettings: () => PluginSettings;
};

type FileExplorerItem = {
  selfEl?: HTMLElement;
  titleEl?: HTMLElement;
};

type FileExplorerView = {
  fileItems?: Record<string, FileExplorerItem | undefined>;
};

type FileExplorerLeafView = {
  view?: FileExplorerView;
};

const HIDE_BODY_CLASS = "explorer-hide-folder-notes";
const FOLDER_NOTE_ITEM_CLASS = "explorer-native-folder-note";

export function registerFileExplorerFolderNoteBehavior(
  plugin: Plugin,
  options: FileExplorerFolderNoteBehaviorOptions,
): () => void {
  const { app, getSettings } = options;
  const doc = app.workspace.containerEl.ownerDocument;
  let observer: MutationObserver | null = null;

  const refresh = (): void => {
    const shouldHide = getSettings().hideFolderNotesInFileExplorer;
    doc.body.classList.toggle(HIDE_BODY_CLASS, shouldHide);
    markAllNativeFolderNoteItems(app, doc);
  };

  const register = (): void => {
    observer = new MutationObserver((mutations) => {
      let sawAddedNode = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) sawAddedNode = true;
      }
      if (sawAddedNode) markAllNativeFolderNoteItems(app, doc);
    });
    observer.observe(app.workspace.containerEl, {
      childList: true,
      subtree: true,
    });

    plugin.registerDomEvent(
      doc,
      "click",
      (evt) => {
        void handleFileExplorerFolderClick(app, getSettings(), evt);
      },
      true,
    );
    plugin.registerDomEvent(
      doc,
      "auxclick",
      (evt) => {
        if (evt.button !== 2) {
          void handleFileExplorerFolderClick(app, getSettings(), evt);
        }
      },
      true,
    );

    refresh();
  };

  if (app.workspace.layoutReady) {
    register();
  } else {
    app.workspace.onLayoutReady(register);
  }

  plugin.register(() => {
    observer?.disconnect();
    doc.body.classList.remove(HIDE_BODY_CLASS);
    clearNativeFolderNoteMarks(doc);
  });

  return refresh;
}

function markAllNativeFolderNoteItems(app: App, doc: Document): void {
  const current = new Set<HTMLElement>();

  for (const file of app.vault.getMarkdownFiles()) {
    if (!isFolderNote(file)) continue;
    for (const item of markNativeFolderNotePath(app, doc, file.path)) {
      current.add(item);
    }
  }

  for (const item of Array.from(
    doc.querySelectorAll(`.${FOLDER_NOTE_ITEM_CLASS}`),
  )) {
    if (item instanceof HTMLElement && !current.has(item)) {
      item.classList.remove(FOLDER_NOTE_ITEM_CLASS);
    }
  }

  for (const item of current) {
    item.classList.add(FOLDER_NOTE_ITEM_CLASS);
  }
}

function markNativeFolderNotePath(
  app: App,
  doc: Document,
  path: string,
): HTMLElement[] {
  const marked = new Set<HTMLElement>();
  const fileExplorerItem = getFileExplorerItem(app, path);
  const itemEl = fileExplorerItem?.selfEl ?? fileExplorerItem?.titleEl;

  if (itemEl) {
    marked.add(getFileExplorerItemElement(itemEl));
  }

  for (const title of Array.from(
    doc.querySelectorAll(`[data-path="${CSS.escape(path)}"]`),
  )) {
    if (title instanceof HTMLElement) {
      marked.add(getFileExplorerItemElement(title));
    }
  }

  for (const item of marked) {
    item.classList.add(FOLDER_NOTE_ITEM_CLASS);
  }
  return Array.from(marked);
}

function getFileExplorerItemElement(el: HTMLElement): HTMLElement {
  const item = el.closest(".nav-file");
  return item instanceof HTMLElement ? item : el;
}

function getFileExplorerItem(app: App, path: string): FileExplorerItem | null {
  for (const leaf of app.workspace.getLeavesOfType("file-explorer")) {
    const view = (leaf as unknown as FileExplorerLeafView).view;
    const item = view?.fileItems?.[path];
    if (item) return item;
  }
  return null;
}

function clearNativeFolderNoteMarks(doc: Document): void {
  for (const item of Array.from(
    doc.querySelectorAll(`.${FOLDER_NOTE_ITEM_CLASS}`),
  )) {
    item.classList.remove(FOLDER_NOTE_ITEM_CLASS);
  }
}

async function handleFileExplorerFolderClick(
  app: App,
  settings: PluginSettings,
  evt: MouseEvent,
): Promise<void> {
  if (evt.defaultPrevented || !settings.hideFolderNotesInFileExplorer) return;
  if (settings.sidebarFolderClickBehavior === "nothing") return;

  const folder = getClickedFolder(app, evt);
  if (!folder || folder.isRoot()) return;

  const folderNote = getFolderNoteForFolder(app, folder);
  const shouldOpenVirtual =
    !folderNote && settings.sidebarFolderClickBehavior === "virtual";

  if (!folderNote && !shouldOpenVirtual) return;

  evt.preventDefault();
  evt.stopImmediatePropagation();

  const newLeaf = evt.button === 1 || Boolean(Keymap.isModEvent(evt));
  if (folderNote) {
    await app.workspace.openLinkText(folderNote.path, "", newLeaf);
    return;
  }

  await openVirtualFolderNote(app, folder, newLeaf);
}

function getClickedFolder(app: App, evt: MouseEvent): TFolder | null {
  const target = evt.target;
  if (!(target instanceof HTMLElement)) return null;

  const titleContent = target.closest(".nav-folder-title-content");
  if (!(titleContent instanceof HTMLElement)) return null;

  const title = titleContent.closest(".nav-folder-title");
  if (!(title instanceof HTMLElement)) return null;

  const path = title.getAttribute("data-path");
  const folder = path ? app.vault.getAbstractFileByPath(path) : null;
  return folder instanceof TFolder ? folder : null;
}
