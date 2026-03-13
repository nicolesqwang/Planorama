import { useState } from "react";

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

function CategoryPill({ cat, categories }) {
  const s = categories.find(c => c.name === cat) || { bg:"#F2F3F4", text:"#717D7E", border:"#CCD1D1" };
  return (
    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
      style={{ background:s.bg, color:s.text, border:`1px solid ${s.border}` }}>{cat}</span>
  );
}

// ── Manage Modal ───────────────────────────────────────────────
// ── Color suggestion helper ────────────────────────────────────
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      default: h = ((r-g)/d + 4)/6;
    }
  }
  return [h*360, s*100, l*100];
}

function hslToHex(h, s, l) {
  h/=360; s/=100; l/=100;
  let r,g,b;
  if (s===0) { r=g=b=l; }
  else {
    const hue2rgb = (p,q,t) => {
      if(t<0)t+=1; if(t>1)t-=1;
      if(t<1/6)return p+(q-p)*6*t;
      if(t<1/2)return q;
      if(t<2/3)return p+(q-p)*(2/3-t)*6;
      return p;
    };
    const q = l<0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l-q;
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  return "#"+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,"0")).join("");
}

function suggestFromBg(bgHex) {
  const [h, s, l] = hexToHsl(bgHex);
  const isLight = l > 55;
  const textL  = isLight ? Math.max(l - 50, 15) : Math.min(l + 55, 92);
  const borderL = isLight ? Math.max(l - 25, 30) : Math.min(l + 30, 80);
  const textS  = Math.min(s + 10, 80);
  const borderS = Math.max(s - 10, 20);
  return {
    text:   hslToHex(h, textS,  textL),
    border: hslToHex(h, borderS, borderL),
  };
}

