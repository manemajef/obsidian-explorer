import { describe, expect, it } from "vitest";
import {
  type ParentFolder,
  type ParentLocation,
  resolveParentDestination,
  resolveParentNewLeaf,
} from "../src/explorer/lib/parent-navigation";

class TestFolder implements ParentFolder<TestFolder> {
  constructor(
    readonly name: string,
    readonly parent: TestFolder | null,
    private readonly root = false,
  ) {}

  isRoot(): boolean {
    return this.root;
  }
}

function folder(
  name: string,
  parent: TestFolder | null,
  isRoot = false,
): TestFolder {
  return new TestFolder(name, parent, isRoot);
}

function file(
  basename: string,
  parent: TestFolder,
): NonNullable<ParentLocation<TestFolder>["file"]> {
  return { basename, parent };
}

function location(input: {
  folder: TestFolder;
  path: string;
  file: ParentLocation<TestFolder>["file"];
}): ParentLocation<TestFolder> {
  return input;
}

describe("parent navigation resolution", () => {
  const root = folder("", null, true);
  const projects = folder("Projects", root);
  const explorer = folder("Explorer", projects);

  it("opens the containing folder for an ordinary note", () => {
    const current = location({
      folder: explorer,
      path: "Projects/Explorer/Task.md",
      file: file("Task", explorer),
    });

    expect(resolveParentDestination(current, null)).toEqual({
      kind: "folder",
      folder: explorer,
    });
  });

  it("steps above a real folder note", () => {
    const current = location({
      folder: explorer,
      path: "Projects/Explorer/Explorer.md",
      file: file("Explorer", explorer),
    });

    expect(resolveParentDestination(current, null)).toEqual({
      kind: "folder",
      folder: projects,
    });
  });

  it("steps above a virtual folder note", () => {
    const current = location({
      folder: explorer,
      path: "Projects/Explorer/Explorer.md",
      file: null,
    });

    expect(resolveParentDestination(current, null)).toEqual({
      kind: "folder",
      folder: projects,
    });
  });

  it("uses the homepage at the root boundary", () => {
    const current = location({
      folder: projects,
      path: "Projects/Projects.md",
      file: file("Projects", projects),
    });

    expect(resolveParentDestination(current, "Home.md")).toEqual({
      kind: "homepage",
    });
  });

  it("stops at the homepage and without a location", () => {
    const homepage = location({
      folder: root,
      path: "Home.md",
      file: file("Home", root),
    });

    expect(resolveParentDestination(homepage, "Home.md")).toBeNull();
    expect(resolveParentDestination(null, "Home.md")).toBeNull();
  });

  it("uses an explicit new-leaf choice before the plugin default", () => {
    expect(resolveParentNewLeaf(false, true)).toBe(false);
    expect(resolveParentNewLeaf(true, false)).toBe(true);
    expect(resolveParentNewLeaf(undefined, true)).toBe(true);
  });
});
