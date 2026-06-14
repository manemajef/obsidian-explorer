import React from "react";
import { createRoot } from "react-dom/client";
import {
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
} from "obsidian";
import { ExplorerDevUI } from "../ui/dev-fixtures/explorer-dev-ui";

export function renderExplorerDevBlock(
  container: HTMLElement,
  ctx: MarkdownPostProcessorContext,
): void {
  container.addClass("explorer-container", "explorer-dev-container");

  const reactRoot = createRoot(container);
  const child = new MarkdownRenderChild(container);

  child.register(() => reactRoot.unmount());
  ctx.addChild(child);

  reactRoot.render(<ExplorerDevUI />);
}
