import { DataAdapter } from "obsidian";
import { BlockSettings, coercePartialBlockSettings } from "../settings";

const FLUSH_DELAY_MS = 250;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Persists per-folder block-setting overrides for *virtual* folder notes, so a
 * folder can carry custom Explorer settings without a Markdown folder note on
 * disk. Keyed by folder path; a folder keeps an entry only while it has at
 * least one non-default override. Backed by a single JSON file in the plugin
 * directory and held in memory (the data set is one row per customized folder).
 */
export class FolderDataStore {
  private folders = new Map<string, Partial<BlockSettings>>();
  private flushTimer: number | null = null;
  private dirty = false;

  constructor(
    private readonly adapter: DataAdapter,
    private readonly path: string,
  ) {}

  async load(): Promise<void> {
    this.folders.clear();

    let raw: unknown;
    try {
      if (!(await this.adapter.exists(this.path))) return;
      raw = JSON.parse(await this.adapter.read(this.path));
    } catch {
      return;
    }

    const folders = isRecord(raw) ? raw.folders : undefined;
    if (!isRecord(folders)) return;

    for (const [folderPath, overrides] of Object.entries(folders)) {
      if (!isRecord(overrides)) continue;
      // Pipe through the shared coercion so deprecated/legacy/typo'd fields are
      // dropped or migrated using the same rules as the Markdown block path.
      const coerced = coercePartialBlockSettings(overrides);
      if (Object.keys(coerced).length > 0) {
        this.folders.set(folderPath, coerced);
      }
    }
  }

  get(folderPath: string): Partial<BlockSettings> {
    return this.folders.get(folderPath) ?? {};
  }

  set(folderPath: string, overrides: Partial<BlockSettings>): void {
    // A row exists iff the folder has at least one non-default override.
    if (Object.keys(overrides).length === 0) {
      this.delete(folderPath);
      return;
    }
    this.folders.set(folderPath, overrides);
    this.scheduleFlush();
  }

  delete(folderPath: string): void {
    if (this.folders.delete(folderPath)) this.scheduleFlush();
  }

  renamePrefix(oldPath: string, newPath: string): void {
    const prefix = `${oldPath}/`;
    let changed = false;

    for (const [key, value] of [...this.folders]) {
      if (key === oldPath) {
        this.folders.delete(key);
        this.folders.set(newPath, value);
        changed = true;
      } else if (key.startsWith(prefix)) {
        this.folders.delete(key);
        this.folders.set(`${newPath}/${key.slice(prefix.length)}`, value);
        changed = true;
      }
    }

    if (changed) this.scheduleFlush();
  }

  deletePrefix(path: string): void {
    const prefix = `${path}/`;
    let changed = false;

    for (const key of [...this.folders.keys()]) {
      if (key === path || key.startsWith(prefix)) {
        this.folders.delete(key);
        changed = true;
      }
    }

    if (changed) this.scheduleFlush();
  }

  private scheduleFlush(): void {
    this.dirty = true;
    if (this.flushTimer !== null) return;
    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, FLUSH_DELAY_MS);
  }

  async flush(): Promise<void> {
    if (this.flushTimer !== null) {
      window.clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (!this.dirty) return;
    this.dirty = false;

    const folders: Record<string, Partial<BlockSettings>> = {};
    for (const [key, value] of this.folders) folders[key] = value;

    await this.adapter.write(this.path, JSON.stringify({ folders }, null, 2));
  }
}
