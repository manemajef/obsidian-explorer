import type { App, TFile } from "obsidian";

export async function setPinnedState(
  app: App,
  file: TFile,
  pinned: boolean,
): Promise<void> {
  await app.fileManager.processFrontMatter(
    file,
    (frontmatter: Record<string, unknown>) => {
      if (pinned) {
        frontmatter["pin"] = true;
      } else {
        delete frontmatter["pin"];
      }
    },
  );
}
