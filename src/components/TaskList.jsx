import { useState, useEffect, useRef } from "react";
import { localDateStr } from "../dateUtils";
import { LENGTH_OPTIONS, FREQUENCY_OPTIONS, occurrenceCount, RecurrencePicker } from "../recurrence";

const lora = { fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 };

function getTimeLeft(dueDate, dueTime) {
  const now = new Date();
  const due = new Date(`${dueDate}T${dueTime}:00`);
  const diffMs = due - now;
  const diffMins = diffMs / (1000 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffMins > 0 && diffDays < 0.2) {
    return { value: Math.round(diffMins), unit: "min", raw: diffDays };
  }
  return { value: Math.round(diffDays * 10) / 10, unit: "days", raw: diffDays };
}

function getUrgencyStyle(rawDays) {
  if (rawDays < 0)       return "bg-[#FAD4DF] text-[#D4708A] font-semibold";
  if (rawDays <= 1/24)   return "bg-[#FAD4DF] text-[#D4708A] font-semibold";
  if (rawDays <= 5/1440) return "bg-[#FAD4DF] text-[#D4708A] font-semibold";
  if (rawDays <= 1)      return "bg-[#FAD4DF] text-[#D4708A] font-semibold";
  if (rawDays <= 5)      return "bg-[#FEF3C7] text-[#A07B2A] font-semibold";
  return "bg-[#EEF5EA] text-[#5E8F52] font-semibold";
}

// ── On-theme category color catalog (~30 muted combos) ───────────
// All desaturated pastels that sit comfortably with the cream/rose/sage base —
// no super-saturated or super-dark colors.
const CATEGORY_PALETTE = [
  { name: "Blush Rose",  bg: "#F6DCE4", text: "#B5677F", border: "#EFCBD6" },
  { name: "Dusty Pink",  bg: "#F3D3DC", text: "#A85870", border: "#E8B9C6" },
  { name: "Rosewood",    bg: "#EBD8D9", text: "#8C5158", border: "#D9B6B8" },
  { name: "Berry",       bg: "#F2DCE2", text: "#94445D", border: "#E5BAC7" },
  { name: "Soft Coral",  bg: "#FBE0D6", text: "#B5613F", border: "#F0C3AE" },
  { name: "Peach",       bg: "#FCE8D6", text: "#AD7038", border: "#F2D0AE" },
  { name: "Terracotta",  bg: "#F3DACB", text: "#9A5535", border: "#E3BB9D" },
  { name: "Clay",        bg: "#EFDCCF", text: "#85543A", border: "#DDBE9E" },
  { name: "Sand",        bg: "#F1E8D8", text: "#83694D", border: "#DCCBA8" },
  { name: "Latte",       bg: "#EFE5D8", text: "#776048", border: "#D9C7AC" },
  { name: "Butter",      bg: "#FAF0CE", text: "#9C7F2C", border: "#EAD08A" },
  { name: "Honey",       bg: "#F8EBC9", text: "#937526", border: "#E4CB8E" },
  { name: "Cream Gold",  bg: "#F6EEDA", text: "#937C32", border: "#E6D49E" },
  { name: "Soft Yellow", bg: "#FAF0CB", text: "#9C8829", border: "#ECDD92" },
  { name: "Sage",        bg: "#E9ECD9", text: "#6E7B45", border: "#CBD3A8" },
  { name: "Olive",       bg: "#ECEFD9", text: "#697340", border: "#C9D1AC" },
  { name: "Matcha",      bg: "#E5EAD3", text: "#62713B", border: "#C2CE9C" },
  { name: "Apple Green", bg: "#E3EDCB", text: "#59702B", border: "#C3D69B" },
  { name: "Forest Mist", bg: "#DDE7D1", text: "#4B6437", border: "#B9CCA3" },
  { name: "Mint",        bg: "#DCEFE2", text: "#488264", border: "#AFD9C2" },
  { name: "Eucalyptus",  bg: "#DDEAE5", text: "#47766C", border: "#ADD0C6" },
  { name: "Seafoam",     bg: "#D9EDE6", text: "#3B7861", border: "#A9D4C3" },
  { name: "Sky",         bg: "#DCE9F2", text: "#476C8A", border: "#AECBE0" },
  { name: "Powder Blue", bg: "#DCE7EF", text: "#496883", border: "#ADC8DC" },
  { name: "Denim",       bg: "#DEE3EF", text: "#4A5982", border: "#B3C0DE" },
  { name: "Periwinkle",  bg: "#E2E3F4", text: "#555998", border: "#C2C5EA" },
  { name: "Lavender",    bg: "#EBE3F2", text: "#705386", border: "#D4C2E5" },
  { name: "Lilac",       bg: "#F1E4F0", text: "#83497A", border: "#E2C3DD" },
  { name: "Mauve",       bg: "#EADFE6", text: "#705278", border: "#D2BFD9" },
  { name: "Plum",        bg: "#F1E0E8", text: "#85455F", border: "#E1BFCF" },
];

