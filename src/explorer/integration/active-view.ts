import { App, MarkdownView, type WorkspaceLeaf } from "obsidian";
import {
  VIRTUAL_FOLDER_NOTE_VIEW_TYPE,
  VirtualFolderNoteView,
} from "./virtual-folder-note-view";

export const MARKDOWN_WITH_EXPLORER_VIEW_TYPE =
  "markdown-with-explorer-codeblock";

export type ActiveExplorerViewType = string;

export function getActiveViewType(
  app: App,
  leaf: WorkspaceLeaf | null = app.workspace.getMostRecentLeaf(),
): ActiveExplorerViewType {
  const view = leaf?.view;
  if (!view) return "unknown";

  if (view instanceof VirtualFolderNoteView) {
    return VIRTUAL_FOLDER_NOTE_VIEW_TYPE;
  }

  const viewType = view.getViewType();
  if (view instanceof MarkdownView && hasMountedExplorer(leaf)) {
    return MARKDOWN_WITH_EXPLORER_VIEW_TYPE;
  }

  return viewType;
}

export function hasExplorerView(
  app: App,
  leaf: WorkspaceLeaf | null = app.workspace.getMostRecentLeaf(),
): boolean {
  const viewType = getActiveViewType(app, leaf);
  return (
    viewType === MARKDOWN_WITH_EXPLORER_VIEW_TYPE ||
    viewType === VIRTUAL_FOLDER_NOTE_VIEW_TYPE
  );
}

function hasMountedExplorer(leaf: WorkspaceLeaf): boolean {
  return Boolean(leaf.view.containerEl.querySelector(".explorer-container"));
}
