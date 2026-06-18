import { App, MarkdownView } from "obsidian";
import { isHTMLElement } from "../../utils";

const ACTION_BAR_SLOT_ATTR = "data-explorer-action-bar-slot";
const ACTION_BAR_LINE_METRICS_ATTR = "data-explorer-action-bar-line-metrics";

type ActionBarPlacement = {
  parent: HTMLElement;
  isSettled: boolean;
};

type ActionBarPlacementMode = "edit" | "preview";

export type ActionBarSlot = {
  readonly el: HTMLElement | null;
  readonly isSettled: boolean;
  sync: () => HTMLElement | null;
  dispose: () => void;
};

export function registerActionBarSlot(
  app: App,
  container: HTMLElement,
): ActionBarSlot {
  let el: HTMLElement | null = null;
  let isSettled = false;

  const ensureHost = (parent: HTMLElement): HTMLElement => {
    if (el && el.ownerDocument !== parent.ownerDocument) {
      el.remove();
      el = null;
    }

    el ??= parent.createDiv({
      cls: "explorer-container explorer-action-bar-host",
    });

    if (!el.hasAttribute(ACTION_BAR_SLOT_ATTR)) {
      el.addClass("explorer-container", "explorer-action-bar-host");
      el.setAttr(ACTION_BAR_SLOT_ATTR, "");
    }

    return el;
  };

  return {
    get el() {
      return el;
    },

    get isSettled() {
      return isSettled;
    },

    sync() {
      const placement = findActionBarPlacement(app, container);
      if (!placement) {
        el?.remove();
        el = null;
        isSettled = false;
        return el;
      }

      const host = ensureHost(placement.parent);
      placeActionBarSlot(placement, host);
      isSettled = placement.isSettled;
      return host;
    },

    dispose() {
      el?.remove();
      el = null;
      isSettled = false;
    },
  };
}

function placeActionBarSlot(
  placement: ActionBarPlacement,
  host: HTMLElement,
): void {
  const { parent: container } = placement;

  // Place after inline-title, before metadata-container
  const inlineTitle = getDirectChild(container, ".inline-title");
  const metadata = getDirectChild(container, ".metadata-container");
  const lineMetricsSource = inlineTitle ?? metadata;
  syncActionBarLineMetrics(host, container, lineMetricsSource);

  // If we have inline-title, place after it
  if (inlineTitle) {
    if (
      host.parentElement === container &&
      host.previousElementSibling === inlineTitle
    ) {
      return; // Already in correct position
    }
    inlineTitle.after(host);
    return;
  }

  // Otherwise, place before metadata if it exists
  if (metadata) {
    if (
      host.parentElement === container &&
      host.nextElementSibling === metadata
    ) {
      return; // Already in correct position
    }
    metadata.before(host);
    return;
  }

  // Fallback: place at start
  if (host.parentElement === container && container.firstElementChild === host) {
    return;
  }
  container.prepend(host);
}

function syncActionBarLineMetrics(
  host: HTMLElement,
  container: HTMLElement,
  source: HTMLElement | null,
): void {
  if (!container.matches(".cm-sizer") || !source) {
    clearActionBarLineMetrics(host);
    return;
  }

  const width = source.getBoundingClientRect().width;
  if (width <= 0) {
    clearActionBarLineMetrics(host);
    return;
  }

  host.style.setProperty("--explorer-action-bar-line-width", `${width}px`);
  host.setAttr(ACTION_BAR_LINE_METRICS_ATTR, "");
}

function clearActionBarLineMetrics(host: HTMLElement): void {
  host.style.removeProperty("--explorer-action-bar-line-width");
  host.removeAttribute(ACTION_BAR_LINE_METRICS_ATTR);
}

function findActionBarPlacement(
  app: App,
  container: HTMLElement,
): ActionBarPlacement | null {
  const mode = getContainerPlacementMode(app, container);
  if (mode === "edit") {
    return findEditPlacement(container);
  }

  if (mode === "preview") {
    return findPreviewPlacement(container);
  }

  return findEditPlacement(container) ?? findPreviewPlacement(container);
}

function findEditPlacement(container: HTMLElement): ActionBarPlacement | null {
  const editorSizer = closestHTMLElement(container, ".cm-sizer");
  if (!editorSizer) return null;

  return {
    parent: editorSizer,
    isSettled: true, // Always settled since container always exists
  };
}

function findPreviewPlacement(container: HTMLElement): ActionBarPlacement | null {
  const previewSizer = closestHTMLElement(container, ".markdown-preview-sizer");
  if (!previewSizer) return null;

  // Try to find .mod-header.mod-ui which contains inline-title and metadata
  const header = getDirectChild(previewSizer, ".mod-header.mod-ui");
  if (header) {
    return { parent: header, isSettled: true };
  }

  // Fallback to preview sizer itself
  return {
    parent: previewSizer,
    isSettled: true,
  };
}

function getContainerPlacementMode(
  app: App,
  container: HTMLElement,
): ActionBarPlacementMode | null {
  const view = getOwningMarkdownView(app, container);
  if (!view) return null;

  const mode = view.getMode();
  if (mode === "source") {
    return closestHTMLElement(container, ".cm-sizer") ? "edit" : null;
  }

  return closestHTMLElement(container, ".markdown-preview-sizer")
    ? "preview"
    : null;
}

function getOwningMarkdownView(
  app: App,
  container: HTMLElement,
): MarkdownView | null {
  let owner: MarkdownView | null = null;

  app.workspace.iterateAllLeaves((leaf) => {
    if (owner || !(leaf.view instanceof MarkdownView)) return;
    if (leaf.view.containerEl.contains(container)) {
      owner = leaf.view;
    }
  });

  return owner;
}

function closestHTMLElement(
  container: HTMLElement,
  selector: string,
): HTMLElement | null {
  const match = container.closest(selector);
  return isHTMLElement(match) ? match : null;
}

function getDirectChild(
  container: HTMLElement,
  selector: string,
): HTMLElement | null {
  return (
    Array.from(container.children).find(
      (child): child is HTMLElement =>
        isHTMLElement(child) && child.matches(selector),
    ) ?? null
  );
}
