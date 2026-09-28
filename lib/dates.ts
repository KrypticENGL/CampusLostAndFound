const DAY_MS = 86_400_000;

/** "YYYY-MM-DD" → Date at 12:00 UTC so the calendar day never shifts across time zones. */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

export function toDateInputValue(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(a: Date | string, b: Date | string): number {
  return Math.round(Math.abs(new Date(a).getTime() - new Date(b).getTime()) / DAY_MS);
}

export function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatRelative(value: Date | string): string {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}
