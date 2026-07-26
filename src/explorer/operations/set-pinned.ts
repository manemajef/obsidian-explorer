import type { App, TFile } from "obsidian";
import { isPinned, resolvePinChange } from "../domain/pin";
import { setPinnedState as writePinnedState } from "../vault/pin-frontmatter";

export async function setPinned(input: {
  app: App;
  file: TFile;
  pinned: boolean;
}): Promise<boolean> {
  const nextPinned = resolvePinChange(
    isPinned(input.app, input.file),
    input.pinned,
  );
  if (nextPinned === null) return false;
  await writePinnedState(input.app, input.file, nextPinned);
  return true;
}
