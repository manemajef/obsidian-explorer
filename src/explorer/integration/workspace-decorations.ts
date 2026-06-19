import { App, Plugin } from "obsidian";

const HAS_BLOCK = "explorer-has-block";
const BLOCK_IS_LAST = "explorer-block-is-last";

export function registerWorkspaceDecorations(plugin: Plugin, app: App): void {
  let framePending = false;
  const refresh = (): void => {
    if (framePending) return;
    framePending = true;
    app.workspace.containerEl.win.requestAnimationFrame(() => {
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
    plugin.registerEvent(app.workspace.on("layout-change", refresh));
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
    const blockIsLast = hasBlock && !!sizer && isExplorerLastContent(sizer);
    leafEl.classList.toggle(BLOCK_IS_LAST, blockIsLast);
    applyLastBlockSpacingFix(viewEl, blockIsLast);
  }
}

function applyLastBlockSpacingFix(viewEl: HTMLElement, enabled: boolean): void {
  const previewSizer = viewEl.querySelector<HTMLElement>(
    ".markdown-preview-sizer",
  );
  const cmContent = viewEl.querySelector<HTMLElement>(
    ".cm-content.cm-lineWrapping",
  );

  previewSizer?.setCssProps({
    "padding-bottom": enabled ? "2em" : "",
    "min-height": enabled ? "0" : "",
  });
  cmContent?.setCssProps({
    "padding-bottom": enabled ? "2em" : "",
  });
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
    applyLastBlockSpacingFix(leaf.view.containerEl, false);
    const leafEl =
      leaf.view.containerEl.closest<HTMLElement>(".workspace-leaf") ??
      leaf.view.containerEl;
    leafEl.classList.remove(HAS_BLOCK, BLOCK_IS_LAST);
  }
}
