import { describe, expect, it } from "vitest";
import {
  DEFAULT_BLOCK_SETTINGS,
  getBlockSettingsOverrides,
  resolveBlockSettings,
} from "../src/explorer/settings";
import { HOME_PAGE_OVERRIDES } from "../src/explorer/domain/homepage";

describe("homepage file-free settings persistence", () => {
  const globalDefaults = DEFAULT_BLOCK_SETTINGS;
  const homepageBaseDefaults = {
    ...globalDefaults,
    ...HOME_PAGE_OVERRIDES,
  };

  it("diffs setting updates against homepage base defaults, preserving changes matching global defaults", () => {
    // Default global block view is "list", but homepage default is "cards".
    expect(globalDefaults.view).toBe("list");
    expect(homepageBaseDefaults.view).toBe("cards");

    // Setting homepage view to "list" (which matches global default) must produce an explicit override.
    const listSettings = { ...homepageBaseDefaults, view: "list" as const };
    const overrides = getBlockSettingsOverrides(
      listSettings,
      homepageBaseDefaults,
    );

    expect(overrides).toEqual({ view: "list" });
  });

  it("preserves sort order change to global default when diffed against homepage base defaults", () => {
    expect(globalDefaults.sortBy).toBe("oldest");
    expect(homepageBaseDefaults.sortBy).toBe("edited");

    const nameSortSettings = {
      ...homepageBaseDefaults,
      sortBy: "oldest" as const,
    };
    const overrides = getBlockSettingsOverrides(
      nameSortSettings,
      homepageBaseDefaults,
    );

    expect(overrides).toEqual({ sortBy: "oldest" });
  });

  it("omits override when setting matches homepage base defaults", () => {
    const defaultHomepageSettings = { ...homepageBaseDefaults };
    const overrides = getBlockSettingsOverrides(
      defaultHomepageSettings,
      homepageBaseDefaults,
    );

    expect(overrides).toEqual({});
  });

  it("correctly resolves effective settings when loading stored overrides on top of homepage base defaults", () => {
    const storedOverrides = { view: "list" as const, sortBy: "name" as const };
    const effectiveSettings = resolveBlockSettings(
      homepageBaseDefaults,
      storedOverrides,
    );

    expect(effectiveSettings.view).toBe("list");
    expect(effectiveSettings.sortBy).toBe("name");
    expect(effectiveSettings.includeSubfolders).toBe(true);
    expect(effectiveSettings.pageSize).toBe(21);
  });
});
