export function resolveExplorerMountKey(input: {
  docId: string;
  sourcePath: string;
  lineStart: number | null;
  lineEnd: number | null;
  blockConfig: string;
}): string | null {
  if (input.lineStart === null || input.lineEnd === null) return null;
  return JSON.stringify([
    input.docId,
    input.sourcePath,
    input.lineStart,
    input.lineEnd,
    input.blockConfig,
  ]);
}
