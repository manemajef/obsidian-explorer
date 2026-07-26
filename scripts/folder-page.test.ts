import { describe, expect, it } from "vitest";
import {
  completeFolderPage,
  resolveFolderPageBacking,
  type FolderPageOpenIntent,
} from "../src/explorer/domain/folder-page";
import {
  executeOpenFolderPage,
  type MarkdownFolderPagePresentation,
} from "../src/explorer/domain/folder-page-opening";
import type { MissingFolderNoteBehavior } from "../src/explorer/settings";

function resolve(
  missingBehavior: MissingFolderNoteBehavior,
  intent: FolderPageOpenIntent,
  existing: string | null = null,
) {
  return resolveFolderPageBacking({
    existing,
    missingBehavior,
    intent,
  });
}

describe("folder page backing", () => {
  it.each<FolderPageOpenIntent>([
    "navigate",
    "explicit",
    "save",
    "sidebar",
    "created-folder",
  ])("keeps existing Markdown backing for %s", (intent) => {
    expect(resolve("manual", intent, "Projects.md")).toEqual({
      kind: "markdown",
      file: "Projects.md",
    });
  });

  it.each([
    ["manual", "navigate", "file-free"],
    ["manual", "explicit", "file-free"],
    ["manual", "save", "create-markdown"],
    ["smart", "navigate", "file-free"],
    ["smart", "explicit", "create-markdown"],
    ["smart", "save", "create-markdown"],
    ["create", "navigate", "create-markdown"],
    ["create", "explicit", "create-markdown"],
    ["create", "save", "create-markdown"],
  ] as const)(
    "resolves %s plus %s to %s",
    (missingBehavior, intent, expectedKind) => {
      expect(resolve(missingBehavior, intent).kind).toBe(expectedKind);
    },
  );

  it.each<MissingFolderNoteBehavior>(["manual", "smart", "create"])(
    "keeps sidebar and newly-created file-free flows file-free under %s",
    (missingBehavior) => {
      expect(resolve(missingBehavior, "sidebar").kind).toBe("file-free");
      expect(resolve(missingBehavior, "created-folder").kind).toBe(
        "file-free",
      );
    },
  );

  it("does not fall back when Markdown creation is cancelled or fails", () => {
    const plan = resolve("create", "navigate");

    expect(completeFolderPage("Projects", plan, null)).toBeNull();
  });

  it("completes created and file-free pages without changing identity", () => {
    expect(
      completeFolderPage(
        "Projects",
        resolve("manual", "navigate"),
        null,
      ),
    ).toEqual({
      folder: "Projects",
      backing: { kind: "file-free" },
    });
    expect(
      completeFolderPage(
        "Projects",
        resolve("create", "navigate"),
        "Projects.md",
      ),
    ).toEqual({
      folder: "Projects",
      backing: { kind: "markdown", file: "Projects.md" },
    });
  });
});

type RecordedOpen =
  | { kind: "homepage"; sourcePath: string; newLeaf: boolean }
  | {
      kind: "markdown";
      file: string;
      presentation: MarkdownFolderPagePresentation;
    }
  | { kind: "file-free"; folder: string; newLeaf: boolean };

function createOpenRecorder(input: {
  existing?: string | null;
  created?: string | null;
}) {
  const opens: RecordedOpen[] = [];
  let createCount = 0;

  return {
    opens,
    get createCount() {
      return createCount;
    },
    effects: {
      openHomepage: async (sourcePath: string, newLeaf: boolean) => {
        opens.push({ kind: "homepage", sourcePath, newLeaf });
      },
      findMarkdown: () => input.existing ?? null,
      createMarkdown: async () => {
        createCount += 1;
        return input.created ?? null;
      },
      openMarkdown: async (
        file: string,
        presentation: MarkdownFolderPagePresentation,
      ) => {
        opens.push({ kind: "markdown", file, presentation });
      },
      openFileFree: async (folder: string, newLeaf: boolean) => {
        opens.push({ kind: "file-free", folder, newLeaf });
      },
    },
  };
}

