const pendingPaths = new Set<string>();
let timer: number | null = null;

export function markNavigationPending(sourcePath: string): void {
  pendingPaths.add(sourcePath);
  if (timer !== null) window.clearTimeout(timer);
  // Safety valve: clear if mountExplorer is never called.
  timer = window.setTimeout(() => {
    pendingPaths.clear();
    timer = null;
  }, 2000);
}

export function consumeNavigationPending(sourcePath: string): boolean {
  const had = pendingPaths.delete(sourcePath);
  if (timer !== null && pendingPaths.size === 0) {
    window.clearTimeout(timer);
    timer = null;
  }
  return had;
}
