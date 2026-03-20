import { useState } from "react";

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const lora   = { fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 };

function getTimeLeft(dueDate, dueTime) {
  const now = new Date();
  const due = new Date(`${dueDate}T${dueTime}:00`);
  const diffMs = due - now;
  const diffMins = diffMs / (1000 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffMins > 0 && diffMins <= 90) {
    return { value: Math.round(diffMins), unit: "min", raw: diffDays };
  }
  return { value: Math.round(diffDays * 10) / 10, unit: "days", raw: diffDays };
}

function getUrgencyStyle(rawDays) {
  if (rawDays < 0)    return "bg-[#EDD9CF] text-[#9B5B3A] font-semibold";
  if (rawDays <= 1)   return "bg-[#EDD9CF] text-[#9B5B3A] font-semibold";
  if (rawDays <= 7)   return "bg-[#F1F0C8] text-[#7A7230] font-semibold";
  return "bg-[#D9E0C8] text-[#4A5C35] font-semibold";
}

function getCatStyle(catName, categories) {
  return categories.find(c => c.name === catName) || { bg: "#E9ECCF", text: "#6B7255", border: "#C3C7A6" };
}

// ── Stat List Modal ─────────────────────────────────────────────
function StatListModal({ title, items, categories, onClose, onSelectItem }) {
  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-2xl shadow-xl w-[500px] max-h-[70vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[#DDE0C0] flex items-center justify-between shrink-0">
          <h2 style={lora} className="text-base text-[#3A4A28]">{title}</h2>
          <button onClick={onClose} className="text-[#8A9170] hover:text-[#3A4A28] text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {items.length === 0 && (
            <p className="text-sm text-[#8A9170] px-6 py-10 text-center font-medium">Nothing here — you&apos;re all clear!</p>
          )}
          {items.map(item => {
            const date = item._date;
            const time = item._time;
            const { raw } = getTimeLeft(date, time || "23:59");
            const catName = item._type === "task" ? item.categories?.[0] : item.category;
            const s = getCatStyle(catName, categories);
            return (
              <div key={`${item._type}-${item.id}`}
                onClick={() => onSelectItem(item)}
                className="px-6 py-4 border-b border-[#DDE0C0] flex items-center justify-between hover:bg-[#EDEEDC] cursor-pointer transition-colors">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold text-[#3A4A28] truncate">{item.name}</span>
                  <span className="text-xs text-[#8A9170] font-medium">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {time && ` · ${time}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {catName && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{catName}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-md ${getUrgencyStyle(raw)}`}>
                    {raw < 0 ? `${Math.abs(Math.round(raw))}d ago` : `${Math.round(Math.max(raw,0))}d`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Event / Task Detail Modal ───────────────────────────────────
function EventModal({ item, onClose, onBack, categories, taskTypes = [], isTask, onSaveTask }) {
  const [name, setName]         = useState(item.name);
  const [dueDate, setDueDate]   = useState(isTask ? (item.due_date || "") : (item.date || ""));
  const [dueTime, setDueTime]   = useState(item.due_time || item.time || "23:59");
  const [selCats, setSelCats]   = useState(isTask ? (item.categories || []) : []);
  const [selTypes, setSelTypes] = useState(isTask ? (item.types || []) : []);
  const [notes, setNotes]       = useState(item.notes || "");

  const date = isTask ? dueDate : (item.date || "");
  const { value, unit, raw } = getTimeLeft(date || new Date().toISOString().split("T")[0], dueTime);
  const canSave = isTask ? (name.trim() && dueDate && selCats.length > 0) : true;

  function toggleCat(c)  { setSelCats(s  => s.includes(c) ? s.filter(x=>x!==c) : [...s,c]); }
  function toggleType(t) { setSelTypes(s => s.includes(t) ? s.filter(x=>x!==t) : [...s,t]); }

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-2xl shadow-xl w-[500px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          {onBack ? (
            <button onClick={onBack} className="text-sm text-[#8A9170] hover:text-[#3A4A28] flex items-center gap-1 transition-colors font-semibold">← Back</button>
          ) : <div />}
          <button onClick={onClose} className="text-[#8A9170] hover:text-[#3A4A28] text-xl leading-none">×</button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${isTask ? "bg-[#D9E4E0] text-[#4A5C35]" : "bg-[#EDE8F5] text-[#5A4A7A]"}`}>
            {isTask ? "Task" : "Event"}
          </span>
          <span className={`text-xs px-3 py-0.5 rounded-full ${getUrgencyStyle(raw)}`}>
            {raw < 0 ? `${Math.abs(Math.round(raw * 10)/10)} days overdue` : unit === "min" ? `${value} min left` : `${value} days left`}
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">{isTask ? "Task" : "Event"} Name</label>
            {isTask ? (
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28]" />
            ) : (
              <p className="text-base font-semibold text-[#3A4A28]">{item.name}</p>
            )}
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">{isTask ? "Due Date" : "Date"}</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={!isTask}
                className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 disabled:opacity-60 font-medium text-[#3A4A28]" />
            </div>
            <div className="w-36">
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Time</label>
              <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)}
                className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28]" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">
              Category {isTask && <span className="text-[#4A5C35]">*</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {isTask ? categories.map(c => (
                <button key={c.name} onClick={() => toggleCat(c.name)}
                  className="text-xs font-bold px-3 py-1 rounded-full border transition-all"
                  style={selCats.includes(c.name) ? { background: c.bg, color: c.text, borderColor: c.border } : { background: "#E9ECCF", color: "#8A9170", borderColor: "#C3C7A6" }}>
                  {c.name}
                </button>
              )) : item.category && (() => { const s = getCatStyle(item.category, categories); return (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{item.category}</span>
              ); })()}
            </div>
            {isTask && selCats.length === 0 && <p className="text-xs text-[#9B5B3A] mt-1 font-medium">Please select at least one category</p>}
          </div>
          {isTask && taskTypes.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Type <span className="normal-case font-normal">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                {taskTypes.map(t => (
                  <button key={t.id} onClick={() => toggleType(t.name)}
                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${selTypes.includes(t.name) ? "bg-[#4A5C35] text-[#EEF1DE] border-[#4A5C35]" : "bg-[#E9ECCF] text-[#8A9170] border-[#C3C7A6]"}`}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!isTask && (item.event_types || []).length > 0 && (
            <div>
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Event Type</label>
              <div className="flex flex-wrap gap-2">
                {(item.event_types || []).map(t => (
                  <span key={t} className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EDE8F5] text-[#5A4A7A]">{t}</span>
                ))}
              </div>
            </div>
          )}
          {!isTask && item.duration && <div className="text-sm text-[#8A9170] font-medium">{item.duration}</div>}
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes..."
              className="w-full h-20 text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28] placeholder:text-[#8A9170]" />
          </div>
        </div>
        <button onClick={() => { if (isTask) onSaveTask(item.id, { name, dueDate, dueTime, categories: selCats, types: selTypes, notes }); onClose(); }}
          disabled={!canSave}
          className="mt-5 w-full bg-[#4A5C35] hover:bg-[#3D4D2C] disabled:opacity-40 text-[#EEF1DE] text-sm font-semibold py-2.5 rounded-xl transition-colors">
          {isTask ? "Save Changes" : "Close"}
        </button>
      </div>
    </div>
  );
}

// ── Add Event Modal ─────────────────────────────────────────────
function AddEventModal({ onClose, onAdd, categories, eventTypes, addEventType }) {
  const [name, setName]         = useState("");
  const [date, setDate]         = useState("");
  const [time, setTime]         = useState("09:00");
  const [duration, setDuration] = useState("1 hr");
  const [category, setCategory] = useState("");
  const [selTypes, setSelTypes] = useState([]);
  const [notes, setNotes]       = useState("");
  const [newType, setNewType]   = useState("");
  const canSubmit = name.trim() && date && category;
  function toggleType(t) { setSelTypes(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t]); }

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-2xl shadow-xl w-[500px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[#8A9170] hover:text-[#3A4A28] text-xl leading-none">×</button>
        <h2 style={lora} className="text-lg text-[#3A4A28] mb-5">Add Event</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MFB Weekly Sync"
              className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28] placeholder:text-[#8A9170]" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28]" />
            </div>
            <div className="w-32">
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28]" />
            </div>
            <div className="w-28">
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Duration</label>
              <select value={duration} onChange={e => setDuration(e.target.value)}
                className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28]">
                {["15 min","30 min","45 min","1 hr","1.5 hr","2 hr","3 hr"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Category <span className="text-[#4A5C35]">*</span></label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c.name} onClick={() => setCategory(c.name)}
                  className="text-xs font-bold px-3 py-1 rounded-full border transition-all"
                  style={category === c.name ? { background: c.bg, color: c.text, borderColor: c.border } : { background: "#E9ECCF", color: "#8A9170", borderColor: "#C3C7A6" }}>
                  {c.name}
                </button>
              ))}
            </div>
            {!category && <p className="text-xs text-[#9B5B3A] mt-1 font-medium">Please select a category</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-2">Event Type <span className="normal-case font-normal">(optional)</span></label>
            <div className="flex flex-wrap gap-2 mb-2">
              {eventTypes.map(t => (
                <button key={t.id} onClick={() => toggleType(t.name)}
                  className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${selTypes.includes(t.name) ? "bg-[#4A5C35] text-[#EEF1DE] border-[#4A5C35]" : "bg-[#E9ECCF] text-[#8A9170] border-[#C3C7A6]"}`}>
                  {t.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newType} onChange={e => setNewType(e.target.value)} placeholder="Add custom type..."
                className="flex-1 text-xs bg-[#E9ECCF] border border-[#C3C7A6] rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28] placeholder:text-[#8A9170]" />
              <button onClick={async () => { if (newType.trim()) { await addEventType(newType.trim()); setNewType(""); }}}
                className="text-xs bg-[#DDE0C0] hover:bg-[#C3C7A6] text-[#3A4A28] font-semibold px-3 py-1.5 rounded-lg transition-colors">+ Add</button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Notes <span className="normal-case font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Agenda, location, link..."
              className="w-full h-20 text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28] placeholder:text-[#8A9170]" />
          </div>
        </div>
        <button onClick={() => { onAdd({ name, date, time, duration, category, event_types: selTypes, notes }); onClose(); }}
          disabled={!canSubmit}
          className="mt-5 w-full bg-[#4A5C35] hover:bg-[#3D4D2C] disabled:opacity-40 disabled:cursor-not-allowed text-[#EEF1DE] text-sm font-semibold py-2.5 rounded-xl transition-colors">
          Add Event
        </button>
      </div>
    </div>
  );
}

// ── Add Task Modal (dashboard) ──────────────────────────────────
function AddTaskModal({ onClose, onAdd, categories, taskTypes = [] }) {
  const [name, setName]         = useState("");
  const [dueDate, setDueDate]   = useState("");
  const [dueTime, setDueTime]   = useState("23:59");
  const [selCats, setSelCats]   = useState([]);
  const [selTypes, setSelTypes] = useState([]);
  const [notes, setNotes]       = useState("");
  const canSubmit = name.trim() && dueDate && selCats.length > 0;
  function toggleCat(c)  { setSelCats(s  => s.includes(c) ? s.filter(x=>x!==c) : [...s,c]); }
  function toggleType(t) { setSelTypes(s => s.includes(t) ? s.filter(x=>x!==t) : [...s,t]); }

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-2xl shadow-xl w-[480px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[#8A9170] hover:text-[#3A4A28] text-xl leading-none">×</button>
        <h2 style={lora} className="text-lg text-[#3A4A28] mb-5">Add Task</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Task Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CS HW 7"
              className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28] placeholder:text-[#8A9170]" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28]" />
            </div>
            <div className="w-36">
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Due Time</label>
              <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)}
                className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28]" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Category <span className="text-[#4A5C35]">*</span></label>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 && <p className="text-xs text-[#8A9170] font-medium">No categories yet — add some in the Tasks page first!</p>}
              {categories.map(c => (
                <button key={c.name} onClick={() => toggleCat(c.name)}
                  className="text-xs font-bold px-3 py-1 rounded-full border transition-all"
                  style={selCats.includes(c.name) ? { background: c.bg, color: c.text, borderColor: c.border } : { background: "#E9ECCF", color: "#8A9170", borderColor: "#C3C7A6" }}>
                  {c.name}
                </button>
              ))}
            </div>
            {categories.length > 0 && selCats.length === 0 && <p className="text-xs text-[#9B5B3A] mt-1 font-medium">Please select at least one category</p>}
          </div>
          {taskTypes.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-2">Type <span className="normal-case font-normal">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                {taskTypes.map(t => (
                  <button key={t.id} onClick={() => toggleType(t.name)}
                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${selTypes.includes(t.name) ? "bg-[#4A5C35] text-[#EEF1DE] border-[#4A5C35]" : "bg-[#E9ECCF] text-[#8A9170] border-[#C3C7A6]"}`}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Notes <span className="normal-case font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any extra details..."
              className="w-full h-20 text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28] placeholder:text-[#8A9170]" />
          </div>
        </div>
        <button onClick={() => { onAdd({ name, dueDate, dueTime, categories: selCats, types: selTypes, done: false, notes }); onClose(); }}
          disabled={!canSubmit}
          className="mt-5 w-full bg-[#4A5C35] hover:bg-[#3D4D2C] disabled:opacity-40 disabled:cursor-not-allowed text-[#EEF1DE] text-sm font-semibold py-2.5 rounded-xl transition-colors">
          Add Task
        </button>
      </div>
    </div>
  );
}

// ── Upcoming panel ──────────────────────────────────────────────
function UpcomingPanel({ items, categories, onSelectItem }) {
  return (
    <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-[14px] p-[13px_14px]">
      <div className="flex items-center justify-between mb-3">
        <h3 style={lora} className="text-[13px] text-[#3A4A28]">Upcoming</h3>
        <span className="text-[10px] text-[#8A9170] font-medium">next 7 days</span>
      </div>
      <div className="flex flex-col">
        {items.length === 0 && <p className="text-xs text-[#8A9170] font-medium py-3 text-center">Nothing due this week!</p>}
        {items.slice(0, 7).map(task => {
          const { raw } = getTimeLeft(task.due_date, task.due_time);
          const catStyle = getCatStyle(task.categories?.[0], categories);
          return (
            <div key={task.id} onClick={() => onSelectItem(task)}
              className="flex items-center gap-2.5 py-2 border-b border-[#DDE0C0] last:border-0 cursor-pointer hover:bg-[#EDEEDC] rounded-lg px-1.5 -mx-1.5 transition-colors">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catStyle.bg, border: `1.5px solid ${catStyle.border}` }} />
              <span className="text-[12px] font-semibold text-[#3A4A28] flex-1 truncate">{task.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${getUrgencyStyle(raw)}`}>
                {raw < 0 ? `${Math.abs(Math.round(raw))}d ago` : `${Math.round(Math.max(raw, 0))}d`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Quick Add panel ─────────────────────────────────────────────
function QuickAddPanel({ onAdd, categories }) {
  const [name, setName]       = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selCat, setSelCat]   = useState("");
  const canSubmit = name.trim() && dueDate && selCat;

  return (
    <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-[14px] p-[13px_14px]">
      <h3 style={lora} className="text-[13px] text-[#3A4A28] mb-3">Quick add</h3>
      <div className="flex flex-col gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Task name..."
          className="w-full text-[11.5px] bg-[#E9ECCF] border border-[#C3C7A6] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28] placeholder:text-[#8A9170]" />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            className="text-[11.5px] bg-[#E9ECCF] border border-[#C3C7A6] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28]" />
          <select value={selCat} onChange={e => setSelCat(e.target.value)}
            className="text-[11.5px] bg-[#E9ECCF] border border-[#C3C7A6] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28]">
            <option value="">Category</option>
            {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={() => {
          onAdd({ name, dueDate, dueTime: "23:59", categories: selCat ? [selCat] : [], types: [], done: false, notes: "" });
          setName(""); setDueDate(""); setSelCat("");
        }} disabled={!canSubmit}
          className="w-full bg-[#4A5C35] hover:bg-[#3D4D2C] disabled:opacity-40 disabled:cursor-not-allowed text-[#EEF1DE] text-[11.5px] font-semibold py-2 rounded-lg transition-colors">
          Add Task
        </button>
      </div>
    </div>
  );
}

// ── Calendar ────────────────────────────────────────────────────
function CalendarView({ tasks, events, categories, onSelectItem }) {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = current.getFullYear(), month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isToday = d => d && today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;

  function itemsOnDay(day) {
    if (!day) return [];
    const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const t = tasks.filter(t => !t.done && t.due_date === ds).map(t => ({ ...t, _type: "task" }));
    const e = events.filter(e => e.date === ds).map(e => ({ ...e, _type: "event" }));
    return [...t, ...e].sort((a,b) => (a.due_time||a.time||"").localeCompare(b.due_time||b.time||""));
  }

  function getItemStyle(item) {
    const catName = item._type === "task" ? item.categories?.[0] : item.category;
    const cat = categories.find(c => c.name === catName);
    return { bg: cat?.bg || "#E9ECCF", color: cat?.text || "#6B7255", border: `${cat?.border || "#C3C7A6"}55` };
  }

  return (
    <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-[14px] p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrent(new Date(year, month-1, 1))} className="text-[#8A9170] hover:text-[#3A4A28] text-lg px-2 transition-colors">‹</button>
        <h2 style={lora} className="text-base text-[#3A4A28]">{MONTHS[month]} {year}</h2>
        <button onClick={() => setCurrent(new Date(year, month+1, 1))} className="text-[#8A9170] hover:text-[#3A4A28] text-lg px-2 transition-colors">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-[9px] font-bold text-[#8A9170] uppercase tracking-[0.7px] py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const items = itemsOnDay(day);
          const hasItems = items.length > 0;
          return (
            <div key={i} className={`min-h-[54px] rounded-lg p-1.5 transition-colors ${day ? "cursor-pointer" : ""} ${isToday(day) ? "bg-[#D9E4E0] ring-2 ring-[#4A5C35]" : hasItems ? "bg-[#EDEEDC]" : ""}`}>
              {day && (<>
                <span className={`text-[9.5px] block mb-0.5 ${isToday(day) ? "font-bold text-[#3A4A28]" : "font-semibold text-[#8A9170]"}`}>{day}</span>
                <div className="flex flex-col gap-0.5">
                  {items.slice(0,3).map(item => {
                    const s = getItemStyle(item);
                    return (
                      <div key={`${item._type}-${item.id}`} onClick={() => onSelectItem(item)}
                        className="text-[7.5px] font-semibold px-1.5 py-0.5 truncate cursor-pointer hover:opacity-75 transition-opacity flex items-center gap-1"
                        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: "4px" }}>
                        <span>{item._type === "event" ? "●" : "◆"}</span>
                        <span className="truncate">{item.name}</span>
                      </div>
                    );
                  })}
                  {items.length > 3 && <span className="text-[9px] text-[#8A9170] font-medium pl-1">+{items.length-3}</span>}
                </div>
              </>)}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#DDE0C0]">
        <span className="text-[10px] text-[#8A9170] font-semibold">◆ Task</span>
        <span className="text-[10px] text-[#8A9170] font-semibold">● Event</span>
      </div>
    </div>
  );
}

// ── List View ───────────────────────────────────────────────────
function ListView({ tasks, events, categories, onSelectItem }) {
  const all = [
    ...tasks.filter(t => !t.done).map(t => ({ ...t, _type:"task",  _date:t.due_date, _time:t.due_time })),
    ...events.map(e =>              ({ ...e, _type:"event", _date:e.date,     _time:e.time    })),
  ].sort((a,b) => new Date(`${a._date}T${a._time || "00:00"}`) - new Date(`${b._date}T${b._time || "00:00"}`));

  return (
    <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-[14px] overflow-hidden">
      <div className="grid grid-cols-[2fr_1fr_1fr_80px] px-6 py-3 bg-[#DDE0C0] text-[9.5px] font-bold text-[#8A9170] uppercase tracking-[0.7px]">
        <span>Name</span><span>Date</span><span>Category</span><span className="text-center">Type</span>
      </div>
      {all.length === 0 && <p className="text-sm text-[#8A9170] px-6 py-10 text-center font-medium">No upcoming tasks or events!</p>}
      {all.map(item => {
        const { value, unit, raw } = getTimeLeft(item._date, item._time || "23:59");
        const catName = item._type === "task" ? item.categories?.[0] : item.category;
        const s       = getCatStyle(catName, categories);
        return (
          <div key={`${item._type}-${item.id}`} onClick={() => onSelectItem(item)}
            className="grid grid-cols-[2fr_1fr_1fr_80px] px-6 py-4 border-t border-[#DDE0C0] items-center hover:bg-[#EDEEDC] transition-colors cursor-pointer">
            <span className="text-[12px] text-[#3A4A28] font-semibold">{item.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-md w-fit ${getUrgencyStyle(raw)}`}>
              {raw < 0 ? `${Math.abs(Math.round(raw * 10) / 10)}d ago` : unit === "min" ? `${value}m` : new Date(item._date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full w-fit"
              style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{catName || "—"}</span>
            <div className="flex justify-center">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item._type === "event" ? "bg-[#EDE8F5] text-[#5A4A7A]" : "bg-[#D9E4E0] text-[#4A5C35]"}`}>{item._type}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────
export default function Dashboard({
  tasks, setTasks, addTask,
  events, addEvent,
  categories, taskTypes = [],
  eventTypes, addEventType, removeEventType,
}) {
  const [view, setView]                     = useState("calendar");
  const [selectedItem, setSelectedItem]     = useState(null);
  const [showAddTask, setShowAddTask]       = useState(false);
  const [showAddEvent, setShowAddEvent]     = useState(false);
  const [statModal, setStatModal]           = useState(null);
  const [statDetailItem, setStatDetailItem] = useState(null);

  const weekItems = tasks
    .filter(t => { const { raw } = getTimeLeft(t.due_date, t.due_time); return !t.done && raw >= 0 && raw <= 7; })
    .map(t => ({ ...t, _type: "task", _date: t.due_date, _time: t.due_time }));
  const overdueItems = tasks
    .filter(t => !t.done && getTimeLeft(t.due_date, t.due_time).raw < 0)
    .map(t => ({ ...t, _type: "task", _date: t.due_date, _time: t.due_time }));
  const completedItems = tasks
    .filter(t => t.done)
    .map(t => ({ ...t, _type: "task", _date: t.due_date, _time: t.due_time }));
  const upcomingEventItems = events
    .filter(e => getTimeLeft(e.date, e.time || "23:59").raw >= 0)
    .map(e => ({ ...e, _type: "event", _date: e.date, _time: e.time }));

  const STAT_CONFIG = [
    { key: "week",      label: "Due This Week", items: weekItems,          bg: "bg-[#F1F0C8]", border: "border-[#D9DAAA]", valueColor: "text-[#3A4A28]" },
    { key: "overdue",   label: "Overdue",        items: overdueItems,       bg: "bg-[#D9E4E0]", border: "border-[#B8CECC]", valueColor: "text-[#6B3A28]" },
    { key: "completed", label: "Completed",      items: completedItems,     bg: "bg-[#EDD9CF]", border: "border-[#D7C59F]", valueColor: "text-[#3A4A28]" },
    { key: "events",    label: "Events",         items: upcomingEventItems, bg: "bg-[#D9E0C8]", border: "border-[#C3C7A6]", valueColor: "text-[#5A4A7A]" },
  ];

  return (
    <div className="bg-[#EEF1DE] min-h-screen p-[18px_22px]">
      <div className="flex items-center justify-between mb-4">
        <h2 style={lora} className="text-xl text-[#3A4A28]">Overview</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddTask(true)}
            className="bg-[#DDE0C0] border border-[#C3C7A6] hover:bg-[#C3C7A6] text-[#5A6440] text-[11.5px] font-bold px-3.5 py-2 rounded-[9px] transition-all">
            + Task
          </button>
          <button onClick={() => setShowAddEvent(true)}
            className="bg-[#DDE0C0] border border-[#C3C7A6] hover:bg-[#C3C7A6] text-[#5A6440] text-[11.5px] font-bold px-3.5 py-2 rounded-[9px] transition-all">
            + Event
          </button>
          <div className="flex items-center gap-1 bg-[#DDE0C0] border border-[#C3C7A6] rounded-[9px] p-1 ml-1">
            {[["calendar","Calendar"],["list","List"]].map(([id,label]) => (
              <button key={id} onClick={() => setView(id)}
                className={`px-3.5 py-1.5 rounded-[7px] text-[11.5px] font-bold transition-all ${view===id ? "bg-[#F4F5E8] text-[#3A4A28] shadow-sm" : "text-[#6B7255] hover:text-[#3A4A28]"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-[10px] mb-4">
        {STAT_CONFIG.map(s => (
          <div key={s.key} onClick={() => setStatModal(s.key)}
            className={`${s.bg} border ${s.border} rounded-[13px] px-[15px] py-[13px] cursor-pointer hover:opacity-90 transition-opacity`}>
            <p className="text-[9.5px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">{s.label}</p>
            <p className={`text-[26px] font-bold leading-none ${s.valueColor}`}>{s.items.length}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-[14px]">
        <div>
          {view === "calendar"
            ? <CalendarView tasks={tasks} events={events} categories={categories} onSelectItem={setSelectedItem} />
            : <ListView tasks={tasks} events={events} categories={categories} onSelectItem={setSelectedItem} />}
        </div>
        <div className="flex flex-col gap-[12px]">
          <UpcomingPanel items={weekItems} categories={categories} onSelectItem={item => setSelectedItem({ ...item, _type: "task" })} />
          <QuickAddPanel onAdd={addTask} categories={categories} />
        </div>
      </div>

      {statModal && !statDetailItem && (
        <StatListModal title={STAT_CONFIG.find(s => s.key === statModal)?.label || ""}
          items={STAT_CONFIG.find(s => s.key === statModal)?.items || []}
          categories={categories} onClose={() => setStatModal(null)} onSelectItem={item => setStatDetailItem(item)} />
      )}
      {statDetailItem && (
        <EventModal item={statDetailItem}
          onClose={() => { setStatDetailItem(null); setStatModal(null); }} onBack={() => setStatDetailItem(null)}
          categories={categories} taskTypes={taskTypes} isTask={statDetailItem._type === "task"}
          onSaveTask={(id, updates) => { setTasks(id, updates); setStatDetailItem(null); }} />
      )}
      {selectedItem && (
        <EventModal item={selectedItem} onClose={() => setSelectedItem(null)}
          categories={categories} taskTypes={taskTypes} isTask={selectedItem._type === "task"}
          onSaveTask={(id, updates) => { setTasks(id, updates); setSelectedItem(null); }} />
      )}
      {showAddTask && <AddTaskModal onClose={() => setShowAddTask(false)} onAdd={addTask} categories={categories} taskTypes={taskTypes} />}
      {showAddEvent && <AddEventModal onClose={() => setShowAddEvent(false)} onAdd={addEvent}
        categories={categories} eventTypes={eventTypes} addEventType={addEventType} removeEventType={removeEventType} />}
    </div>
  );
}