function ManageModal({ categories, addCategory, removeCategory, taskTypes, addTaskType, removeTaskType, onClose }) {
  const [tab, setTab]             = useState("categories");
  const [catName, setCatName]     = useState("");
  const [catBg, setCatBg]         = useState("#E8F4FD");
  const [catText, setCatText]     = useState("#2E86C1");
  const [catBorder, setCatBorder] = useState("#AED6F1");
  const [bgTouched, setBgTouched] = useState(false);
  const [userEditedText, setUserEditedText]   = useState(false);
  const [userEditedBorder, setUserEditedBorder] = useState(false);
  const [typeName, setTypeName]   = useState("");
  const [saving, setSaving]       = useState(false);

  function handleBgChange(hex) {
    setCatBg(hex);
    setBgTouched(true);
    // Only auto-suggest if user hasn't manually set text/border
    if (!userEditedText || !userEditedBorder) {
      const { text, border } = suggestFromBg(hex);
      if (!userEditedText)   setCatText(text);
      if (!userEditedBorder) setCatBorder(border);
    }
  }

  function handleTextChange(hex) {
    setCatText(hex);
    setUserEditedText(true);
  }

  function handleBorderChange(hex) {
    setCatBorder(hex);
    setUserEditedBorder(true);
  }

  async function handleAddCat() {
    if (!catName.trim() || categories.find(c => c.name === catName.trim())) return;
    setSaving(true);
    await addCategory({ name: catName.trim(), bg: catBg, text: catText, border: catBorder });
    setCatName(""); setSaving(false);
    setBgTouched(false); setUserEditedText(false); setUserEditedBorder(false);
    setCatBg("#E8F4FD"); setCatText("#2E86C1"); setCatBorder("#AED6F1");
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[540px] max-h-[80vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <h2 className="text-lg font-semibold text-[#1C1B19] mb-4">Manage Categories & Types</h2>
        <div className="flex gap-2 mb-5">
          {["categories","types"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all ${tab===t ? "bg-[#E8735A] text-white" : "bg-[#EFEDE9] text-[#8C8880]"}`}>{t}</button>
          ))}
        </div>

        {tab === "categories" && (
          <div>
            {categories.length === 0 && (
              <p className="text-sm text-[#8C8880] mb-4">No categories yet. Try adding ones like <strong>Math</strong>, <strong>Biology</strong>, or <strong>Work</strong>.</p>
            )}
            <div className="flex flex-col gap-2 mb-5">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F7F5F2]">
                  <span className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{ background:cat.bg, color:cat.text, border:`1px solid ${cat.border}` }}>{cat.name}</span>
                  <button onClick={() => removeCategory(cat.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </div>
              ))}
            </div>

            <div className="bg-[#F7F5F2] rounded-xl p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-[#8C8880] uppercase tracking-wide">New Category</p>
              <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Biology, Economics, Work"
                className="w-full text-sm bg-white rounded-lg px-3 py-2 outline-none border border-gray-200 focus:ring-2 focus:ring-[#E8735A]/40" />

              <div className="flex gap-4 items-end flex-wrap">
                <label className="flex flex-col gap-1 text-xs text-[#8C8880]">
                  Background
                  <input type="color" value={catBg} onChange={e => handleBgChange(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border-0" />
                </label>
                <label className="flex flex-col gap-1 text-xs text-[#8C8880]">
                  <span className="flex items-center gap-1">
                    Text {!userEditedText && bgTouched && <span className="text-[#E8735A] text-[10px]">auto</span>}
                  </span>
                  <input type="color" value={catText} onChange={e => handleTextChange(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border-0" />
                </label>
                <label className="flex flex-col gap-1 text-xs text-[#8C8880]">
                  <span className="flex items-center gap-1">
                    Border {!userEditedBorder && bgTouched && <span className="text-[#E8735A] text-[10px]">auto</span>}
                  </span>
                  <input type="color" value={catBorder} onChange={e => handleBorderChange(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border-0" />
                </label>
                <div className="flex flex-col gap-1 text-xs text-[#8C8880]">
                  Preview
                  <span className="text-xs font-medium px-3 py-1 rounded-full mt-1"
                    style={{ background:catBg, color:catText, border:`1px solid ${catBorder}` }}>
                    {catName || "Preview"}
                  </span>
                </div>
              </div>

              {bgTouched && !userEditedText && (
                <p className="text-[11px] text-[#8C8880]">✨ Text & border colors auto-suggested from background. Edit them anytime.</p>
              )}

              <button onClick={handleAddCat} disabled={!catName.trim() || saving}
                className="bg-[#E8735A] hover:bg-[#d4624a] disabled:opacity-40 text-white text-sm font-medium py-2 rounded-xl transition-colors">
                {saving ? "Saving..." : "+ Add Category"}
              </button>
            </div>
          </div>
        )}

        {tab === "types" && (
          <div>
            <div className="flex flex-wrap gap-2 mb-5">
              {taskTypes.map(t => (
                <div key={t.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFEDE9] text-sm text-[#1C1B19]">
                  {t.name}
                  <button onClick={() => removeTaskType(t.id)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                </div>
              ))}
            </div>
            <div className="bg-[#F7F5F2] rounded-xl p-4 flex gap-3">
              <input value={typeName} onChange={e => setTypeName(e.target.value)}
                onKeyDown={async e => { if (e.key==="Enter" && typeName.trim()) { await addTaskType(typeName.trim()); setTypeName(""); }}}
                placeholder="New type (e.g. Workout)"
                className="flex-1 text-sm bg-white rounded-lg px-3 py-2 outline-none border border-gray-200 focus:ring-2 focus:ring-[#E8735A]/40" />
              <button onClick={async () => { if (typeName.trim()) { await addTaskType(typeName.trim()); setTypeName(""); }}}
                disabled={!typeName.trim()}
                className="bg-[#E8735A] hover:bg-[#d4624a] disabled:opacity-40 text-white text-sm font-medium px-4 rounded-xl transition-colors">Add</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task Detail Modal ──────────────────────────────────────────
function TaskModal({ task, onClose, onSave, onDuplicate, categories, taskTypes }) {
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
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-3 py-0.5 rounded-full ${getUrgencyStyle(raw)}`}>
            {raw < 0
                ? `${Math.abs(Math.round(raw * 10)/10)} days overdue`
                : unit === "min" ? `${value} min left` : `${value} days left`}
            </span>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Task Name</label>
            <input value={name} onChange={e=>setName(e.target.value)}
              className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
                className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
            </div>
            <div className="w-36">
              <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Due Time</label>
              <input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)}
                className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Category <span className="text-[#E8735A]">*</span></label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c.name} onClick={()=>toggleCat(c.name)}
                  className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
                  style={selCats.includes(c.name) ? {background:c.bg,color:c.text,borderColor:c.border} : {background:"white",color:"#8C8880",borderColor:"#E5E2DE"}}>
                  {c.name}
                </button>
              ))}
            </div>
            {selCats.length === 0 && <p className="text-xs text-[#E8735A] mt-1">Please select at least one category</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-2">Type <span className="normal-case font-normal">(optional)</span></label>
            <div className="flex flex-wrap gap-2">
              {taskTypes.map(t => (
                <button key={t.id} onClick={()=>toggleType(t.name)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${selTypes.includes(t.name) ? "bg-[#1C1B19] text-white border-[#1C1B19]" : "bg-white text-[#8C8880] border-[#E5E2DE]"}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Notes</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add notes..."
              className="w-full h-24 text-sm text-[#1C1B19] bg-[#F7F5F2] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={()=>{onDuplicate(task);onClose();}}
            className="flex-1 bg-[#EFEDE9] hover:bg-[#E5E2DE] text-[#1C1B19] text-sm font-medium py-2 rounded-xl transition-colors">Duplicate</button>
          <button onClick={()=>{onSave(task.id,{name,dueDate,dueTime,categories:selCats,types:selTypes,notes});onClose();}}
            disabled={!canSave}
            className="flex-grow bg-[#E8735A] hover:bg-[#d4624a] disabled:opacity-40 text-white text-sm font-medium py-2 rounded-xl transition-colors">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Add Task Modal ─────────────────────────────────────────────
function AddTaskModal({ onClose, onAdd, categories, taskTypes, prefill }) {
  const [name, setName]         = useState(prefill?.name || "");
  const [dueDate, setDueDate]   = useState("");
  const [dueTime, setDueTime]   = useState(prefill?.due_time || "23:59");
  const [selCats, setSelCats]   = useState(prefill?.categories || []);
  const [selTypes, setSelTypes] = useState(prefill?.types || []);
  const [notes, setNotes]       = useState(prefill?.notes || "");
  const canSubmit = name.trim() && dueDate && selCats.length > 0;
  function toggleCat(c)  { setSelCats(s  => s.includes(c) ? s.filter(x=>x!==c) : [...s,c]); }
  function toggleType(t) { setSelTypes(s => s.includes(t) ? s.filter(x=>x!==t) : [...s,t]); }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <h2 className="text-lg font-semibold text-[#1C1B19] mb-5">{prefill ? "Duplicate Task" : "Add New Task"}</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Task Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Math HW 9"
              className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
                className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
            </div>
            <div className="w-36">
              <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Due Time</label>
              <input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)}
                className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Category <span className="text-[#E8735A]">*</span></label>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 && <p className="text-xs text-[#8C8880]">No categories yet — add some in Manage first!</p>}
              {categories.map(c => (
                <button key={c.name} onClick={()=>toggleCat(c.name)}
                  className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
                  style={selCats.includes(c.name) ? {background:c.bg,color:c.text,borderColor:c.border} : {background:"white",color:"#8C8880",borderColor:"#E5E2DE"}}>
                  {c.name}
                </button>
              ))}
            </div>
            {categories.length > 0 && selCats.length === 0 && <p className="text-xs text-[#E8735A] mt-1">Please select at least one category</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-2">Type <span className="normal-case font-normal">(optional)</span></label>
            <div className="flex flex-wrap gap-2">
              {taskTypes.map(t => (
                <button key={t.id} onClick={()=>toggleType(t.name)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${selTypes.includes(t.name) ? "bg-[#1C1B19] text-white border-[#1C1B19]" : "bg-white text-[#8C8880] border-[#E5E2DE]"}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Notes <span className="normal-case font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any extra details..."
              className="w-full h-20 text-sm bg-[#F7F5F2] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
          </div>
        </div>
        <button onClick={()=>{onAdd({name,dueDate,dueTime,categories:selCats,types:selTypes,done:false,notes});onClose();}}
          disabled={!canSubmit}
          className="mt-5 w-full bg-[#E8735A] hover:bg-[#d4624a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-xl transition-colors">
          {prefill ? "Add Duplicate" : "Add Task"}
        </button>
      </div>
    </div>
  );
}

// ── Main TaskList ──────────────────────────────────────────────
export default function TaskList({ tasks, updateTask, addTask, categories, addCategory, removeCategory, taskTypes, addTaskType, removeTaskType, onExcelImport }) {
  const [dateMode, setDateMode]             = useState("daysLeft");
  const [sortByCategory, setSortByCategory] = useState(false);
  const [showCompleted, setShowCompleted]   = useState(false);
  const [selectedTask, setSelectedTask]     = useState(null);
  const [showAddTask, setShowAddTask]       = useState(false);
  const [showManage, setShowManage]         = useState(false);
  const [duplicatePrefill, setDuplicatePrefill] = useState(null);

  const activeTasks = tasks.filter(t => !t.done).sort((a,b) => {
    if (sortByCategory) return (a.categories?.[0]||"").localeCompare(b.categories?.[0]||"");
    return new Date(`${a.due_date}T${a.due_time}:00`) - new Date(`${b.due_date}T${b.due_time}:00`);
  });
  const completedTasks = tasks.filter(t => t.done);

  function handleDuplicate(task) { setDuplicatePrefill(task); setShowAddTask(true); }

  return (
    <div className="min-h-screen bg-[#F7F5F2] p-8 font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[#1C1B19]">My Tasks</h1>
        <div className="flex gap-2 items-center">
            <label className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-[#1C1B19] text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer">
            ⬆ Import Excel
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
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-[#1C1B19] text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            ⚙ Manage
            </button>
            <button onClick={() => { setDuplicatePrefill(null); setShowAddTask(true); }}
            className="flex items-center gap-2 bg-[#E8735A] hover:bg-[#d4624a] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            + Add Task
            </button>
        </div>
    </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_80px] px-6 py-3 bg-[#EFEDE9] text-xs font-semibold text-[#8C8880] uppercase tracking-wide">
          <span>Task</span>
          <button onClick={()=>setDateMode(d=>d==="daysLeft"?"dueDate":"daysLeft")}
            className="flex items-center gap-1 hover:text-[#E8735A] transition-colors w-fit">
            {dateMode==="daysLeft"?"Days Left":"Due Date"} <span className="text-[10px] opacity-60">⇄</span>
          </button>
          <button onClick={()=>setSortByCategory(s=>!s)}
            className={`flex items-center gap-1 transition-colors w-fit ${sortByCategory?"text-[#E8735A]":"hover:text-[#E8735A]"}`}>
            Type <span className="text-[10px] opacity-60">{sortByCategory?"↑A":"⇅"}</span>
          </button>
          <span className="text-center">Done</span>
        </div>

        {activeTasks.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-[#8C8880]">
            No tasks yet — add your first one above! 🎉
          </div>
        )}

        {activeTasks.map(task => {
        const { value, unit, raw } = getTimeLeft(task.due_date, task.due_time);
          return (
            <div key={task.id} className="grid grid-cols-[2fr_1fr_1fr_80px] px-6 py-4 border-t border-gray-100 items-center hover:bg-[#FAFAF8] transition-colors">
              <span className="text-sm text-[#1C1B19] cursor-pointer hover:text-[#E8735A] transition-colors flex items-center gap-1"
                onClick={()=>setSelectedTask(task)}>
                {task.name} {task.notes && <span className="text-[10px] text-[#8C8880]">📝</span>}
              </span>
                <span className={`text-sm px-2 py-0.5 rounded-md w-fit ${getUrgencyStyle(raw)}`}>
                {dateMode === "daysLeft"
                    ? (raw < 0
                        ? `${Math.abs(Math.round(raw * 10) / 10)} days ago`
                        : unit === "min"
                        ? `${value} min`
                        : `${value} days`)
                    : new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              <div className="flex flex-wrap gap-1">
                {(task.categories||[]).map(c=><CategoryPill key={c} cat={c} categories={categories}/>)}
              </div>
              <div className="flex justify-center">
                <input type="checkbox" checked={task.done} onChange={()=>updateTask(task.id,{done:!task.done})}
                  className="w-4 h-4 accent-[#E8735A] cursor-pointer" />
              </div>
            </div>
          );
        })}

        <div className="px-6 py-3 border-t border-gray-100 text-center text-sm text-[#8C8880] hover:bg-[#EFEDE9] cursor-pointer transition-colors"
          onClick={()=>setShowCompleted(s=>!s)}>
          {showCompleted?"Hide":"Click to view"} completed tasks ({completedTasks.length})
        </div>

        {showCompleted && completedTasks.map(task=>(
          <div key={task.id} className="grid grid-cols-[2fr_1fr_1fr_80px] px-6 py-4 border-t border-gray-100 items-center bg-gray-50 opacity-60">
            <span className="text-sm text-gray-400 line-through">{task.name}</span>
            <span className="text-sm text-gray-400">
              {new Date(task.due_date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}
            </span>
            <div className="flex flex-wrap gap-1">
              {(task.categories||[]).map(c=><CategoryPill key={c} cat={c} categories={categories}/>)}
            </div>
            <div className="flex justify-center">
              <input type="checkbox" checked={task.done} onChange={()=>updateTask(task.id,{done:!task.done})}
                className="w-4 h-4 accent-[#E8735A] cursor-pointer" />
            </div>
          </div>
        ))}
      </div>

      {selectedTask && <TaskModal task={selectedTask} onClose={()=>setSelectedTask(null)} onSave={updateTask} onDuplicate={handleDuplicate} categories={categories} taskTypes={taskTypes}/>}
      {showAddTask && <AddTaskModal onClose={()=>{setShowAddTask(false);setDuplicatePrefill(null);}} onAdd={addTask} categories={categories} taskTypes={taskTypes} prefill={duplicatePrefill}/>}
      {showManage && <ManageModal categories={categories} addCategory={addCategory} removeCategory={removeCategory} taskTypes={taskTypes} addTaskType={addTaskType} removeTaskType={removeTaskType} onClose={()=>setShowManage(false)}/>}
    </div>
  );
}