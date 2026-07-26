export type ExplorerBlockSection = {
  lineStart: number;
  lineEnd: number;
};

export function replaceExplorerBlock(
  content: string,
  replacement: string,
  section: ExplorerBlockSection | null,
): string {
  if (!section) {
    return content.replace(/```explorer\n[\s\S]*?```/, replacement);
  }

  const lines = content.split("\n");
  return [
    ...lines.slice(0, section.lineStart),
    replacement,
    ...lines.slice(section.lineEnd + 1),
  ].join("\n");
}

export function appendExplorerBlock(
  content: string,
  block: string,
): string {
  const separator = content.length === 0 || content.endsWith("\n") ? "" : "\n";
  return `${content}${separator}${block}`;
}
