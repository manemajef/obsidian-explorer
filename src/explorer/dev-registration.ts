import { Plugin } from "obsidian";
import { renderExplorerDevBlock } from "./dev-runtime";

const IS_USE_DEV = true;

export function registerExplorerDevCodeBlock(plugin: Plugin): void {
  plugin.registerMarkdownCodeBlockProcessor(
    "explorer-dev",
    (_source, el, ctx) => {
      if (IS_USE_DEV) renderExplorerDevBlock(el, ctx);
    },
  );
}