describe("folder page opening orchestration", () => {
  it("delegates root opening with source path and leaf selection", async () => {
    const recorder = createOpenRecorder({ existing: "ignored.md" });

    await executeOpenFolderPage({
      folder: "Vault",
      isRoot: true,
      missingBehavior: "create",
      forceReadingMode: true,
      sourcePath: "Notes/Source.md",
      request: { newLeaf: true },
      effects: recorder.effects,
    });

    expect(recorder.opens).toEqual([
      {
        kind: "homepage",
        sourcePath: "Notes/Source.md",
        newLeaf: true,
      },
    ]);
    expect(recorder.createCount).toBe(0);
  });

  it("opens ordinary Markdown backing with pending and reading-mode policy", async () => {
    const recorder = createOpenRecorder({ existing: "Projects.md" });

    await executeOpenFolderPage({
      folder: "Projects",
      isRoot: false,
      missingBehavior: "manual",
      forceReadingMode: true,
      sourcePath: "Notes/Source.md",
      request: { newLeaf: true, intent: "explicit" },
      effects: recorder.effects,
    });

    expect(recorder.opens).toEqual([
      {
        kind: "markdown",
        file: "Projects.md",
        presentation: {
          method: "link",
          sourcePath: "Notes/Source.md",
          newLeaf: true,
          markNavigationPending: true,
          forceReadingMode: true,
        },
      },
    ]);
  });

  it("preserves native-sidebar Markdown presentation", async () => {
    const recorder = createOpenRecorder({ existing: "Projects.md" });

    await executeOpenFolderPage({
      folder: "Projects",
      isRoot: false,
      missingBehavior: "create",
      forceReadingMode: true,
      sourcePath: "ignored.md",
      request: { newLeaf: true, intent: "sidebar" },
      effects: recorder.effects,
    });

    expect(recorder.opens).toEqual([
      {
        kind: "markdown",
        file: "Projects.md",
        presentation: {
          method: "link",
          sourcePath: "",
          newLeaf: true,
          markNavigationPending: false,
          forceReadingMode: false,
        },
      },
    ]);
  });

  it("routes a newly created Markdown-backed folder through file opening", async () => {
    const recorder = createOpenRecorder({ existing: "Projects.md" });

    await executeOpenFolderPage({
      folder: "Projects",
      isRoot: false,
      missingBehavior: "create",
      forceReadingMode: true,
      sourcePath: "Notes/Source.md",
      request: { intent: "created-folder" },
      effects: recorder.effects,
    });

    expect(recorder.opens).toEqual([
      {
        kind: "markdown",
        file: "Projects.md",
        presentation: {
          method: "file",
          sourcePath: "",
          newLeaf: false,
          markNavigationPending: false,
          forceReadingMode: false,
        },
      },
    ]);
  });

  it("stops after cancelled or failed Markdown creation", async () => {
    const recorder = createOpenRecorder({ created: null });

    await executeOpenFolderPage({
      folder: "Projects",
      isRoot: false,
      missingBehavior: "create",
      forceReadingMode: false,
      sourcePath: "",
      effects: recorder.effects,
    });

    expect(recorder.createCount).toBe(1);
    expect(recorder.opens).toEqual([]);
  });

  it("opens created Markdown with the requested source and leaf", async () => {
    const recorder = createOpenRecorder({ created: "Projects.md" });

    await executeOpenFolderPage({
      folder: "Projects",
      isRoot: false,
      missingBehavior: "smart",
      forceReadingMode: false,
      sourcePath: "Notes/Source.md",
      request: { newLeaf: true, intent: "explicit" },
      effects: recorder.effects,
    });

    expect(recorder.createCount).toBe(1);
    expect(recorder.opens).toEqual([
      {
        kind: "markdown",
        file: "Projects.md",
        presentation: {
          method: "link",
          sourcePath: "Notes/Source.md",
          newLeaf: true,
          markNavigationPending: true,
          forceReadingMode: false,
        },
      },
    ]);
  });

  it("opens a missing manual folder as file-free without prompting", async () => {
    const recorder = createOpenRecorder({});

    await executeOpenFolderPage({
      folder: "Projects",
      isRoot: false,
      missingBehavior: "manual",
      forceReadingMode: true,
      sourcePath: "Notes/Source.md",
      request: { newLeaf: true },
      effects: recorder.effects,
    });

    expect(recorder.createCount).toBe(0);
    expect(recorder.opens).toEqual([
      { kind: "file-free", folder: "Projects", newLeaf: true },
    ]);
  });
});
