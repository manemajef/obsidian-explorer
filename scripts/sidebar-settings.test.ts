import { describe, expect, it } from "vitest";
import { normalizePluginSettings } from "../src/explorer/settings";

describe("sidebar folder-page settings", () => {
  it("enables folder pages for fresh installs", () => {
    const settings = normalizePluginSettings(null);

    expect(settings.openFolderViewFromSidebar).toBe(true);
    expect(settings).not.toHaveProperty("hideFolderNotesInFileExplorer");
  });

  it.each([true, false])(
    "preserves navigation=%s when the removed hiding preference conflicts",
    (enabled) => {
      const settings = normalizePluginSettings({
        openFolderViewFromSidebar: enabled,
        hideFolderNotesInFileExplorer: !enabled,
      });

      expect(settings.openFolderViewFromSidebar).toBe(enabled);
      expect(settings).not.toHaveProperty("hideFolderNotesInFileExplorer");
    },
  );

  it.each([
    ["nothing", false],
    ["virtual", true],
    ["existing", true],
  ])("migrates legacy sidebar behavior %s", (behavior, enabled) => {
    const settings = normalizePluginSettings({
      sidebarFolderClickBehavior: behavior,
    });

    expect(settings.openFolderViewFromSidebar).toBe(enabled);
  });

  it("prefers the saved navigation setting over its predecessor", () => {
    const settings = normalizePluginSettings({
      openFolderViewFromSidebar: false,
      sidebarFolderClickBehavior: "virtual",
    });

    expect(settings.openFolderViewFromSidebar).toBe(false);
  });
});
