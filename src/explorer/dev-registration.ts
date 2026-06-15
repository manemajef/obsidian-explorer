import React from "react";
import { createRoot } from "react-dom/client";
import {
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  Plugin,
} from "obsidian";
import { ExplorerDevUI } from "../ui/dev-fixtures/explorer-dev-ui";

const IS_USE_DEV = true;

export function registerExplorerDevCodeBlock(plugin: Plugin): void {
  plugin.registerMarkdownCodeBlockProcessor(
    "explorer-dev",
    (_source, el, ctx) => {
      if (IS_USE_DEV) renderExplorerDevBlock(el, ctx);
    },
  );
}

function renderExplorerDevBlock(
  container: HTMLElement,
  ctx: MarkdownPostProcessorContext,
): void {
  container.addClass("explorer-container", "explorer-dev-container");

  const reactRoot = createRoot(container);
  const child = new MarkdownRenderChild(container);

  child.register(() => reactRoot.unmount());
  ctx.addChild(child);

  reactRoot.render(React.createElement(ExplorerDevUI));
}
