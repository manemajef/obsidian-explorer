import { App, MarkdownView, Plugin } from "obsidian";
import { isFolderNote } from "../lib/folder-note";

const HAS_BLOCK = "explorer-has-block";
const BLOCK_IS_LAST = "explorer-block-is-last";
const IS_FOLDERNOTE = "explorer-is-foldernote";

export function registerWorkspaceDecorations(plugin: Plugin, app: App): void {
  let framePending = false;
  const refresh = (): void => {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(() => {
      framePending = false;
      applyDecorations(app);
    });
  };

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        refresh();
        return;
      }
    }
  });

  const register = (): void => {
    observer.observe(app.workspace.containerEl, {
      childList: true,
      subtree: true,
    });
    plugin.registerEvent(app.workspace.on("active-leaf-change", refresh));
    refresh();
  };

  if (app.workspace.layoutReady) {
    register();
  } else {
    app.workspace.onLayoutReady(register);
  }

  plugin.register(() => {
    observer.disconnect();
    clearDecorations(app);
  });
}

function applyDecorations(app: App): void {
  for (const leaf of app.workspace.getLeavesOfType("markdown")) {
    // .workspace-leaf is present in both reading and live preview, so CSS
    // descendant selectors reach whichever mode's DOM tree is inside.
    const viewEl = leaf.view.containerEl;
    const leafEl = viewEl.closest<HTMLElement>(".workspace-leaf") ?? viewEl;

    const hasBlock = viewEl.querySelector(".explorer-container") !== null;
    leafEl.classList.toggle(HAS_BLOCK, hasBlock);

    // "Is last" is DOM-based so only reliable in reading mode (full tree in DOM).
    // In live preview CM virtualises lines, so we skip it there.
    const sizer = viewEl.querySelector<HTMLElement>(".markdown-preview-sizer");
    leafEl.classList.toggle(
      BLOCK_IS_LAST,
      hasBlock && !!sizer && isExplorerLastContent(sizer),
    );

    // Suppress the redundant view-header title when the note is a folder note
    // with an explorer block (the inline-title / virtual title already shows it).
    // const file =
    //   leaf.view instanceof MarkdownView ? leaf.view.file : null;
    // leafEl.classList.toggle(
    //   IS_FOLDERNOTE,
    //   hasBlock && !!file && isFolderNote(file),
    // );
  }
}

function isExplorerLastContent(sizer: HTMLElement): boolean {
  const explorer = sizer.querySelector(".explorer-container");
  if (!explorer) return false;

  let block: Element = explorer;
  while (block.parentElement && block.parentElement !== sizer) {
    block = block.parentElement;
  }

  let next = block.nextElementSibling;
  while (next) {
    if (next.textContent?.trim()) return false;
    next = next.nextElementSibling;
  }
  return true;
}

function clearDecorations(app: App): void {
  for (const leaf of app.workspace.getLeavesOfType("markdown")) {
    const leafEl =
      leaf.view.containerEl.closest<HTMLElement>(".workspace-leaf") ??
      leaf.view.containerEl;
    leafEl.classList.remove(HAS_BLOCK, BLOCK_IS_LAST, IS_FOLDERNOTE);
  }
}
