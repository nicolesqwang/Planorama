import { useState } from "react";

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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
  if (rawDays < 0)        return "bg-red-50 text-red-600 font-semibold";
  if (rawDays <= 1/24)    return "bg-orange-50 text-orange-500 font-semibold"; // ≤1hr
  if (rawDays <= 5/1440)  return "bg-orange-50 text-orange-500 font-semibold"; // catch-all for mins
  if (rawDays <= 1)       return "bg-orange-50 text-orange-500 font-semibold";
  if (rawDays <= 5)       return "bg-yellow-50 text-yellow-600";
  return "bg-green-50 text-green-700";
}
function getCatStyle(catName, categories) {
  return categories.find(c => c.name === catName) || { bg: "#F2F3F4", text: "#717D7E", border: "#CCD1D1" };
}

// ── Event Detail Modal ─────────────────────────────────────────
function EventModal({ item, onClose, categories, isTask, onSaveTask }) {
  const [notes, setNotes]   = useState(item.notes || "");
  const [dueTime, setDueTime] = useState(item.due_time || item.time || "23:59");
  const date     = isTask ? item.due_date : item.date;
  const { value, unit, raw } = getTimeLeft(date, dueTime);
  const cats     = isTask ? (item.categories || []) : [item.category];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[460px] p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${isTask ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
            {isTask ? "Task" : "Event"}
          </span>
            <span className={`text-xs px-3 py-0.5 rounded-full ${getUrgencyStyle(raw)}`}>
            {raw < 0
                ? `${Math.abs(Math.round(raw * 10)/10)} days overdue`
                : unit === "min" ? `${value} min left` : `${value} days left`}
            </span>
        </div>
        <h2 className="text-lg font-semibold text-[#1C1B19] mb-4">{item.name}</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {cats.map(c => { const s = getCatStyle(c, categories); return (
            <span key={c} className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{c}</span>
          );})}
          {!isTask && (item.event_types || []).map(t => (
            <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-600">{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8C8880] mb-4">
          <span>📅</span>
          <span>{new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          <span>·</span><span>{dueTime}</span>
          {!isTask && item.duration && <span className="ml-1 text-xs bg-[#EFEDE9] px-2 py-0.5 rounded-full">{item.duration}</span>}
        </div>
        <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes..."
          className="w-full h-20 text-sm bg-[#F7F5F2] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#E8735A]/40 mb-4" />
        <button onClick={() => { if (isTask) onSaveTask(item.id, { notes, dueTime }); onClose(); }}
          className="w-full bg-[#E8735A] hover:bg-[#d4624a] text-white text-sm font-medium py-2 rounded-xl transition-colors">
          {isTask ? "Save" : "Close"}
        </button>
      </div>
    </div>
  );
}

// ── Add Event Modal ────────────────────────────────────────────
function AddEventModal({ onClose, onAdd, categories, eventTypes, addEventType, removeEventType }) {
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <h2 className="text-lg font-semibold text-[#1C1B19] mb-5">Add Event</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MFB Weekly Sync"
              className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
            </div>
            <div className="w-32">
              <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
            </div>
            <div className="w-28">
              <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Duration</label>
              <select value={duration} onChange={e => setDuration(e.target.value)}
                className="w-full text-sm bg-[#F7F5F2] rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40">
                {["15 min","30 min","45 min","1 hr","1.5 hr","2 hr","3 hr"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">
              Category <span className="text-[#E8735A]">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c.name} onClick={() => setCategory(c.name)}
                  className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
                  style={category === c.name
                    ? { background: c.bg, color: c.text, borderColor: c.border }
                    : { background: "white", color: "#8C8880", borderColor: "#E5E2DE" }}>
                  {c.name}
                </button>
              ))}
            </div>
            {!category && <p className="text-xs text-[#E8735A] mt-1">Please select a category</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-2">
              Event Type <span className="normal-case font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {eventTypes.map(t => (
                <button key={t.id} onClick={() => toggleType(t.name)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${selTypes.includes(t.name) ? "bg-[#1C1B19] text-white border-[#1C1B19]" : "bg-white text-[#8C8880] border-[#E5E2DE]"}`}>
                  {t.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newType} onChange={e => setNewType(e.target.value)}
                placeholder="Add custom type..."
                className="flex-1 text-xs bg-[#F7F5F2] rounded-lg px-3 py-1.5 outline-none border border-gray-200 focus:ring-2 focus:ring-[#E8735A]/40" />
              <button onClick={async () => { if (newType.trim()) { await addEventType(newType.trim()); setNewType(""); }}}
                className="text-xs bg-[#EFEDE9] hover:bg-[#E5E2DE] text-[#1C1B19] px-3 py-1.5 rounded-lg transition-colors">
                + Add
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Notes <span className="normal-case font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Agenda, location, link..."
              className="w-full h-20 text-sm bg-[#F7F5F2] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
          </div>
        </div>
        <button onClick={() => { onAdd({ name, date, time, duration, category, event_types: selTypes, notes }); onClose(); }}
          disabled={!canSubmit}
          className="mt-5 w-full bg-[#E8735A] hover:bg-[#d4624a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-xl transition-colors">
          Add Event
        </button>
      </div>
    </div>
  );
}

// ── Add Task Modal (dashboard) ─────────────────────────────────
function AddTaskModal({ onClose, onAdd, categories }) {
  const [name, setName]       = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [selCats, setSelCats] = useState([]);
  const [notes, setNotes]     = useState("");
  const canSubmit = name.trim() && dueDate && selCats.length > 0;
  function toggleCat(c) { setSelCats(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c]); }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[480px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <h2 className="text-lg font-semibold text-[#1C1B19] mb-5">Add Task</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Task Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CS HW 7"
              className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
            </div>
            <div className="w-36">
              <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Due Time</label>
              <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)}
                className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Category <span className="text-[#E8735A]">*</span></label>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 && <p className="text-xs text-[#8C8880]">No categories yet — add some in the Tasks page first!</p>}
              {categories.map(c => (
                <button key={c.name} onClick={() => toggleCat(c.name)}
                  className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
                  style={selCats.includes(c.name)
                    ? { background: c.bg, color: c.text, borderColor: c.border }
                    : { background: "white", color: "#8C8880", borderColor: "#E5E2DE" }}>
                  {c.name}
                </button>
              ))}
            </div>
            {categories.length > 0 && selCats.length === 0 && <p className="text-xs text-[#E8735A] mt-1">Please select at least one category</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Notes <span className="normal-case font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any extra details..."
              className="w-full h-20 text-sm bg-[#F7F5F2] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
          </div>
        </div>
        <button onClick={() => { onAdd({ name, dueDate, dueTime, categories: selCats, types: [], done: false, notes }); onClose(); }}
          disabled={!canSubmit}
          className="mt-5 w-full bg-[#E8735A] hover:bg-[#d4624a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-xl transition-colors">
          Add Task
        </button>
      </div>
    </div>
  );
}

// ── Calendar ───────────────────────────────────────────────────
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
    return { bg: cat?.bg || "#F2F3F4", color: cat?.text || "#717D7E", border: `${cat?.border || "#CCD1D1"}55` };
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrent(new Date(year, month-1, 1))} className="text-[#8C8880] hover:text-[#1C1B19] text-lg px-2">‹</button>
        <h2 className="text-base font-semibold text-[#1C1B19]">{MONTHS[month]} {year}</h2>
        <button onClick={() => setCurrent(new Date(year, month+1, 1))} className="text-[#8C8880] hover:text-[#1C1B19] text-lg px-2">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-[#8C8880] py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const items = itemsOnDay(day);
          return (
            <div key={i} className={`min-h-[80px] rounded-xl p-1.5 ${day ? "cursor-pointer" : ""} ${isToday(day) ? "ring-2 ring-[#E8735A]" : ""}`}>
              {day && (<>
                <span className={`text-xs font-medium block mb-0.5 ${isToday(day) ? "text-[#E8735A]" : "text-[#8C8880]"}`}>{day}</span>
                <div className="flex flex-col gap-0.5">
                  {items.slice(0,3).map(item => {
                    const s = getItemStyle(item);
                    return (
                      <div key={`${item._type}-${item.id}`} onClick={() => onSelectItem(item)}
                        className="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-75 transition-opacity flex items-center gap-1"
                        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        <span>{item._type === "event" ? "●" : "◆"}</span>
                        <span className="truncate">{item.name}</span>
                      </div>
                    );
                  })}
                  {items.length > 3 && <span className="text-[10px] text-[#8C8880] pl-1">+{items.length-3} more</span>}
                </div>
              </>)}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-[#8C8880] flex items-center gap-1">◆ Task</span>
        <span className="text-xs text-[#8C8880] flex items-center gap-1">● Event</span>
      </div>
    </div>
  );
}

// ── List View ──────────────────────────────────────────────────
function ListView({ tasks, events, categories, onSelectItem }) {
  const all = [
    ...tasks.filter(t => !t.done).map(t => ({ ...t, _type:"task",  _date:t.due_date, _time:t.due_time })),
    ...events.map(e =>              ({ ...e, _type:"event", _date:e.date,     _time:e.time    })),
  ].sort((a,b) => new Date(`${a._date}T${a._time}`) - new Date(`${b._date}T${b._time}`));

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="grid grid-cols-[2fr_1fr_1fr_80px] px-6 py-3 bg-[#EFEDE9] text-xs font-semibold text-[#8C8880] uppercase tracking-wide">
        <span>Name</span><span>Date</span><span>Category</span><span className="text-center">Type</span>
      </div>
      {all.map(item => {
        const { value, unit, raw } = getTimeLeft(item._date, item._time);
        const catName  = item._type === "task" ? item.categories?.[0] : item.category;
        const s        = getCatStyle(catName, categories);
        return (
          <div key={`${item._type}-${item.id}`} onClick={() => onSelectItem(item)}
            className="grid grid-cols-[2fr_1fr_1fr_80px] px-6 py-4 border-t border-gray-100 items-center hover:bg-[#FAFAF8] transition-colors cursor-pointer">
            <span className="text-sm text-[#1C1B19] font-medium hover:text-[#E8735A] transition-colors">{item.name}</span>
            <span className={`text-sm px-2 py-0.5 rounded-md w-fit ${getUrgencyStyle(raw)}`}>
            {dateMode === "daysLeft"
                ? (raw < 0
                    ? `${Math.abs(Math.round(raw * 10) / 10)} days ago`
                    : unit === "min"
                    ? `${value} min`
                    : `${value} days`)
                : new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full w-fit"
              style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{catName}</span>
            <div className="flex justify-center">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${item._type === "event" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
                {item._type}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────
export default function Dashboard({ tasks, setTasks, addTask, events, addEvent, categories, eventTypes, addEventType, removeEventType }) {
  const [view, setView]           = useState("calendar");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddTask, setShowAddTask]   = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const today = new Date();

  const upcomingCount = tasks.filter(t => { const {raw} = getTimeLeft(t.due_date, t.due_time); return !t.done && raw >= 0 && raw <= 7; }).length;
  const overdueCount  = tasks.filter(t => !t.done && getTimeLeft(t.due_date, t.due_time).raw < 0).length;
  const eventCount    = events.filter(e => getTimeLeft(e.date, e.time).raw >= 0).length;

  return (
    <div className="min-h-screen bg-[#F7F5F2] p-8 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1C1B19]">Dashboard</h1>
          <p className="text-sm text-[#8C8880] mt-0.5">{today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddTask(true)}
            className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 text-[#1C1B19] text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            + Task
          </button>
          <button onClick={() => setShowAddEvent(true)}
            className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 text-[#1C1B19] text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            + Event
          </button>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 ml-2">
            {[["calendar","📅 Calendar"],["list","📋 List"]].map(([id,label]) => (
              <button key={id} onClick={() => setView(id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view===id ? "bg-[#E8735A] text-white" : "text-[#8C8880] hover:text-[#1C1B19]"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:"Due This Week",    value:upcomingCount, color:"text-[#E8735A]",  bg:"bg-orange-50" },
          { label:"Overdue",          value:overdueCount,  color:"text-red-500",    bg:"bg-red-50"    },
          { label:"Upcoming Events",  value:eventCount,    color:"text-purple-600", bg:"bg-purple-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-6 py-4 flex items-center justify-between`}>
            <span className="text-sm text-[#8C8880]">{s.label}</span>
            <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {view === "calendar"
        ? <CalendarView tasks={tasks} events={events} categories={categories} onSelectItem={setSelectedItem} />
        : <ListView tasks={tasks} events={events} categories={categories} onSelectItem={setSelectedItem} />
      }

      {selectedItem && (
        <EventModal item={selectedItem} onClose={() => setSelectedItem(null)}
          categories={categories} isTask={selectedItem._type === "task"}
          onSaveTask={(id, updates) => { setTasks(id, updates); setSelectedItem(null); }} />
      )}
      {showAddTask && <AddTaskModal onClose={() => setShowAddTask(false)} onAdd={addTask} categories={categories} />}
      {showAddEvent && (
        <AddEventModal onClose={() => setShowAddEvent(false)} onAdd={addEvent}
          categories={categories} eventTypes={eventTypes}
          addEventType={addEventType} removeEventType={removeEventType} />
      )}
    </div>
  );
}