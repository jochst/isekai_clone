import type { ChatSummary } from "@/types/isekaizero";

/** Chat History → Sort & Filter (chatSettings.history.*). */
export interface HistoryFilter {
  sortBy: "updatedAt" | "createdAt" | "title";
  order: "asc" | "desc";
  period: "all" | "today" | "week" | "month" | "year" | "custom";
  /** YYYY-MM-DD, inclusive (custom period). */
  from?: string;
  to?: string;
}

export const DEFAULT_HISTORY_FILTER: HistoryFilter = { sortBy: "updatedAt", order: "desc", period: "all" };

const DAY = 86_400_000;

/** The earliest and latest last-updated times the period allows. */
function periodRange(filter: HistoryFilter, now: number): [number, number] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  switch (filter.period) {
    case "today":
      return [today.getTime(), Infinity];
    case "week":
      return [now - 7 * DAY, Infinity];
    case "month":
      return [now - 30 * DAY, Infinity];
    case "year":
      return [now - 365 * DAY, Infinity];
    case "custom": {
      const from = filter.from ? new Date(`${filter.from}T00:00:00`).getTime() : -Infinity;
      const to = filter.to ? new Date(`${filter.to}T00:00:00`).getTime() + DAY - 1 : Infinity;
      return [Number.isNaN(from) ? -Infinity : from, Number.isNaN(to) ? Infinity : to];
    }
    default:
      return [-Infinity, Infinity];
  }
}

export function filterHistory(chats: ChatSummary[], filter: HistoryFilter, now: number): ChatSummary[] {
  const [min, max] = periodRange(filter, now);
  const sign = filter.order === "asc" ? 1 : -1;
  return chats
    .filter((c) => c.updatedAt >= min && c.updatedAt <= max)
    .sort((a, b) => sign * (filter.sortBy === "title" ? a.title.localeCompare(b.title) : a[filter.sortBy] - b[filter.sortBy]));
}
