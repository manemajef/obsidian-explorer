import { App } from "obsidian";

/**
 * Create an Obsidian internal link with proper attributes for context menu
 */
export function createInternalLink(
  container: HTMLElement,
  path: string,
  displayText: string,
  app: App,
  sourcePath: string,
  additionalClasses: string[] = [],
): HTMLAnchorElement {
  const link = container.createEl("a", {
    text: displayText,
    cls: ["internal-link", ...additionalClasses].join(" "),
    attr: {
      "data-href": path,
      href: path,
      "data-tooltip-position": "top",
      target: "_blank",
      rel: "noopener",
    },
  });

  //   link.addEventListener("click", (e) => {
  //     e.preventDefault();
  //     app.workspace.openLinkText(path, sourcePath, e.ctrlKey || e.metaKey);
  //   });

  return link;
}
