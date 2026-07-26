export type ParentFolder<TFolder> = {
  name: string;
  parent: TFolder | null;
  isRoot: () => boolean;
};

export type ParentLocation<TFolder extends ParentFolder<TFolder>> = {
  folder: TFolder;
  path: string;
  file: {
    basename: string;
    parent: { name: string } | null;
  } | null;
};

export type ParentDestination<TFolder extends ParentFolder<TFolder>> =
  | { kind: "folder"; folder: TFolder }
  | { kind: "homepage" }
  | null;

export function resolveParentDestination<TFolder extends ParentFolder<TFolder>>(
  location: ParentLocation<TFolder> | null,
  homePath: string | null,
): ParentDestination<TFolder> {
  if (!location || (homePath && location.path === homePath)) return null;

  const representsFolder =
    !location.file ||
    (location.file.parent !== null &&
      location.file.basename === location.file.parent.name);
  const parent = representsFolder ? location.folder.parent : location.folder;

  if (!parent || parent.isRoot()) {
    return homePath ? { kind: "homepage" } : null;
  }
  return { kind: "folder", folder: parent };
}

export function resolveParentNewLeaf(
  newLeaf: boolean | undefined,
  defaultNewLeaf: boolean,
): boolean {
  return newLeaf ?? defaultNewLeaf;
}
