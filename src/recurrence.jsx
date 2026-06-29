import { useState } from "react";

// Shared between TaskList's "make this recurring" toggle and the dedicated
// Recurring Tasks page, so both use the exact same length/frequency picker.

export const LENGTH_OPTIONS = [
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 28 },
  { label: "6 months", days: 182 },
  { label: "1 year", days: 364 },
];

export const FREQUENCY_OPTIONS = [
  { label: "Every day", days: 1 },
  { label: "Every other day", days: 2 },
  { label: "Once a week", days: 7 },
];

// "Day 1 of N" math: how many check-ins a {lengthDays, frequencyDays}
// combo produces in total — e.g. once a week for 28 days = 4.
export function occurrenceCount(lengthDays, frequencyDays) {
  if (!lengthDays || !frequencyDays || lengthDays < 1 || frequencyDays < 1) return 0;
  return Math.floor((lengthDays - 1) / frequencyDays) + 1;
}

// A button that shows the current length/frequency selection; clicking opens
// a small dropdown of presets plus a "custom number of days" input.
export function RecurrencePicker({ label, options, value, onChange, unitWord = "day" }) {
  const [open, setOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const preset = options.find(o => o.days === value);

  return (
    <div className="relative">
      <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">{label}</label>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)]">
        <span>{preset ? preset.label : (value ? `Every ${value} ${unitWord}${value === 1 ? "" : "s"}` : "Choose…")}</span>
        <span style={{ color: "var(--t-text-muted)" }}>▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 p-2 rounded-2xl shadow-xl w-full"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {options.map(o => (
            <button key={o.label} type="button"
              onClick={() => { onChange(o.days); setOpen(false); }}
              className="w-full text-left text-sm px-3 py-2 rounded-xl transition-all"
              style={value === o.days ? { background: "var(--rose-soft)", color: "var(--rose-deep)", fontWeight: 700 } : { color: "var(--t-text-dark)" }}>
              {o.label}
            </button>
          ))}
          <div className="px-3 pt-2 pb-1 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
            <label className="text-[10px] font-bold uppercase tracking-[0.7px]" style={{ color: "var(--t-text-muted)" }}>Custom ({unitWord}s)</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="number" min="1" max="3650" value={customDraft}
                onChange={e => setCustomDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key !== "Enter") return;
                  const n = parseInt(customDraft, 10);
                  if (n >= 1) { onChange(n); setOpen(false); }
                }}
                placeholder="e.g. 10"
                className="w-full text-sm bg-[var(--t-bg-card)] border border-[var(--t-border)] rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)] placeholder:text-[var(--t-text-muted)]" />
              <button type="button" onClick={() => { const n = parseInt(customDraft, 10); if (n >= 1) { onChange(n); setOpen(false); } }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: "var(--rose)", color: "#fff" }}>
                Use
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
