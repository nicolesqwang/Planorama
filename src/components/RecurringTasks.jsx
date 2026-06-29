import { useState } from "react";
import { localDateStr } from "../dateUtils";
import { LENGTH_OPTIONS, FREQUENCY_OPTIONS, occurrenceCount, RecurrencePicker } from "../recurrence";

const lora = { fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 };

function CategoryPill({ cat, categories }) {
  const s = categories.find(c => c.name === cat) || { bg: "var(--t-bg-input)", text: "var(--t-text-med)", border: "var(--t-border)" };
  return (
    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{cat}</span>
  );
}

function freqLabel(days) {
  const preset = FREQUENCY_OPTIONS.find(o => o.days === days);
  if (preset) return preset.label;
  if (days === 7) return "Once a week";
  return `Every ${days} days`;
}

// ── Edit Modal ─────────────────────────────────────────────────
function RecurringTaskEditModal({ dt, instances, completedCount, totalOccurrences, categories, onSave, onDelete, onClose }) {
  const [name, setName]       = useState(dt.name);
  const [selCat, setSelCat]   = useState(dt.category || "");
  const [endDate, setEndDate] = useState(dt.end_date);
  const [notes, setNotes]     = useState(() => instances[0]?.notes || "");
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]     = useState(null);

  const canSave = name.trim() && endDate >= dt.start_date;

  const endDateChanged = endDate !== dt.end_date;
  const endDateHint = endDateChanged
    ? endDate < dt.end_date
      ? "Instances after the new end date will be removed."
      : "New check-ins will be scheduled up to the new end date."
    : null;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(dt.id, { name: name.trim(), category: selCat || null, endDate, notes });
      onClose();
    } catch (err) {
      setSaving(false);
      setError(err.message || "Failed to save. Please try again.");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await onDelete(dt.id);
      onClose();
    } catch (err) {
      setDeleting(false);
      setError(err.message || "Failed to delete. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--t-bg-card)] border border-[var(--t-border)] rounded-2xl shadow-xl w-[500px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--t-text-muted)] hover:text-[var(--t-text-dark)] text-xl">✕</button>
        <h2 style={lora} className="text-xl text-[var(--t-text-dark)] mb-0.5">Edit Recurring Task</h2>
        <p className="text-[11px] text-[var(--t-text-muted)] mb-5">
          {completedCount} / {totalOccurrences} check-ins completed · {freqLabel(dt.frequency_days || 1).toLowerCase()} · started {new Date(dt.start_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Task Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)]" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">
              Category <span className="normal-case font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 && <p className="text-xs text-[var(--t-text-muted)]">No categories yet.</p>}
              {categories.map(c => (
                <button key={c.name} onClick={() => setSelCat(s => s === c.name ? "" : c.name)}
                  className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
                  style={selCat === c.name
                    ? { background: c.bg, color: c.text, borderColor: c.border }
                    : { background: "var(--t-bg-input)", color: "var(--t-text-med)", borderColor: "var(--t-border)" }}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">End Date</label>
            <input type="date" value={endDate} min={dt.start_date} onChange={e => setEndDate(e.target.value)}
              className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)]" />
            {endDateHint && (
              <p className="text-[11px] text-[var(--t-text-muted)] mt-1">{endDateHint}</p>
            )}
            <p className="text-[11px] text-[var(--t-text-muted)] mt-1">
              How often this repeats can&apos;t be changed after creation — delete and recreate it to change frequency.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">
              Notes <span className="normal-case font-normal">(applied to all instances)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes..."
              className="w-full h-20 text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)] placeholder:text-[var(--t-text-muted)]" />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        )}

        {!confirmDelete ? (
          <div className="flex gap-2 mt-5">
            <button onClick={() => setConfirmDelete(true)}
              className="bg-[var(--t-bg-input)] hover:bg-red-50 border border-[var(--t-border)] hover:border-red-200 text-red-400 hover:text-red-500 text-sm font-semibold py-2 px-3 rounded-xl transition-colors">
              Delete Series
            </button>
            <button onClick={onClose}
              className="flex-1 bg-[var(--t-bg-input)] hover:bg-[var(--t-bg-accent)] border border-[var(--t-border)] text-[var(--t-text-dark)] text-sm font-semibold py-2 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!canSave || saving}
              className="flex-grow bg-[var(--t-primary)] hover:bg-[var(--t-primary-hover)] disabled:opacity-40 text-[var(--t-on-primary)] text-sm font-semibold py-2 rounded-xl transition-colors">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : (
          <div className="mt-5 bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--t-text-dark)] font-medium mb-1">Delete this entire series?</p>
            <p className="text-xs text-[var(--t-text-muted)] mb-3">This removes the recurring task and all its instances from your task list. Cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 text-sm border border-[var(--t-border)] text-[var(--t-text-med)] py-2 rounded-xl hover:bg-[var(--t-bg-accent)] transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 text-sm text-white bg-red-400 hover:bg-red-500 disabled:opacity-40 py-2 rounded-xl transition-colors">
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Modal ──────────────────────────────────────────────────
function AddRecurringModal({ onClose, onAdd, categories }) {
  const [name, setName] = useState("");
  const [selCat, setSelCat] = useState("");
  const [lengthDays, setLengthDays] = useState(7);
  const [frequencyDays, setFrequencyDays] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const canSubmit = name.trim() && lengthDays >= 1 && frequencyDays >= 1;
  const occurrences = occurrenceCount(lengthDays, frequencyDays);

  const endPreview = lengthDays >= 1 ? (() => {
    const d = new Date();
    d.setDate(d.getDate() + lengthDays - 1);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  })() : "";

  async function handleSubmit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await onAdd({ name: name.trim(), category: selCat || null, lengthDays, frequencyDays });
      onClose();
    } catch (err) {
      setSaving(false);
      setSubmitError(err.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--t-bg-card)] border border-[var(--t-border)] rounded-2xl shadow-xl w-[500px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--t-text-muted)] hover:text-[var(--t-text-dark)] text-xl">✕</button>
        <h2 style={lora} className="text-xl text-[var(--t-text-dark)] mb-5">Add Recurring Task</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Task Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning workout"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)] placeholder:text-[var(--t-text-muted)]" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <RecurrencePicker label="How long?" options={LENGTH_OPTIONS} value={lengthDays} onChange={setLengthDays} unitWord="day" />
            </div>
            <div className="flex-1">
              <RecurrencePicker label="How often?" options={FREQUENCY_OPTIONS} value={frequencyDays} onChange={setFrequencyDays} unitWord="day" />
            </div>
          </div>
          {endPreview && (
            <p className="text-[11px] text-[var(--t-text-muted)] -mt-1">
              Starts today · ends {endPreview} · {occurrences} check-in{occurrences !== 1 ? "s" : ""}
            </p>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">
              Category <span className="normal-case font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 && (
                <p className="text-xs text-[var(--t-text-muted)]">No categories yet — add some in Tasks → Manage first!</p>
              )}
              {categories.map(c => (
                <button key={c.name} onClick={() => setSelCat(s => s === c.name ? "" : c.name)}
                  className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
                  style={selCat === c.name
                    ? { background: c.bg, color: c.text, borderColor: c.border }
                    : { background: "var(--t-bg-input)", color: "var(--t-text-med)", borderColor: "var(--t-border)" }}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        {submitError && (
          <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{submitError}</p>
        )}
        <button onClick={handleSubmit} disabled={!canSubmit || saving}
          className="mt-3 w-full bg-[var(--t-primary)] hover:bg-[var(--t-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--t-on-primary)] text-sm font-semibold py-2.5 rounded-xl transition-colors">
          {saving ? "Creating..." : "Add Recurring Task"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function RecurringTasks({
  dailyTasks, dailyTaskCompletions, dailyTaskInstances,
  categories, onAddDailyTask, onToggleCompletion,
  onUpdateDailyTask, onDeleteDailyTask,
}) {
  const [showAdd, setShowAdd]     = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedDt, setSelectedDt]    = useState(null);

  const todayStr = localDateStr();
  const completedTodaySet = new Set(
    dailyTaskCompletions.filter(c => c.completed_date === todayStr).map(c => c.daily_task_id)
  );
  // Whether each recurring task actually has a check-in scheduled today —
  // with frequency >1 (e.g. weekly), most days aren't scheduled at all.
  const scheduledTodaySet = new Set(
    dailyTaskInstances.filter(t => t.due_date === todayStr).map(t => t.daily_task_id)
  );

  const active   = dailyTasks.filter(dt => dt.end_date >= todayStr);
  const archived = dailyTasks.filter(dt => dt.end_date < todayStr);

  function completedCount(dtId) {
    return dailyTaskCompletions.filter(c => c.daily_task_id === dtId).length;
  }

  // "Day X of Y" is occurrence-based, not calendar-day-based — once a week
  // for a month is "day 1 of 4", not "day 1 of 28".
  function totalOccurrences(dt) {
    const start = new Date(dt.start_date + "T00:00:00");
    const end   = new Date(dt.end_date   + "T00:00:00");
    const spanDays = Math.round((end - start) / 86400000);
    const freq = dt.frequency_days || 1;
    return Math.floor(spanDays / freq) + 1;
  }

  function currentOccurrence(dt) {
    const start = new Date(dt.start_date + "T00:00:00");
    const today = new Date(todayStr + "T00:00:00");
    const freq = dt.frequency_days || 1;
    const daysSinceStart = Math.max(0, Math.round((today - start) / 86400000));
    return Math.min(Math.floor(daysSinceStart / freq) + 1, totalOccurrences(dt));
  }

  function fmtDate(s) {
    return new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen relative">
      <div className="aura aura-sage" style={{ width: 240, height: 240, top: -40, right: 50 }} />
      <div className="aura aura-rose" style={{ width: 220, height: 220, bottom: 60, left: -30 }} />
      <div className="max-w-2xl mx-auto px-6 py-10 relative z-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "var(--sage-deep)" }}>{todayLabel}</p>
            <h1 style={lora} className="text-[44px] text-[var(--t-text-dark)] leading-tight">Recurring Tasks <span style={{ color: "var(--rose)" }}>❀</span></h1>
            <p className="text-[12px] font-semibold mt-1" style={{ color: "var(--t-text-muted)" }}>tiny habits, on your own schedule ♡</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all mt-2 glow-rose"
            style={{ background: "var(--rose)", color: "#fff" }}>
            + Add Recurring Task
          </button>
        </div>

        {/* Active tasks */}
        <div className="flex flex-col gap-3">
          {active.length === 0 && (
            <div className="rounded-2xl border border-dashed px-6 py-16 text-center" style={{ background: "var(--surface)", borderColor: "var(--border-sage)" }}>
              <p className="text-3xl mb-2" style={{ color: "var(--sage)" }}>❀</p>
              <p className="text-sm font-semibold" style={{ color: "var(--t-text-muted)" }}>no streaks yet ✿ plant one above to get started!</p>
            </div>
          )}
          {active.map(dt => {
            const total       = totalOccurrences(dt);
            const done        = completedCount(dt.id);
            const pct         = total > 0 ? Math.min(done / total, 1) : 0;
            const checkedToday = completedTodaySet.has(dt.id);
            const scheduledToday = scheduledTodaySet.has(dt.id);
            const occNum      = currentOccurrence(dt);

            return (
              <div key={dt.id}
                className="rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-transform cursor-pointer glow-soft flex items-stretch"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                onClick={() => setSelectedDt(dt)}>
                <div className="w-1.5 flex-shrink-0" style={{ background: checkedToday ? "var(--sage)" : scheduledToday ? "var(--rose)" : "var(--border)" }} />
                <div className="px-5 py-4 flex items-start gap-4 flex-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base font-bold text-[var(--t-text-dark)]">{dt.name}</span>
                      {dt.category && <CategoryPill cat={dt.category} categories={categories} />}
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--sage-soft)", color: "var(--sage-deep)" }}>
                        {freqLabel(dt.frequency_days || 1)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: "var(--sage-soft)" }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ background: "linear-gradient(90deg, var(--sage), var(--rose))", width: `${pct * 100}%` }} />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold flex-wrap" style={{ color: "var(--t-text-muted)" }}>
                      <span style={{ color: "var(--rose-deep)" }}>Day {occNum} of {total}</span>
                      <span>·</span>
                      <span>{done} / {total} done</span>
                      <span>·</span>
                      <span>until {fmtDate(dt.end_date)}</span>
                    </div>
                  </div>
                  {/* Checkbox — stopPropagation so clicking it doesn't open the edit modal */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5"
                    onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={checkedToday} disabled={!scheduledToday}
                      onChange={() => scheduledToday && onToggleCompletion(dt.id)}
                      className="kawaii-checkbox"
                      style={{ width: "22px", height: "22px", opacity: checkedToday ? 0.7 : scheduledToday ? 1 : 0.35 }} />
                    <span className="text-[9px] font-bold" style={{ color: scheduledToday ? "var(--sage-deep)" : "var(--t-text-muted)" }}>
                      {scheduledToday ? "today" : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Archived / completed streaks */}
        {archived.length > 0 && (
          <div className="mt-8">
            <button onClick={() => setShowArchived(s => !s)}
              className="flex items-center gap-1.5 text-xs text-[var(--t-text-muted)] hover:text-[var(--t-rose-ink)] transition-colors font-medium mb-3">
              <span className="text-[10px]">{showArchived ? "▾" : "▸"}</span>
              Completed streaks · {archived.length}
            </button>
            {showArchived && (
              <div className="flex flex-col gap-2">
                {archived.map(dt => {
                  const total = totalOccurrences(dt);
                  const done  = completedCount(dt.id);
                  const pct   = total > 0 ? Math.min(done / total, 1) : 0;
                  return (
                    <div key={dt.id}
                      className="bg-[var(--t-bg-card)]/60 border border-[var(--t-border)] rounded-2xl overflow-hidden opacity-55 hover:opacity-75 cursor-pointer transition-opacity"
                      onClick={() => setSelectedDt(dt)}>
                      <div className="px-5 py-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-medium line-through text-[var(--t-text-muted)]">{dt.name}</span>
                          {dt.category && <CategoryPill cat={dt.category} categories={categories} />}
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "var(--t-bg-accent)" }}>
                          <div className="h-full rounded-full" style={{ background: "var(--t-primary)", width: `${pct * 100}%` }} />
                        </div>
                        <span className="text-[11px] text-[var(--t-text-muted)]">
                          {done} / {total} check-ins · ended {fmtDate(dt.end_date)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <AddRecurringModal
          onClose={() => setShowAdd(false)}
          onAdd={onAddDailyTask}
          categories={categories}
        />
      )}

      {selectedDt && (
        <RecurringTaskEditModal
          dt={selectedDt}
          instances={dailyTaskInstances.filter(t => t.daily_task_id === selectedDt.id)}
          completedCount={completedCount(selectedDt.id)}
          totalOccurrences={totalOccurrences(selectedDt)}
          categories={categories}
          onSave={onUpdateDailyTask}
          onDelete={onDeleteDailyTask}
          onClose={() => setSelectedDt(null)}
        />
      )}
    </div>
  );
}
