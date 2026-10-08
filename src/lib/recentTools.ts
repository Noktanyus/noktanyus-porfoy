/**
 * Son kullanılan araçlar — localStorage (istemci).
 */

export const RECENT_TOOLS_KEY = 'noktanyus:recent-tools';
export const RECENT_TOOLS_LIMIT = 4;

export interface RecentToolRef {
  slug: string;
  title: string;
  visitedAt: number;
}

export function readRecentTools(): RecentToolRef[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_TOOLS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentToolRef[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t.slug === 'string' && typeof t.title === 'string')
      .slice(0, RECENT_TOOLS_LIMIT);
  } catch {
    return [];
  }
}

export function pushRecentTool(tool: { slug: string; title: string }): void {
  if (typeof window === 'undefined') return;
  try {
    const prev = readRecentTools().filter((t) => t.slug !== tool.slug);
    const next: RecentToolRef[] = [
      { slug: tool.slug, title: tool.title, visitedAt: Date.now() },
      ...prev,
    ].slice(0, RECENT_TOOLS_LIMIT);
    window.localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(next));
  } catch {
    // private mode / quota — sessizce yoksay
  }
}
