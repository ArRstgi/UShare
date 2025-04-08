/** Full timestamp formatting */
/**
 * Formats a Unix timestamp (milliseconds) into a simple "Date, HH:MM" string
 * using a 24-hour clock.
 * @param ts - The timestamp in milliseconds.
 * @returns Formatted date and time string (e.g., "10/28/2024, 14:30").
 */
export function formatTimestamp(ts: number): string {
  const date = new Date(ts);

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  const dateStr = date.toLocaleDateString("en-US", dateOptions);
  const timeStr = date.toLocaleTimeString("en-US", timeOptions);

  return `${dateStr}, ${timeStr}`;
}

/** File icon retrieval */
export function getFileIcon(type?: string): string {
  if (!type) return "📄";
  if (type.startsWith("image/")) return "🖼️";
  if (type === "application/pdf") return "📜";
  if (type.includes("word")) return "📝";
  if (type.includes("excel") || type.includes("spreadsheet")) return "📊";
  return "📄";
}
