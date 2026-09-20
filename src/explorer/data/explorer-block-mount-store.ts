import type { MarkdownPostProcessorContext } from "obsidian";

export type ExplorerBlockTarget = {
  container: HTMLElement;
  context: MarkdownPostProcessorContext;
};

export class ExplorerBlockMountLease {
  cleanup: (() => void) | null = null;
  disposed = false;
  releaseTimer: {
    ownerWindow: Window;
    id: number;
  } | null;

  constructor(
    readonly key: string | null,
    readonly host: HTMLElement,
    public target: ExplorerBlockTarget,
  ) {
    this.releaseTimer = null;
  }
}

const RELEASE_DELAY_MS = 250;

export class ExplorerBlockMountStore {
  private readonly mounts = new Set<ExplorerBlockMountLease>();
  private readonly mountsByKey = new Map<string, ExplorerBlockMountLease>();

  acquire(
    key: string | null,
    target: ExplorerBlockTarget,
  ): { lease: ExplorerBlockMountLease; created: boolean } {
    const existing = key === null ? undefined : this.mountsByKey.get(key);
    if (existing) {
      this.cancelRelease(existing);
      existing.target = target;
      target.container.appendChild(existing.host);
      return { lease: existing, created: false };
    }

    const mount = new ExplorerBlockMountLease(
      key,
      target.container.createDiv(),
      target,
    );
    this.mounts.add(mount);
    if (key !== null) this.mountsByKey.set(key, mount);
    return { lease: mount, created: true };
  }

  attachCleanup(
    lease: ExplorerBlockMountLease,
    cleanup: () => void,
  ): void {
    if (lease.disposed) {
      cleanup();
      return;
    }
    lease.cleanup = cleanup;
  }

  release(lease: ExplorerBlockMountLease, container: HTMLElement): void {
    if (lease.disposed || lease.target.container !== container) return;
    if (lease.key === null) {
      this.disposeMount(lease);
      return;
    }

    const ownerWindow = container.ownerDocument.defaultView;
    if (!ownerWindow) {
      this.disposeMount(lease);
      return;
    }
    this.cancelRelease(lease);
    lease.releaseTimer = {
      ownerWindow,
      id: ownerWindow.setTimeout(
        () => this.disposeMount(lease),
        RELEASE_DELAY_MS,
      ),
    };
  }

  discard(lease: ExplorerBlockMountLease): void {
    this.disposeMount(lease);
  }

  disposeAll = (): void => {
    for (const mount of Array.from(this.mounts)) {
      this.disposeMount(mount);
    }
  };

  private cancelRelease(mount: ExplorerBlockMountLease): void {
    if (!mount.releaseTimer) return;
    mount.releaseTimer.ownerWindow.clearTimeout(mount.releaseTimer.id);
    mount.releaseTimer = null;
  }

  private disposeMount(mount: ExplorerBlockMountLease): void {
    if (mount.disposed) return;
    mount.disposed = true;
    this.cancelRelease(mount);
    this.mounts.delete(mount);
    if (
      mount.key !== null &&
      this.mountsByKey.get(mount.key) === mount
    ) {
      this.mountsByKey.delete(mount.key);
    }
    mount.cleanup?.();
    mount.host.remove();
  }
}
