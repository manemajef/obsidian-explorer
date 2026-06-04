import { App, TFile } from "obsidian";

export async function getPreviewForNote(app: App, file: TFile) {
  const content = await app.vault.cachedRead(file);
  if (!content) return "";
  const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, "");
  const contentStart = bodyContent.split(/\s+/).slice(0, 50).join(" ");
  const plainText = contentStart
    .replace(/#+\s/g, "") // remove headers
    .replace(/\[\[(.*?)\]\]/g, "$1") // simplify wikilinks
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // simplify markdown links
    .replace(/[*_~`]/g, "") // remove formatting marks
    .trim();
  let snippet = plainText.slice(0, 100);
  if (plainText.length > 100) {
    snippet = snippet.slice(0, snippet.lastIndexOf(" ")) + "...";
  }
  return snippet;
}
