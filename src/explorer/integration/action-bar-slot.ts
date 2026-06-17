import { App, MarkdownView } from "obsidian";
import { isHTMLElement } from "../../utils";

const ACTION_BAR_SLOT_ATTR = "data-explorer-action-bar-slot";

type ActionBarPlacement = {
  parent: HTMLElement;
  fallbackBefore?: HTMLElement;
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
  const { parent: titleContainer, fallbackBefore } = placement;
  const inlineTitle = getDirectChild(titleContainer, ".inline-title");
  if (inlineTitle) {
    placeAfter(inlineTitle, host);
    return;
  }

  const metadata = getDirectChild(titleContainer, ".metadata-container");
  if (metadata) {
    placeBefore(metadata, host);
    return;
  }

  if (fallbackBefore?.parentElement === titleContainer) {
    placeBefore(fallbackBefore, host);
    return;
  }

  placeAtStart(titleContainer, host);
}

function placeAfter(reference: HTMLElement, host: HTMLElement): void {
  if (
    host.parentElement === reference.parentElement &&
    host.previousElementSibling === reference
  ) {
    return;
  }
  reference.after(host);
}

function placeBefore(reference: HTMLElement, host: HTMLElement): void {
  if (
    host.parentElement === reference.parentElement &&
    host.nextElementSibling === reference
  ) {
    return;
  }
  reference.before(host);
}

function placeAtStart(parent: HTMLElement, host: HTMLElement): void {
  if (host.parentElement === parent && parent.firstElementChild === host) {
    return;
  }
  parent.prepend(host);
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
    fallbackBefore:
      getDirectChild(editorSizer, ".cm-contentContainer") ?? undefined,
    isSettled: hasTitleSurface(editorSizer),
  };
}

function findPreviewPlacement(container: HTMLElement): ActionBarPlacement | null {
  const previewSizer = closestHTMLElement(container, ".markdown-preview-sizer");
  if (!previewSizer) return null;

  const header = getDirectChild(previewSizer, ".mod-header.mod-ui");
  if (header) {
    return { parent: header, isSettled: hasTitleSurface(header) };
  }

  const previous = container.previousElementSibling;
  if (hasTitleSurface(previous)) return { parent: previous, isSettled: true };

  const titleSurface = Array.from(previewSizer.children).find((child) =>
    hasTitleSurface(child),
  );
  if (titleSurface) return { parent: titleSurface, isSettled: true };

  const blockWrapper = closestHTMLElement(container, ".el-pre");
  return {
    parent: previewSizer,
    fallbackBefore:
      blockWrapper?.parentElement === previewSizer ? blockWrapper : undefined,
    isSettled: false,
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

function hasTitleSurface(value: unknown): value is HTMLElement {
  return (
    isHTMLElement(value) &&
    (getDirectChild(value, ".inline-title") !== null ||
      getDirectChild(value, ".metadata-container") !== null)
  );
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
