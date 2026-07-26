import type { BlockSettings } from "../settings";
import { serializeSettings } from "../settings";

export function formatExplorerBlock(
  settings: BlockSettings,
  defaultSettings: BlockSettings,
): string {
  const yaml = serializeSettings(settings, defaultSettings);
  return yaml ? `\`\`\`explorer\n${yaml}\n\`\`\`` : "```explorer\n```";
}
