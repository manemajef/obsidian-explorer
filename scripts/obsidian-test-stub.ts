export class TFile {}

export class TFolder {}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
}
