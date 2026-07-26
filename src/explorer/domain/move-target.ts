export type MoveTarget = {
  path: string;
};

export type MovableEntry = MoveTarget & {
  parent: MoveTarget | null;
  isFolder: boolean;
};

export function canMoveIntoFolder(
  source: MovableEntry,
  target: MoveTarget,
): boolean {
  if (source.parent?.path === target.path) return false;
  if (!source.isFolder) return true;

  return (
    source.path !== target.path && !target.path.startsWith(`${source.path}/`)
  );
}
