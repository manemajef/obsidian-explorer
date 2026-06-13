import { App, Plugin, setIcon, type WorkspaceLeaf } from "obsidian";
import { type PluginSettings } from "../settings";
import {
  canGoToParentFolderNote,
  goToParentFolderNote,
} from "../navigation/folder-notes";
import { openHomePage, resolveHomePagePath } from "../navigation/homepage";
import { isHTMLElement } from "../../utils";
import { getActiveExplorerLocation } from "./commands";
import { getActiveVirtualFolderNote } from "./virtual-folder-note-view";

type TitlebarActionDeps = {
  getSettings: () => PluginSettings;
  saveSettings: () => void | Promise<void>;
};

type TitlebarAction = {
  id: string;
  icon: string;
  label: string;
  isVisible: () => boolean;
  run: () => void | Promise<void>;
};

type ActionContainer = {
  el: HTMLElement;
  buttonClass: string;
};

const VIEW_ACTION_BUTTON_CLASS = "clickable-icon view-action";
const TITLEBAR_BUTTON_CLASS = "titlebar-button";

export function registerExplorerTitlebarActions(
  plugin: Plugin,
  deps: TitlebarActionDeps,
): () => void {
  const { app } = plugin;
  let mountedContainer: HTMLElement | null = null;
  let mountedButtonClass = "";
  let activeLeaf: WorkspaceLeaf | null = null;
  const buttons = new Map<string, HTMLElement>();

  const actions: TitlebarAction[] = [
    {
      id: "go-to-parent-folder",
      icon: "undo-2",
      label: "Go to parent folder",
      isVisible: () =>
        areTitlebarActionsEnabled() &&
        canGoToParentFolderNote(
          app,
          deps.getSettings(),
          getActiveExplorerLocation(app),
        ),
      run: async () => {
        await goToParentFolderNote(app, deps.getSettings(), {
          location: getActiveExplorerLocation(app),
          savePluginSettings: deps.saveSettings,
        });
      },
    },
    {
      id: "go-to-homepage",
      icon: "home",
      label: "Go to homepage",
      isVisible: () =>
        areTitlebarActionsEnabled() && canGoToHomePage(app, deps.getSettings()),
      run: async () => {
        await openHomePage(
          app,
          deps.getSettings(),
          getActiveExplorerLocation(app)?.path ?? "",
          false,
        );
      },
    },
    {
      id: "save-virtual-folder-note",
      icon: "pen-line",
      label: "Save folder note as Markdown",
      isVisible: () =>
        areTitlebarActionsEnabled() &&
        Boolean(getActiveVirtualFolderNote(app)?.folder),
      run: async () => {
        await getActiveVirtualFolderNote(app)?.materialize();
      },
    },
  ];

  const refresh = (): void => {
    renderTitlebar();
  };

  const renderTitlebar = (): void => {
    const container = getActionContainer(
      app,
      activeLeaf ?? app.workspace.getMostRecentLeaf(),
    );
    if (!container) {
      removeButtons();
      return;
    }

    if (
      container.el !== mountedContainer ||
      container.buttonClass !== mountedButtonClass
    ) {
      removeButtons();
      mountedContainer = container.el;
      mountedButtonClass = container.buttonClass;
    }

    renderActions(container.el, container.buttonClass);
  };

  const areTitlebarActionsEnabled = (): boolean =>
    deps.getSettings().showTitlebarActions === true;

  app.workspace.onLayoutReady(() => {
    activeLeaf = app.workspace.getMostRecentLeaf();
    refresh();
  });

  plugin.registerEvent(
    app.workspace.on("active-leaf-change", (leaf) => {
      activeLeaf = leaf;
      refresh();
    }),
  );
  plugin.registerEvent(app.workspace.on("file-open", () => refresh()));
  plugin.registerEvent(app.workspace.on("layout-change", () => refresh()));
  plugin.registerEvent(app.vault.on("create", () => refresh()));
  plugin.registerEvent(app.vault.on("delete", () => refresh()));
  plugin.registerEvent(app.vault.on("rename", () => refresh()));
  plugin.register(removeButtons);
  return refresh;

  function removeButtons(): void {
    for (const button of buttons.values()) {
      button.remove();
    }
    buttons.clear();
    mountedContainer = null;
    mountedButtonClass = "";
  }

  function createButton(
    container: HTMLElement,
    ownerPlugin: Plugin,
    action: TitlebarAction,
    buttonClass: string,
  ): HTMLElement {
    const button = container.createDiv({
      cls: `explorer-titlebar-action ${buttonClass}`,
    });
    button.setAttr("aria-label", action.label);
    button.setAttr("data-tooltip-position", "bottom");
    button.setAttr("role", "button");
    button.setAttr("tabindex", "0");
    button.setAttr("data-explorer-titlebar-action", action.id);
    setIcon(button, action.icon);

    ownerPlugin.registerDomEvent(button, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void runAction(action, refresh);
    });
    ownerPlugin.registerDomEvent(button, "keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      event.stopPropagation();
      void runAction(action, refresh);
    });

    return button;
  }

  function renderActions(container: HTMLElement, buttonClass: string): void {
    const visibleButtons: HTMLElement[] = [];

    for (const action of actions) {
      let button = buttons.get(action.id);

      if (!action.isVisible()) {
        button?.remove();
        continue;
      }

      if (!button) {
        button = createButton(container, plugin, action, buttonClass);
        buttons.set(action.id, button);
      }

      visibleButtons.push(button);
    }

    if (!areActionsAlreadyFirst(container, visibleButtons)) {
      container.prepend(...visibleButtons);
    }
  }
}

