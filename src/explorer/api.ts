import type { App } from "obsidian";
import type { ExplorerLocation } from "./navigation/folder-notes";
import { canNavigateToParent, navigateToParent } from "./navigation/parent";
import type { PluginSettings } from "./settings";

type ExplorerApiDependencies = {
  app: App;
  getSettings: () => PluginSettings;
  saveSettings: () => void | Promise<void>;
};

export class ExplorerApi {
  constructor(private readonly dependencies: ExplorerApiDependencies) {}

  at(location: ExplorerLocation | null): Explorer {
    return new BoundExplorer(this.dependencies, location);
  }
}

export interface Explorer {
  canGoToParent(): boolean;
  goToParent(newLeaf?: boolean): Promise<void>;
}

class BoundExplorer implements Explorer {
  constructor(
    private readonly dependencies: ExplorerApiDependencies,
    private readonly location: ExplorerLocation | null,
  ) {}

  canGoToParent(): boolean {
    return canNavigateToParent(
      this.dependencies.app,
      this.dependencies.getSettings(),
      this.location,
    );
  }

  async goToParent(newLeaf?: boolean): Promise<void> {
    await navigateToParent({
      app: this.dependencies.app,
      settings: this.dependencies.getSettings(),
      location: this.location,
      newLeaf,
      savePluginSettings: this.dependencies.saveSettings,
    });
  }
}
