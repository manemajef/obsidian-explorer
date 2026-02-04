import { BlockSettings, resolveBlockSettings } from "../settings/schema";

export function resolveEffectiveSettings(
  defaultBlockSettings: BlockSettings,
  blockSettings: Partial<BlockSettings>,
): BlockSettings {
  return resolveBlockSettings(defaultBlockSettings, blockSettings);
}
