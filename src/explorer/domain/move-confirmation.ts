export async function executeMoveIntoFolder(effects: {
  confirmMove: () => Promise<boolean>;
  move: () => Promise<boolean>;
}): Promise<boolean> {
  if (!(await effects.confirmMove())) return false;
  return effects.move();
}
