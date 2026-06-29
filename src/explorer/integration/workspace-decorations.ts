import { App, Plugin } from "obsidian";

const HAS_BLOCK = "explorer-has-block";
const RAW_EXPLORER_CODE_BLOCK = "explorer-raw-code-block";
// const BLOCK_IS_LAST = "explorer-block-is-last";

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
    viewEl
      .querySelectorAll<HTMLElement>(`.${RAW_EXPLORER_CODE_BLOCK}`)
      .forEach((el) => el.classList.remove(RAW_EXPLORER_CODE_BLOCK));
    viewEl.querySelectorAll("pre > code.language-explorer").forEach((code) => {
      code.parentElement?.classList.add(RAW_EXPLORER_CODE_BLOCK);
    });
    // const sizer = viewEl.querySelector<HTMLElement>(".markdown-preview-sizer");
  }
}

function clearDecorations(app: App): void {
  for (const leaf of app.workspace.getLeavesOfType("markdown")) {
    const leafEl =
      leaf.view.containerEl.closest<HTMLElement>(".workspace-leaf") ??
      leaf.view.containerEl;
    leafEl.classList.remove(HAS_BLOCK);
    leaf.view.containerEl
      .querySelectorAll<HTMLElement>(`.${RAW_EXPLORER_CODE_BLOCK}`)
      .forEach((el) => el.classList.remove(RAW_EXPLORER_CODE_BLOCK));
  }
}