async function runAction(
  action: TitlebarAction,
  refresh: () => void,
): Promise<void> {
  if (!action.isVisible()) return;
  await action.run();
  refresh();
}

function getActionContainer(
  app: App,
  activeLeaf: WorkspaceLeaf | null,
): ActionContainer | null {
  const activeViewActions = getLeafViewActions(activeLeaf);
  if (isHTMLElement(activeViewActions)) {
    return {
      el: activeViewActions,
      buttonClass: VIEW_ACTION_BUTTON_CLASS,
    };
  }

  const doc = app.workspace.containerEl.ownerDocument;
  const activeHeaderActions = doc.querySelector(
    ".workspace-leaf.mod-active .view-actions",
  );
  if (isHTMLElement(activeHeaderActions)) {
    return {
      el: activeHeaderActions,
      buttonClass: VIEW_ACTION_BUTTON_CLASS,
    };
  }

  const titlebar = doc.querySelector(
    ".titlebar div.titlebar-button-container.mod-right",
  );
  if (isHTMLElement(titlebar)) {
    return {
      el: titlebar,
      buttonClass: TITLEBAR_BUTTON_CLASS,
    };
  }

  const visibleViewActions = doc.querySelector(".view-header .view-actions");
  if (isHTMLElement(visibleViewActions)) {
    return {
      el: visibleViewActions,
      buttonClass: VIEW_ACTION_BUTTON_CLASS,
    };
  }

  return null;
}

function getLeafViewActions(leaf: WorkspaceLeaf | null): HTMLElement | null {
  const container = leaf?.view.containerEl;
  if (!container) return null;

  const viewActions =
    container.querySelector(".view-actions") ??
    container
      .closest(".workspace-leaf-content")
      ?.querySelector(".view-actions");

  return isHTMLElement(viewActions) ? viewActions : null;
}

function areActionsAlreadyFirst(
  container: HTMLElement,
  buttons: HTMLElement[],
): boolean {
  return buttons.every((button, index) => container.children[index] === button);
}

function canGoToHomePage(app: App, settings: PluginSettings): boolean {
  const homePath = resolveHomePagePath(app, settings);
  if (!homePath) return false;

  const location = getActiveExplorerLocation(app);
  return Boolean(location && location.path !== homePath);
}
