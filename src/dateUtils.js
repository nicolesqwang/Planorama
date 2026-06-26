// Local calendar-day date string (YYYY-MM-DD). Deliberately NOT Date#toISOString(),
// which returns the UTC date — near midnight that's a different calendar day than
// the user's actual local "today", which caused tasks to land in the wrong
// due-date bucket relative to the (correctly local-time) remaining-time display.
export function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
