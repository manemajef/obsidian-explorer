import { MarkdownRenderChild, type Plugin } from "obsidian";
import type { ExplorerApi } from "../api";
import { ExplorerBlockMountStore } from "../data/explorer-block-mount-store";
import { resolveExplorerMountKey } from "../domain/explorer-mount-key";
import { updateExplorerBlock } from "../operations/update-explorer-block";
import { mountExplorer } from "../runtime";
import {
  parseSettings,
  type BlockSettings,
  type PluginSettings,
} from "../settings";

export function registerExplorerCodeBlocks(
  plugin: Plugin,
  options: {
    explorerApi: ExplorerApi;
    getBlockDefaults: () => BlockSettings;
    getPluginSettings: () => PluginSettings;
    registerRefresh?: (refresh: () => void) => () => void;
  },
): void {
  const mounts = new ExplorerBlockMountStore();
  plugin.register(mounts.disposeAll);
  plugin.registerMarkdownCodeBlockProcessor(
    "explorer",
    async (source, container, context) => {
      const section = context.getSectionInfo(container);
      const key = resolveExplorerMountKey({
        docId: context.docId,
        sourcePath: context.sourcePath,
        lineStart: section?.lineStart ?? null,
        lineEnd: section?.lineEnd ?? null,
        blockConfig: source,
      });
      const { lease, created } = mounts.acquire(key, {
        container,
        context,
      });
      const child = new MarkdownRenderChild(container);
      child.register(() => mounts.release(lease, container));
      context.addChild(child);
      if (!created) return;

      try {
        const cleanup = await mountExplorer({
          explorerApi: options.explorerApi,
          app: plugin.app,
          container: lease.host,
          sourcePath: context.sourcePath,
          getBlockDefaults: options.getBlockDefaults,
          getPluginSettings: options.getPluginSettings,
          initialOverrides: parseSettings(source),
          registerRefresh: options.registerRefresh,
          replaceExplorerBlock: async (settings, sourcePath) => {
            await updateExplorerBlock({
              app: plugin.app,
              container: lease.target.container,
              context: lease.target.context,
              sourcePath,
              defaultSettings: options.getBlockDefaults(),
              settings,
            });
          },
        });
        mounts.attachCleanup(lease, cleanup);
      } catch (error) {
        mounts.discard(lease);
        throw error;
      }
    },
  );
}
