/* global createDiv */
import {
  Plugin,
  editorInfoField,
  editorLivePreviewField,
  type TFile,
} from "obsidian";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";

type ActionBarHost = {
  el: HTMLElement;
  editorEl: HTMLElement;
  requestMeasure: () => void;
};

type ActionBarListener = () => void;

export class ExplorerActionBarRegistry {
  private hosts = new Map<string, Set<ActionBarHost>>();
  private listeners = new Map<string, Set<ActionBarListener>>();

  getHost(path: string, container: HTMLElement): ActionBarHost | null {
    const hosts = this.hosts.get(path);
    if (!hosts) return null;

    const editorEl = container.closest(".cm-editor");
    if (editorEl) {
      for (const host of hosts) {
        if (host.editorEl === editorEl) return host;
      }
    }

    return hosts.size === 1 ? Array.from(hosts)[0] : null;
  }

  setHost(path: string, host: ActionBarHost): void {
    let hosts = this.hosts.get(path);
    if (!hosts) {
      hosts = new Set();
      this.hosts.set(path, hosts);
    }
    if (Array.from(hosts).some((current) => current.el === host.el)) return;

    hosts.add(host);
    this.notify(path);
  }

  removeHost(path: string, el: HTMLElement): void {
    const hosts = this.hosts.get(path);
    if (!hosts) return;

    for (const host of hosts) {
      if (host.el === el) {
        hosts.delete(host);
        if (hosts.size === 0) {
          this.hosts.delete(path);
        }
        this.notify(path);
        return;
      }
    }
  }

  requestMeasure(path: string, container: HTMLElement): void {
    this.getHost(path, container)?.requestMeasure();
  }

  subscribe(path: string, listener: ActionBarListener): () => void {
    let listeners = this.listeners.get(path);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(path, listeners);
    }
    listeners.add(listener);

    return () => {
      const current = this.listeners.get(path);
      current?.delete(listener);
      if (current?.size === 0) {
        this.listeners.delete(path);
      }
    };
  }

  private notify(path: string): void {
    for (const listener of Array.from(this.listeners.get(path) ?? [])) {
      listener();
    }
  }
}

export function registerExplorerActionBar(
  plugin: Plugin,
): ExplorerActionBarRegistry {
  const registry = new ExplorerActionBarRegistry();
  plugin.registerEditorExtension(explorerActionBarExtension(registry));
  return registry;
}

function explorerActionBarExtension(registry: ExplorerActionBarRegistry) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildActionBarDecorations(view, registry);
      }

      update(update: ViewUpdate): void {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.startState.field(editorInfoField, false)?.file?.path !==
            update.state.field(editorInfoField, false)?.file?.path ||
          update.startState.field(editorLivePreviewField, false) !==
            update.state.field(editorLivePreviewField, false)
        ) {
          this.decorations = buildActionBarDecorations(update.view, registry);
        }
      }
    },
    {
      decorations: (value) => value.decorations,
    },
  );
}

function buildActionBarDecorations(
  view: EditorView,
  registry: ExplorerActionBarRegistry,
): DecorationSet {
  if (!view.state.field(editorLivePreviewField, false)) {
    return Decoration.none;
  }

  const file = view.state.field(editorInfoField, false)?.file;
  if (!file) {
    return Decoration.none;
  }

  const explorerBlockCount = countExplorerBlocks(view.state.doc.toString());
  if (explorerBlockCount !== 1) {
    return Decoration.none;
  }

  const builder = new RangeSetBuilder<Decoration>();
  builder.add(
    0,
    0,
    Decoration.widget({
      widget: new ExplorerActionBarWidget(registry, file),
      block: true,
      side: -100,
    }),
  );
  return builder.finish();
}

function countExplorerBlocks(source: string): number {
  return source.match(/^ {0,3}```explorer(?:[\t ].*)?$/gm)?.length ?? 0;
}

class ExplorerActionBarWidget extends WidgetType {
  constructor(
    private readonly registry: ExplorerActionBarRegistry,
    private readonly file: TFile,
  ) {
    super();
  }

  eq(widget: WidgetType): boolean {
    return (
      widget instanceof ExplorerActionBarWidget &&
      widget.registry === this.registry &&
      widget.file.path === this.file.path
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const el = createDiv({
      cls: "explorer-container explorer-action-bar-host explorer-editor-action-bar-host",
    });
    el.setAttr("data-explorer-editor-action-bar-host", "");
    el.setAttr("data-path", this.file.path);
    this.registry.setHost(this.file.path, {
      el,
      editorEl: view.dom,
      requestMeasure: () => view.requestMeasure(),
    });
    return el;
  }

  get estimatedHeight(): number {
    return 48;
  }

  destroy(dom: HTMLElement): void {
    this.registry.removeHost(this.file.path, dom);
  }
}
