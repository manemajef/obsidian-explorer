import type { MarkdownPostProcessorContext } from "obsidian";

export type ExplorerBlockTarget = {
  container: HTMLElement;
  context: MarkdownPostProcessorContext;
};

export type ExplorerBlockMountLease = {
  host: HTMLElement;
  target: ExplorerBlockTarget;
};

type StoredMount = ExplorerBlockMountLease & {
  key: string | null;
  cleanup: (() => void) | null;
  disposed: boolean;
  releaseTimer: {
    ownerWindow: Window;
    id: number;
  } | null;
};

const RELEASE_DELAY_MS = 250;

export class ExplorerBlockMountStore {
  private readonly mounts = new Map<string, StoredMount>();

  acquire(
    key: string | null,
    target: ExplorerBlockTarget,
  ): { lease: ExplorerBlockMountLease; created: boolean } {
    const existing = key === null ? undefined : this.mounts.get(key);
    if (existing) {
      this.cancelRelease(existing);
      existing.target = target;
      target.container.appendChild(existing.host);
      return { lease: existing, created: false };
    }

    const mount: StoredMount = {
      key,
      host: target.container.createDiv(),
      target,
      cleanup: null,
      disposed: false,
      releaseTimer: null,
    };
    if (key !== null) this.mounts.set(key, mount);
    return { lease: mount, created: true };
  }

  attachCleanup(
    lease: ExplorerBlockMountLease,
    cleanup: () => void,
  ): void {
    const mount = this.asStoredMount(lease);
    if (mount.disposed) {
      cleanup();
      return;
    }
    mount.cleanup = cleanup;
  }

  release(lease: ExplorerBlockMountLease, container: HTMLElement): void {
    const mount = this.asStoredMount(lease);
    if (mount.disposed || mount.target.container !== container) return;
    if (mount.key === null) {
      this.disposeMount(mount);
      return;
    }

    const ownerWindow = container.ownerDocument.defaultView;
    if (!ownerWindow) {
      this.disposeMount(mount);
      return;
    }
    this.cancelRelease(mount);
    mount.releaseTimer = {
      ownerWindow,
      id: ownerWindow.setTimeout(
        () => this.disposeMount(mount),
        RELEASE_DELAY_MS,
      ),
    };
  }

  discard(lease: ExplorerBlockMountLease): void {
    this.disposeMount(this.asStoredMount(lease));
  }

  disposeAll = (): void => {
    for (const mount of Array.from(this.mounts.values())) {
      this.disposeMount(mount);
    }
  };

  private cancelRelease(mount: StoredMount): void {
    if (!mount.releaseTimer) return;
    mount.releaseTimer.ownerWindow.clearTimeout(mount.releaseTimer.id);
    mount.releaseTimer = null;
  }

  private disposeMount(mount: StoredMount): void {
    if (mount.disposed) return;
    mount.disposed = true;
    this.cancelRelease(mount);
    if (mount.key !== null && this.mounts.get(mount.key) === mount) {
      this.mounts.delete(mount.key);
    }
    mount.cleanup?.();
    mount.host.remove();
  }

  private asStoredMount(lease: ExplorerBlockMountLease): StoredMount {
    return lease as StoredMount;
  }
}