function CategoryPill({ cat, categories }) {
  const s = categories.find(c => c.name === cat) || { bg: "var(--t-bg-input)", text: "var(--t-text-med)", border: "var(--t-border)" };
  return (
    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{cat}</span>
  );
}

// ── Category name + color picker (catalog popover, no color wheel) ──
function ColorPicker({ name, onNameChange, selected, open, onToggle, onSelect }) {
  const p = CATEGORY_PALETTE[selected];
  return (
    <div className="flex items-center gap-2">
      <input value={name} onChange={e => onNameChange(e.target.value)} placeholder="e.g. Biology, Economics, Work"
        className="flex-1 text-sm bg-[var(--t-bg-card)] border border-[var(--t-border)] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)] placeholder:text-[var(--t-text-muted)]" />
      <div className="relative flex-shrink-0">
        <button type="button" onClick={onToggle} title="Choose a color"
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all"
          style={{ background: p.bg, color: p.text, borderColor: p.border }}>
          <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: p.bg, border: `1.5px solid ${p.text}` }} />
          Colors
        </button>
        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-20 p-3 rounded-2xl shadow-xl grid grid-cols-6 gap-2 w-[216px]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {CATEGORY_PALETTE.map((c, i) => (
              <button key={c.name} type="button" title={c.name} onClick={() => { onSelect(i); onToggle(); }}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                style={{ background: c.bg, border: selected === i ? `2.5px solid ${c.text}` : `1.5px solid ${c.border}` }}>
                {selected === i && <span style={{ color: c.text, fontSize: "10px", fontWeight: 700 }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ManageModal({ categories, addCategory, removeCategory, updateCategory, taskTypes, addTaskType, removeTaskType, onClose }) {
  const [tab, setTab]             = useState("categories");
  const [editingCatId, setEditingCatId] = useState(null);

  const [catName, setCatName]         = useState("");
  const [catPreset, setCatPreset]     = useState(0);
  const [catColorOpen, setCatColorOpen] = useState(false);

  const [editName, setEditName]       = useState("");
  const [editPreset, setEditPreset]   = useState(0);
  const [editColorOpen, setEditColorOpen] = useState(false);

  const [typeName, setTypeName] = useState("");
  const [saving, setSaving]     = useState(false);

  function startEdit(cat) {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    const presetIdx = CATEGORY_PALETTE.findIndex(p => p.bg === cat.bg && p.text === cat.text);
    setEditPreset(presetIdx >= 0 ? presetIdx : 0);
    setEditColorOpen(false);
  }

  async function handleAddCat() {
    if (!catName.trim() || categories.find(c => c.name === catName.trim())) return;
    setSaving(true);
    const p = CATEGORY_PALETTE[catPreset];
    await addCategory({ name: catName.trim(), bg: p.bg, text: p.text, border: p.border });
    setCatName(""); setCatPreset(0); setSaving(false);
  }

  async function handleSaveEdit(id) {
    setSaving(true);
    const p = CATEGORY_PALETTE[editPreset];
    await updateCategory(id, { name: editName.trim(), bg: p.bg, text: p.text, border: p.border });
    setEditingCatId(null); setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--t-bg-card)] border-[1.5px] border-[var(--t-primary)] rounded-2xl shadow-xl w-[540px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--t-text-muted)] hover:text-[var(--t-text-dark)] text-xl">✕</button>
        <h2 style={lora} className="text-xl text-[var(--t-text-dark)] mb-4">Manage Categories & Types ✿</h2>
        <div className="flex gap-2 mb-5">
          {["categories","types"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all ${tab===t ? "bg-[var(--t-primary)] text-[var(--t-on-primary)]" : "bg-[var(--t-bg-input)] text-[var(--t-text-med)] hover:bg-[var(--t-bg-accent)]"}`}>{t}</button>
          ))}
        </div>

        {tab === "categories" && (
          <div>
            {categories.length === 0 && (
              <p className="text-sm text-[var(--t-text-muted)] mb-4">No categories yet. Add ones like <strong>Math</strong>, <strong>Biology</strong>, or <strong>Work</strong>.</p>
            )}
            <div className="flex flex-col gap-2 mb-5">
              {categories.map(cat => (
                <div key={cat.id}>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--t-bg-input)] border border-[var(--t-border)]">
                    <span className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>{cat.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => editingCatId === cat.id ? setEditingCatId(null) : startEdit(cat)}
                        className="text-xs text-[var(--t-text-muted)] hover:text-[var(--t-rose-ink)]">
                        {editingCatId === cat.id ? "Cancel" : "Edit"}
                      </button>
                      <button onClick={() => removeCategory(cat.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    </div>
                  </div>
                  {editingCatId === cat.id && (
                    <div className="bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl p-4 flex flex-col gap-3 mt-1">
                      <p className="text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px]">Edit Category</p>
                      <ColorPicker name={editName} onNameChange={setEditName} selected={editPreset}
                        open={editColorOpen} onToggle={() => setEditColorOpen(o => !o)} onSelect={setEditPreset} />
                      <button onClick={() => handleSaveEdit(cat.id)} disabled={!editName.trim() || saving}
                        className="bg-[var(--t-primary)] hover:bg-[var(--t-primary-hover)] disabled:opacity-40 text-[var(--t-on-primary)] text-sm font-semibold py-2 rounded-xl transition-colors">
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl p-4 flex flex-col gap-3">
              <p className="text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px]">New Category</p>
              <ColorPicker name={catName} onNameChange={setCatName} selected={catPreset}
                open={catColorOpen} onToggle={() => setCatColorOpen(o => !o)} onSelect={setCatPreset} />
              <button onClick={handleAddCat} disabled={!catName.trim() || saving}
                className="bg-[var(--t-primary)] hover:bg-[var(--t-primary-hover)] disabled:opacity-40 text-[var(--t-on-primary)] text-sm font-semibold py-2 rounded-xl transition-colors">
                {saving ? "Saving..." : "+ Add Category"}
              </button>
            </div>
          </div>
        )}

        {tab === "types" && (
          <div>
            <div className="flex flex-wrap gap-2 mb-5">
              {taskTypes.map(t => (
                <div key={t.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--t-bg-input)] border border-[var(--t-border)] text-sm text-[var(--t-text-dark)]">
                  {t.name}
                  <button onClick={() => removeTaskType(t.id)} className="text-[var(--t-text-muted)] hover:text-red-500 text-xs">✕</button>
                </div>
              ))}
            </div>
            <div className="bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl p-4 flex gap-3">
              <input value={typeName} onChange={e => setTypeName(e.target.value)}
                onKeyDown={async e => { if (e.key==="Enter" && typeName.trim()) { await addTaskType(typeName.trim()); setTypeName(""); }}}
                placeholder="New type (e.g. Workout)"
                className="flex-1 text-sm bg-[var(--t-on-primary)] border border-[var(--t-border)] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)] placeholder:text-[var(--t-text-muted)]" />
              <button onClick={async () => { if (typeName.trim()) { await addTaskType(typeName.trim()); setTypeName(""); }}}
                disabled={!typeName.trim()}
                className="bg-[var(--t-primary)] hover:bg-[var(--t-primary-hover)] disabled:opacity-40 text-[var(--t-on-primary)] text-sm font-semibold px-4 rounded-xl transition-colors">Add</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task Detail Modal ──────────────────────────────────────────
function TaskModal({ task, onClose, onSave, onDuplicate, onDelete, categories, taskTypes }) {
  const [name, setName]         = useState(task.name);
  const [dueDate, setDueDate]   = useState(task.due_date);
  const [dueTime, setDueTime]   = useState(task.due_time);
  const [selCats, setSelCats]   = useState(task.categories || []);
  const [selTypes, setSelTypes] = useState(task.types || []);
  const [notes, setNotes]       = useState(task.notes || "");
  const { value, unit, raw } = getTimeLeft(dueDate, dueTime);
  const canSave  = name.trim() && dueDate && selCats.length > 0;

  function toggleCat(c)  { setSelCats(s  => s.includes(c) ? s.filter(x=>x!==c) : [...s,c]); }
  function toggleType(t) { setSelTypes(s => s.includes(t) ? s.filter(x=>x!==t) : [...s,t]); }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--t-bg-card)] border border-[var(--t-border)] rounded-2xl shadow-xl w-[500px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--t-text-muted)] hover:text-[var(--t-text-dark)] text-xl">✕</button>
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-3 py-0.5 rounded-full ${getUrgencyStyle(raw)}`}>
            {raw < 0
              ? `${Math.abs(Math.round(raw * 10)/10)} days overdue`
              : unit === "min" ? `${value} min left` : `${value} days left`}
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Task Name</label>
            <input value={name} onChange={e=>setName(e.target.value)}
              className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)]" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
                className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)]" />
            </div>
            <div className="w-36">
              <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Due Time</label>
              <input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)}
                className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)]" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Category <span className="text-[var(--t-rose-ink)]">*</span></label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c.name} onClick={()=>toggleCat(c.name)}
                  className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
                  style={selCats.includes(c.name) ? {background:c.bg,color:c.text,borderColor:c.border} : {background:"var(--t-bg-input)",color:"var(--t-text-med)",borderColor:"var(--t-border)"}}>
                  {c.name}
                </button>
              ))}
            </div>
            {selCats.length === 0 && <p className="text-xs text-[var(--t-rose-ink)] mt-1">Please select at least one category</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-2">Type <span className="normal-case font-normal">(optional)</span></label>
            <div className="flex flex-wrap gap-2">
              {taskTypes.map(t => (
                <button key={t.id} onClick={()=>toggleType(t.name)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${selTypes.includes(t.name) ? "bg-[var(--t-primary)] text-[var(--t-on-primary)] border-[var(--t-primary)]" : "bg-[var(--t-bg-input)] text-[var(--t-text-med)] border-[var(--t-border)]"}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Notes</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add notes..."
              className="w-full h-24 text-sm text-[var(--t-text-dark)] bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 placeholder:text-[var(--t-text-muted)]" />
          </div>
        </div>
        {task.daily_task_id && (
          <p className="text-[11px] text-[var(--t-text-muted)] mt-4 px-1">
            Part of a recurring series — to delete or change duration, go to <strong>Recurring Tasks</strong>.
          </p>
        )}
        <div className="flex gap-2 mt-3">
          {!task.daily_task_id && (
            <button onClick={()=>{onDelete(task.id);onClose();}}
              className="bg-[var(--t-bg-input)] hover:bg-red-50 border border-[var(--t-border)] hover:border-red-200 text-red-400 hover:text-red-500 text-sm font-semibold py-2 px-3 rounded-xl transition-colors">Delete</button>
          )}
          <button onClick={()=>{onDuplicate(task);onClose();}}
            className="flex-1 bg-[var(--t-bg-input)] hover:bg-[var(--t-bg-accent)] border border-[var(--t-border)] text-[var(--t-text-dark)] text-sm font-semibold py-2 rounded-xl transition-colors">Duplicate</button>
          <button onClick={()=>{onSave(task.id,{name,dueDate,dueTime,categories:selCats,types:selTypes,notes});onClose();}}
            disabled={!canSave}
            className="flex-grow bg-[var(--t-primary)] hover:bg-[var(--t-primary-hover)] disabled:opacity-40 text-[var(--t-on-primary)] text-sm font-semibold py-2 rounded-xl transition-colors">Save Changes</button>
        </div>
      </div>
    </div>
  );
}


// ── Add Task Modal ─────────────────────────────────────────────
function AddTaskModal({ onClose, onAdd, onAddDailyTask, categories, taskTypes, prefill }) {
  const [name, setName]         = useState(prefill?.name || "");
  const [dueDate, setDueDate]   = useState("");
  const [dueTime, setDueTime]   = useState(prefill?.due_time || "23:59");
  const [selCats, setSelCats]   = useState(prefill?.categories || []);
  const [selTypes, setSelTypes] = useState(prefill?.types || []);
  const [notes, setNotes]       = useState(prefill?.notes || "");
  const [isDailyTask, setIsDailyTask] = useState(false);
  const [lengthDays, setLengthDays] = useState(7);
  const [frequencyDays, setFrequencyDays] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const canSubmit = isDailyTask
    ? (name.trim() && lengthDays >= 1 && frequencyDays >= 1)
    : (name.trim() && dueDate && selCats.length > 0);

  function toggleCat(c) {
    if (isDailyTask) {
      setSelCats(s => s.includes(c) ? [] : [c]);
    } else {
      setSelCats(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c]);
    }
  }
  function toggleType(t) { setSelTypes(s => s.includes(t) ? s.filter(x=>x!==t) : [...s,t]); }

  const endPreview = isDailyTask && lengthDays >= 1 ? (() => {
    const d = new Date();
    d.setDate(d.getDate() + lengthDays - 1);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  })() : "";
  const occurrences = isDailyTask ? occurrenceCount(lengthDays, frequencyDays) : 0;

  async function handleSubmit() {
    if (!canSubmit || saving) return;
    if (isDailyTask) {
      setSaving(true);
      setSubmitError(null);
      try {
        await onAddDailyTask({ name, category: selCats[0] || null, lengthDays, frequencyDays });
        onClose();
      } catch (err) {
        setSaving(false);
        setSubmitError(err.message || "Failed to create recurring task. Please try again.");
      }
    } else {
      onAdd({ name, dueDate, dueTime, categories: selCats, types: selTypes, done: false, notes });
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--t-bg-card)] border border-[var(--t-border)] rounded-2xl shadow-xl w-[500px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--t-text-muted)] hover:text-[var(--t-text-dark)] text-xl">✕</button>
        <h2 style={lora} className="text-xl text-[var(--t-text-dark)] mb-5">{prefill ? "Duplicate Task" : "Add New Task"}</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Task Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Math HW 9"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)] placeholder:text-[var(--t-text-muted)]" />
          </div>

          {!prefill && (
            <button onClick={() => setIsDailyTask(s => !s)}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all w-fit ${isDailyTask ? "bg-[var(--t-primary)] text-[var(--t-on-primary)] border-[var(--t-primary)]" : "bg-[var(--t-bg-input)] text-[var(--t-text-med)] border-[var(--t-border)] hover:bg-[var(--t-bg-accent)]"}`}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.5 4.5A6 6 0 0 0 2.5 8"/><path d="M2.5 11.5A6 6 0 0 0 13.5 8"/>
                <polyline points="11,2.5 13.5,4.5 11,6.5"/><polyline points="5,9.5 2.5,11.5 5,13.5"/>
              </svg>
              Make this a Recurring Task
            </button>
          )}

          {isDailyTask && (
            <div className="bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <RecurrencePicker label="How long?" options={LENGTH_OPTIONS} value={lengthDays} onChange={setLengthDays} unitWord="day" />
                </div>
                <div className="flex-1">
                  <RecurrencePicker label="How often?" options={FREQUENCY_OPTIONS} value={frequencyDays} onChange={setFrequencyDays} unitWord="day" />
                </div>
              </div>
              {endPreview && (
                <p className="text-[11px] text-[var(--t-text-muted)]">
                  Starts today · ends {endPreview} · {occurrences} check-in{occurrences !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {!isDailyTask && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Due Date</label>
                <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
                  className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)]" />
              </div>
              <div className="w-36">
                <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Due Time</label>
                <input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)}
                  className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)]" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">
              Category {isDailyTask ? <span className="normal-case font-normal">(optional)</span> : <span className="text-[var(--t-rose-ink)]">*</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 && <p className="text-xs text-[var(--t-text-muted)]">No categories yet — add some in Manage first!</p>}
              {categories.map(c => (
                <button key={c.name} onClick={()=>toggleCat(c.name)}
                  className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
                  style={selCats.includes(c.name) ? {background:c.bg,color:c.text,borderColor:c.border} : {background:"var(--t-bg-input)",color:"var(--t-text-med)",borderColor:"var(--t-border)"}}>
                  {c.name}
                </button>
              ))}
            </div>
            {!isDailyTask && categories.length > 0 && selCats.length === 0 && (
              <p className="text-xs text-[var(--t-rose-ink)] mt-1">Please select at least one category</p>
            )}
          </div>

          {!isDailyTask && (
            <div>
              <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-2">Type <span className="normal-case font-normal">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                {taskTypes.map(t => (
                  <button key={t.id} onClick={()=>toggleType(t.name)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all ${selTypes.includes(t.name) ? "bg-[var(--t-primary)] text-[var(--t-on-primary)] border-[var(--t-primary)]" : "bg-[var(--t-bg-input)] text-[var(--t-text-med)] border-[var(--t-border)]"}`}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Notes <span className="normal-case font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any extra details..."
              className="w-full h-20 text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 text-[var(--t-text-dark)] placeholder:text-[var(--t-text-muted)]" />
          </div>
        </div>
        {submitError && (
          <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{submitError}</p>
        )}
        <button onClick={handleSubmit} disabled={!canSubmit || saving}
          className="mt-3 w-full bg-[var(--t-primary)] hover:bg-[var(--t-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--t-on-primary)] text-sm font-semibold py-2.5 rounded-xl transition-colors">
          {saving ? "Creating..." : isDailyTask ? "Add Recurring Task" : (prefill ? "Add Duplicate" : "Add Task")}
        </button>
      </div>
    </div>
  );
}

// ── Main TaskList ──────────────────────────────────────────────
export default function TaskList({ tasks, updateTask, addTask, deleteTask, categories, addCategory, removeCategory, updateCategory, taskTypes, addTaskType, removeTaskType, onExcelImport, deleteAllCompleted, onAddDailyTask, completeDailyInstance }) {
  const [dateMode, setDateMode]             = useState("daysLeft");
  const [sortByCategory, setSortByCategory] = useState(false);
  const [showCompleted, setShowCompleted]   = useState(false);
  const [selectedTask, setSelectedTask]     = useState(null);
  const [showAddTask, setShowAddTask]       = useState(false);
  const [showManage, setShowManage]         = useState(false);
  const [duplicatePrefill, setDuplicatePrefill] = useState(null);
  const [animatingOut, setAnimatingOut]     = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const undoStack = useRef([]);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (undoStack.current.length > 0) {
          e.preventDefault();
          const lastId = undoStack.current[undoStack.current.length - 1];
          undoStack.current = undoStack.current.slice(0, -1);
          updateTask(lastId, { done: false });
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeTasks = tasks
    .filter(t => !t.done)
    .sort((a,b) => {
      if (sortByCategory) return (a.categories?.[0]||"").localeCompare(b.categories?.[0]||"");
      return new Date(`${a.due_date}T${a.due_time}:00`) - new Date(`${b.due_date}T${b.due_time}:00`);
    });
  const completedTasks = tasks.filter(t => t.done);

  function handleDuplicate(task) { setDuplicatePrefill(task); setShowAddTask(true); }

  function handleCheckDone(taskId) {
    if (animatingOut.includes(taskId)) return;
    const task = tasks.find(t => t.id === taskId);
    setAnimatingOut(prev => [...prev, taskId]);
    setTimeout(() => {
      updateTask(taskId, { done: true });
      if (task?.daily_task_id && completeDailyInstance) {
        completeDailyInstance(task.daily_task_id, task.due_date);
      }
      setAnimatingOut(prev => prev.filter(id => id !== taskId));
      undoStack.current = [...undoStack.current, taskId];
    }, 700);
  }

  const urgencyBar = (raw) => {
    if (raw < 0)  return "#D98A8A";
    if (raw <= 1) return "#E0B36A";
    if (raw <= 5) return "#B7C98A";
    return "#9DB387";
  };

  const todayStr = localDateStr();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // ── Smart grouping ──────────────────────────────────────────
  const GROUP_DEFS = [
    { key: "overdue", label: "Overdue",   emoji: "✕", ink: "#B5673F", bg: "#F6E5DE", border: "#E7B9A4" },
    { key: "today",   label: "Today",     emoji: "✦", ink: "var(--rose-deep)", bg: "var(--rose-soft)", border: "var(--border-rose)" },
    { key: "week",    label: "This Week", emoji: "❀", ink: "var(--sage-deep)", bg: "var(--sage-soft)", border: "var(--border-sage)" },
    { key: "later",   label: "Later",     emoji: "☽", ink: "#A9852F", bg: "var(--butter-soft)", border: "#EAD08A" },
  ];
  function bucketOf(task) {
    const { raw } = getTimeLeft(task.due_date, task.due_time);
    if (raw < 0) return "overdue";
    if (task.due_date === todayStr) return "today";
    if (raw <= 7) return "week";
    return "later";
  }

  let sections;
  if (sortByCategory) {
    const byCat = {};
    activeTasks.forEach(t => { const c = (t.categories?.[0] || "Uncategorized"); (byCat[c] = byCat[c] || []).push(t); });
    sections = Object.entries(byCat).map(([label, items]) => ({ key: label, label, emoji: "✿", ink: "var(--rose-deep)", bg: "var(--rose-soft)", border: "var(--border-rose)", items }));
  } else {
    const buckets = { overdue: [], today: [], week: [], later: [] };
    activeTasks.forEach(t => buckets[bucketOf(t)].push(t));
    sections = GROUP_DEFS.map(g => ({ ...g, items: buckets[g.key] })).filter(g => g.items.length > 0);
  }

  function renderTaskCard(task) {
    const { value, unit, raw } = getTimeLeft(task.due_date, task.due_time);
    const isAnimating = animatingOut.includes(task.id);
    return (
      <div key={task.id}
        className={`rounded-2xl overflow-hidden transition-all duration-500 ${isAnimating ? "opacity-25" : "hover:-translate-y-0.5 glow-soft"}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-stretch">
          <div className="w-1.5 flex-shrink-0" style={{ background: urgencyBar(raw) }} />
          <div className="flex items-center gap-4 px-4 py-3.5 flex-1 min-w-0">
            <input type="checkbox" checked={isAnimating || task.done}
              onChange={() => !isAnimating && handleCheckDone(task.id)}
              disabled={isAnimating}
              className="kawaii-checkbox flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div
                className={`text-sm font-semibold leading-snug ${isAnimating ? "line-through text-[var(--t-text-muted)]" : "text-[var(--t-text-dark)] cursor-pointer hover:text-[var(--rose-deep)]"} transition-colors`}
                onClick={() => !isAnimating && setSelectedTask(task)}>
                {task.name}
                {task.daily_task_id && (
                  <span className="inline text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1.5 align-middle"
                    style={{ background: "var(--sage-soft)", color: "var(--sage-deep)" }}>❀ recurring</span>
                )}
                {task.notes && <span className="text-[10px] ml-1 uppercase font-bold tracking-wide" style={{ color: "var(--t-text-muted)" }}>· note</span>}
              </div>
              {(task.categories || []).length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-1.5 ${isAnimating ? "opacity-40" : ""}`}>
                  {task.categories.map(c => <CategoryPill key={c} cat={c} categories={categories} />)}
                </div>
              )}
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0 ${isAnimating ? "line-through text-[var(--t-text-muted)] bg-[var(--t-bg-input)]" : getUrgencyStyle(raw)}`}>
              {dateMode === "daysLeft"
                ? (raw < 0 ? `${Math.abs(Math.round(raw * 10) / 10)}d ago` : unit === "min" ? `${value}m` : `${value}d`)
                : new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="aura aura-rose" style={{ width: 240, height: 240, top: -40, right: 60 }} />
      <div className="aura aura-sage" style={{ width: 220, height: 220, bottom: 60, left: -30 }} />
      <div className="max-w-2xl mx-auto px-6 py-10 relative z-10">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "var(--sage-deep)" }}>{today}</p>
            <h1 style={lora} className="text-[44px] text-[var(--t-text-dark)] leading-tight">My Tasks <span style={{ color: "var(--rose)" }}>✿</span></h1>
          </div>
          <div className="flex gap-2 items-center mt-2">
            <label className="flex items-center gap-1.5 border border-dashed text-xs font-bold px-3.5 py-2 rounded-full transition-all cursor-pointer"
              style={{ background: "var(--surface)", borderColor: "var(--border-sage)", color: "var(--sage-deep)" }}>
              Import
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    const { taskCount, catCount } = await onExcelImport(file);
                    alert(`Imported ${taskCount} task${taskCount !== 1 ? "s" : ""}${catCount > 0 ? ` and ${catCount} new categor${catCount !== 1 ? "ies" : "y"}` : ""}!`);
                  } catch (err) {
                    alert(`Import failed: ${err.message || "Unknown error. Make sure the file is a valid Excel or CSV file."}`);
                  }
                  e.target.value = "";
                }} />
            </label>
            <button onClick={() => setShowManage(true)}
              className="flex items-center gap-1.5 border border-dashed text-xs font-bold px-3.5 py-2 rounded-full transition-all"
              style={{ background: "var(--surface)", borderColor: "var(--border-sage)", color: "var(--sage-deep)" }}>
              ⚙ Manage
            </button>
            <button onClick={() => { setDuplicatePrefill(null); setShowAddTask(true); }}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all glow-rose"
              style={{ background: "var(--rose)", color: "#fff" }}>
              + Add Task
            </button>
          </div>
        </div>

        {/* ── Sort / view controls ── */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] font-bold uppercase tracking-wider mr-1" style={{ color: "var(--t-text-muted)" }}>Group by</span>
          <button onClick={() => setSortByCategory(false)}
            className="text-xs px-3.5 py-1.5 rounded-full border transition-all font-semibold"
            style={!sortByCategory ? { background: "var(--rose)", color: "#fff", borderColor: "var(--rose)" } : { background: "var(--surface)", color: "var(--t-text-med)", borderColor: "var(--border)" }}>
            Due date
          </button>
          <button onClick={() => setSortByCategory(true)}
            className="text-xs px-3.5 py-1.5 rounded-full border transition-all font-semibold"
            style={sortByCategory ? { background: "var(--rose)", color: "#fff", borderColor: "var(--rose)" } : { background: "var(--surface)", color: "var(--t-text-med)", borderColor: "var(--border)" }}>
            Category
          </button>
          <button onClick={() => setDateMode(d => d === "daysLeft" ? "dueDate" : "daysLeft")}
            className="ml-auto text-[11px] transition-colors flex items-center gap-1 font-bold" style={{ color: "var(--sage-deep)" }}>
            {dateMode === "daysLeft" ? "days left" : "due date"} <span className="opacity-70">⇄</span>
          </button>
        </div>

        {/* ── Grouped task cards ── */}
        {activeTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed px-6 py-16 text-center" style={{ background: "var(--surface)", borderColor: "var(--border-rose)" }}>
            <p className="text-3xl mb-2" style={{ color: "var(--rose)" }}>❀</p>
            <p className="text-sm font-semibold" style={{ color: "var(--t-text-muted)" }}>no tasks here ✿ enjoy your free time!</p>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {sections.map(sec => (
            <div key={sec.key}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
                  style={{ background: sec.bg, color: sec.ink, border: `1px solid ${sec.border}` }}>
                  <span>{sec.emoji}</span>{sec.label}
                </span>
                <span className="text-[10px] font-bold" style={{ color: "var(--t-text-muted)" }}>{sec.items.length}</span>
                <span className="flex-1 divider-soft ml-1" />
              </div>
              <div className="flex flex-col gap-2.5">
                {sec.items.map(renderTaskCard)}
              </div>
            </div>
          ))}
        </div>

        {/* ── Completed section ── */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <button className="flex items-center gap-1.5 text-xs text-[var(--t-text-muted)] hover:text-[var(--t-rose-ink)] transition-colors font-medium"
              onClick={() => setShowCompleted(s => !s)}>
              <span className="text-[10px]">{showCompleted ? "▾" : "▸"}</span>
              Completed · {completedTasks.length}
            </button>
            {completedTasks.length > 0 && (
              <button onClick={() => setShowClearConfirm(true)}
                className="text-[11px] text-[var(--t-text-muted)] hover:text-red-400 transition-colors">
                Clear all
              </button>
            )}
          </div>

          {showCompleted && (
            <div className="flex flex-col gap-2">
              {completedTasks.map(task => (
                <div key={task.id} className="bg-[var(--t-bg-card)]/60 rounded-xl border border-[var(--t-border)] overflow-hidden opacity-55 hover:opacity-75 transition-opacity">
                  <div className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-[var(--t-text-muted)] line-through">{task.name}</span>
                      {(task.categories || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.categories.map(c => <CategoryPill key={c} cat={c} categories={categories} />)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[var(--t-text-muted)] flex-shrink-0">
                      {new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <input type="checkbox" checked={task.done} onChange={() => updateTask(task.id, { done: !task.done })}
                      className="kawaii-checkbox flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Clear confirm modal ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-[var(--t-bg-card)] border border-[var(--t-border)] rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 style={lora} className="text-xl text-[var(--t-text-dark)] mb-2">Clear all completed tasks?</h3>
            <p className="text-sm text-[var(--t-text-muted)] mb-6">This will permanently delete all {completedTasks.length} completed task{completedTasks.length !== 1 ? "s" : ""}.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)}
                className="flex-1 text-sm text-[var(--t-text-med)] border border-[var(--t-border)] bg-[var(--t-bg-input)] py-2 rounded-xl hover:bg-[var(--t-bg-accent)] transition-colors">
                Cancel
              </button>
              <button onClick={async () => { await deleteAllCompleted(); setShowClearConfirm(false); setShowCompleted(false); }}
                className="flex-1 text-sm text-white bg-red-400 hover:bg-red-500 py-2 rounded-xl transition-colors">
                Yes, delete all
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} onSave={updateTask} onDuplicate={handleDuplicate} onDelete={deleteTask} categories={categories} taskTypes={taskTypes} />}
      {showAddTask && <AddTaskModal onClose={() => { setShowAddTask(false); setDuplicatePrefill(null); }} onAdd={addTask} onAddDailyTask={onAddDailyTask} categories={categories} taskTypes={taskTypes} prefill={duplicatePrefill} />}
      {showManage && <ManageModal categories={categories} addCategory={addCategory} removeCategory={removeCategory} updateCategory={updateCategory} taskTypes={taskTypes} addTaskType={addTaskType} removeTaskType={removeTaskType} onClose={() => setShowManage(false)} />}
    </div>
  );
}
