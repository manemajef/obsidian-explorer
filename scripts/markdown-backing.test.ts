import { describe, expect, it } from "vitest";
import {
  completeAddMarkdownBacking,
  completeRemoveMarkdownBacking,
} from "../src/explorer/domain/folder-page";
import {
  executeAddMarkdownBacking,
  executeRemoveMarkdownBacking,
} from "../src/explorer/domain/markdown-backing-transition";

describe("Markdown backing lifecycle", () => {
  it("plans store cleanup only after a successful add write", () => {
    expect(completeAddMarkdownBacking(null)).toBeNull();
    expect(completeAddMarkdownBacking("Projects.md")).toEqual({
      file: "Projects.md",
      deleteStoredOverrides: true,
    });
  });

  it("plans store persistence only after successful deletion", () => {
    expect(completeRemoveMarkdownBacking(false)).toBeNull();
    expect(completeRemoveMarkdownBacking(true)).toEqual({
      storeOverrides: true,
      openFileFree: true,
    });
  });

  it("deletes stored overrides and opens only after a successful write", async () => {
    const events: string[] = [];

    await executeAddMarkdownBacking({
      confirmWrite: async () => {
        events.push("confirm");
        return true;
      },
      writeMarkdown: async () => {
        events.push("write");
        return "Projects.md";
      },
      deleteStoredOverrides: () => events.push("delete-store"),
      openMarkdown: async (file) => {
        events.push(`open:${file}`);
      },
    });

    expect(events).toEqual([
      "confirm",
      "write",
      "delete-store",
      "open:Projects.md",
    ]);
  });

  it.each([
    { confirmed: false, file: "Projects.md" },
    { confirmed: true, file: null },
  ])(
    "preserves the store and current page when add does not complete",
    async ({ confirmed, file }) => {
      const events: string[] = [];

      await executeAddMarkdownBacking({
        confirmWrite: async () => confirmed,
        writeMarkdown: async () => {
          events.push("write");
          return file;
        },
        deleteStoredOverrides: () => events.push("delete-store"),
        openMarkdown: async () => {
          events.push("open");
        },
      });

      expect(events).toEqual(confirmed ? ["write"] : []);
    },
  );

  it("stores overrides and opens file-free only after successful deletion", async () => {
    const events: string[] = [];

    await executeRemoveMarkdownBacking({
      confirmDelete: async () => {
        events.push("confirm");
        return true;
      },
      deleteMarkdown: async () => {
        events.push("delete-file");
        return true;
      },
      storeOverrides: () => events.push("store"),
      openFileFree: async () => {
        events.push("open-file-free");
      },
    });

    expect(events).toEqual([
      "confirm",
      "delete-file",
      "store",
      "open-file-free",
    ]);
  });

  it.each([
    { confirmed: false, deleted: true },
    { confirmed: true, deleted: false },
  ])(
    "preserves the file and store when remove does not complete",
    async ({ confirmed, deleted }) => {
      const events: string[] = [];

      await executeRemoveMarkdownBacking({
        confirmDelete: async () => confirmed,
        deleteMarkdown: async () => {
          events.push("delete-file");
          return deleted;
        },
        storeOverrides: () => events.push("store"),
        openFileFree: async () => {
          events.push("open");
        },
      });

      expect(events).toEqual(confirmed ? ["delete-file"] : []);
    },
  );
});
