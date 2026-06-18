let pending = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export function markNavigationPending(): void {
  pending = true;
  if (timer !== null) clearTimeout(timer);
  // Safety valve: clear if mountExplorer is never called (note without explorer block)
  timer = setTimeout(() => {
    pending = false;
    timer = null;
  }, 2000);
}

export function consumeNavigationPending(): boolean {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  const had = pending;
  pending = false;
  return had;
}
