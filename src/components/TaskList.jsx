import { useState, useEffect, useRef } from "react";

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
  if (rawDays < 0)       return "bg-[#EDD9CF] text-[#9B5B3A] font-semibold";
  if (rawDays <= 1/24)   return "bg-[#EDD9CF] text-[#9B5B3A] font-semibold";
  if (rawDays <= 5/1440) return "bg-[#EDD9CF] text-[#9B5B3A] font-semibold";
  if (rawDays <= 1)      return "bg-[#EDD9CF] text-[#9B5B3A] font-semibold";
  if (rawDays <= 5)      return "bg-[#F1F0C8] text-[#7A7230] font-semibold";
  return "bg-[#D9E0C8] text-[#4A5C35] font-semibold";
}

function CategoryPill({ cat, categories }) {
  const s = categories.find(c => c.name === cat) || { bg: "#E9ECCF", text: "#6B7255", border: "#C3C7A6" };
  return (
    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{cat}</span>
  );
}

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

// ── Color editor sub-form ──────────────────────────────────────
function CatColorForm({ name, bg, text, border, onNameChange, onBgChange, onTextChange, onBorderChange, bgTouched, userEditedText, userEditedBorder }) {
  return (
    <>
      <input value={name} onChange={e => onNameChange(e.target.value)} placeholder="e.g. Biology, Economics, Work"
        className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 text-[#3A4A28] placeholder:text-[#8A9170]" />
      <div className="flex gap-4 items-end flex-wrap">
        <label className="flex flex-col gap-1 text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px]">
          Background
          <input type="color" value={bg} onChange={e => onBgChange(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0" />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px]">
          <span className="flex items-center gap-1">Text {!userEditedText && bgTouched && <span className="text-[#4A5C35] text-[10px]">auto</span>}</span>
          <input type="color" value={text} onChange={e => onTextChange(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0" />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px]">
          <span className="flex items-center gap-1">Border {!userEditedBorder && bgTouched && <span className="text-[#4A5C35] text-[10px]">auto</span>}</span>
          <input type="color" value={border} onChange={e => onBorderChange(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0" />
        </label>
        <div className="flex flex-col gap-1 text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px]">
          Preview
          <span className="text-xs font-medium px-3 py-1 rounded-full mt-1" style={{ background: bg, color: text, border: `1px solid ${border}` }}>
            {name || "Preview"}
          </span>
        </div>
      </div>
      {bgTouched && (!userEditedText || !userEditedBorder) && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#D9E0C8] border border-[#C3C7A6]">
          <span className="text-[11px] text-[#6B7255]">Suggested from background:</span>
          {!userEditedText && (
            <span className="flex items-center gap-1 text-[11px] text-[#6B7255]">
              <span className="w-3.5 h-3.5 rounded-full border border-[#C3C7A6] inline-block" style={{ background: text }} />
              text
            </span>
          )}
          {!userEditedBorder && (
            <span className="flex items-center gap-1 text-[11px] text-[#6B7255]">
              <span className="w-3.5 h-3.5 rounded-full border border-[#C3C7A6] inline-block" style={{ background: border }} />
              border
            </span>
          )}
          <span className="text-[10px] text-[#8A9170] ml-auto">Edit the pickers above to override</span>
        </div>
      )}
    </>
  );
}

function ManageModal({ categories, addCategory, removeCategory, updateCategory, taskTypes, addTaskType, removeTaskType, onClose }) {
  const [tab, setTab]             = useState("categories");
  const [editingCatId, setEditingCatId] = useState(null);

  const [catName, setCatName]     = useState("");
  const [catBg, setCatBg]         = useState("#D9E0C8");
  const [catText, setCatText]     = useState("#4A5C35");
  const [catBorder, setCatBorder] = useState("#C3C7A6");
  const [bgTouched, setBgTouched] = useState(false);
  const [userEditedText, setUserEditedText]   = useState(false);
  const [userEditedBorder, setUserEditedBorder] = useState(false);

  const [editName, setEditName]     = useState("");
  const [editBg, setEditBg]         = useState("");
  const [editText, setEditText]     = useState("");
  const [editBorder, setEditBorder] = useState("");
  const [editBgTouched, setEditBgTouched]           = useState(false);
  const [editUserEditedText, setEditUserEditedText]   = useState(false);
  const [editUserEditedBorder, setEditUserEditedBorder] = useState(false);

  const [typeName, setTypeName] = useState("");
  const [saving, setSaving]     = useState(false);

  function startEdit(cat) {
    setEditingCatId(cat.id);
    setEditName(cat.name); setEditBg(cat.bg); setEditText(cat.text); setEditBorder(cat.border);
    setEditBgTouched(false); setEditUserEditedText(false); setEditUserEditedBorder(false);
  }

  function applyBgSuggest(hex, setB, setT, setBd, userT, userBd, setTouch) {
    setB(hex); setTouch(true);
    if (!userT) { const s = suggestFromBg(hex); setT(s.text); }
    if (!userBd) { const s = suggestFromBg(hex); setBd(s.border); }
  }

  async function handleAddCat() {
    if (!catName.trim() || categories.find(c => c.name === catName.trim())) return;
    setSaving(true);
    await addCategory({ name: catName.trim(), bg: catBg, text: catText, border: catBorder });
    setCatName(""); setSaving(false);
    setBgTouched(false); setUserEditedText(false); setUserEditedBorder(false);
    setCatBg("#D9E0C8"); setCatText("#4A5C35"); setCatBorder("#C3C7A6");
  }

  async function handleSaveEdit(id) {
    setSaving(true);
    await updateCategory(id, { name: editName.trim(), bg: editBg, text: editText, border: editBorder });
    setEditingCatId(null); setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-2xl shadow-xl w-[540px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[#8A9170] hover:text-[#3A4A28] text-xl">✕</button>
        <h2 style={lora} className="text-xl text-[#3A4A28] mb-4">Manage Categories & Types</h2>
        <div className="flex gap-2 mb-5">
          {["categories","types"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all ${tab===t ? "bg-[#4A5C35] text-[#EEF1DE]" : "bg-[#E9ECCF] text-[#6B7255] hover:bg-[#DDE0C0]"}`}>{t}</button>
          ))}
        </div>

        {tab === "categories" && (
          <div>
            {categories.length === 0 && (
              <p className="text-sm text-[#8A9170] mb-4">No categories yet. Add ones like <strong>Math</strong>, <strong>Biology</strong>, or <strong>Work</strong>.</p>
            )}
            <div className="flex flex-col gap-2 mb-5">
              {categories.map(cat => (
                <div key={cat.id}>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#E9ECCF]">
                    <span className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>{cat.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => editingCatId === cat.id ? setEditingCatId(null) : startEdit(cat)}
                        className="text-xs text-[#8A9170] hover:text-[#4A5C35]">
                        {editingCatId === cat.id ? "Cancel" : "Edit"}
                      </button>
                      <button onClick={() => removeCategory(cat.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    </div>
                  </div>
                  {editingCatId === cat.id && (
                    <div className="bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl p-4 flex flex-col gap-3 mt-1">
                      <p className="text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px]">Edit Category</p>
                      <CatColorForm
                        name={editName} bg={editBg} text={editText} border={editBorder}
                        bgTouched={editBgTouched} userEditedText={editUserEditedText} userEditedBorder={editUserEditedBorder}
                        onNameChange={setEditName}
                        onBgChange={hex => applyBgSuggest(hex, setEditBg, setEditText, setEditBorder, editUserEditedText, editUserEditedBorder, setEditBgTouched)}
                        onTextChange={v => { setEditText(v); setEditUserEditedText(true); }}
                        onBorderChange={v => { setEditBorder(v); setEditUserEditedBorder(true); }}
                      />
                      <button onClick={() => handleSaveEdit(cat.id)} disabled={!editName.trim() || saving}
                        className="bg-[#4A5C35] hover:bg-[#3D4D2C] disabled:opacity-40 text-[#EEF1DE] text-sm font-semibold py-2 rounded-xl transition-colors">
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl p-4 flex flex-col gap-3">
              <p className="text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px]">New Category</p>
              <CatColorForm
                name={catName} bg={catBg} text={catText} border={catBorder}
                bgTouched={bgTouched} userEditedText={userEditedText} userEditedBorder={userEditedBorder}
                onNameChange={setCatName}
                onBgChange={hex => applyBgSuggest(hex, setCatBg, setCatText, setCatBorder, userEditedText, userEditedBorder, setBgTouched)}
                onTextChange={v => { setCatText(v); setUserEditedText(true); }}
                onBorderChange={v => { setCatBorder(v); setUserEditedBorder(true); }}
              />
              <button onClick={handleAddCat} disabled={!catName.trim() || saving}
                className="bg-[#4A5C35] hover:bg-[#3D4D2C] disabled:opacity-40 text-[#EEF1DE] text-sm font-semibold py-2 rounded-xl transition-colors">
                {saving ? "Saving..." : "+ Add Category"}
              </button>
            </div>
          </div>
        )}

        {tab === "types" && (
          <div>
            <div className="flex flex-wrap gap-2 mb-5">
              {taskTypes.map(t => (
                <div key={t.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E9ECCF] border border-[#C3C7A6] text-sm text-[#3A4A28]">
                  {t.name}
                  <button onClick={() => removeTaskType(t.id)} className="text-[#8A9170] hover:text-red-500 text-xs">✕</button>
                </div>
              ))}
            </div>
            <div className="bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl p-4 flex gap-3">
              <input value={typeName} onChange={e => setTypeName(e.target.value)}
                onKeyDown={async e => { if (e.key==="Enter" && typeName.trim()) { await addTaskType(typeName.trim()); setTypeName(""); }}}
                placeholder="New type (e.g. Workout)"
                className="flex-1 text-sm bg-[#EEF1DE] border border-[#C3C7A6] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 text-[#3A4A28] placeholder:text-[#8A9170]" />
              <button onClick={async () => { if (typeName.trim()) { await addTaskType(typeName.trim()); setTypeName(""); }}}
                disabled={!typeName.trim()}
                className="bg-[#4A5C35] hover:bg-[#3D4D2C] disabled:opacity-40 text-[#EEF1DE] text-sm font-semibold px-4 rounded-xl transition-colors">Add</button>
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
      <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-2xl shadow-xl w-[500px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[#8A9170] hover:text-[#3A4A28] text-xl">✕</button>
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-3 py-0.5 rounded-full ${getUrgencyStyle(raw)}`}>
            {raw < 0
              ? `${Math.abs(Math.round(raw * 10)/10)} days overdue`
              : unit === "min" ? `${value} min left` : `${value} days left`}
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Task Name</label>
            <input value={name} onChange={e=>setName(e.target.value)}
              className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 text-[#3A4A28]" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
                className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 text-[#3A4A28]" />
            </div>
            <div className="w-36">
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Due Time</label>
              <input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)}
                className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 text-[#3A4A28]" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Category <span className="text-[#4A5C35]">*</span></label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c.name} onClick={()=>toggleCat(c.name)}
                  className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
                  style={selCats.includes(c.name) ? {background:c.bg,color:c.text,borderColor:c.border} : {background:"#E9ECCF",color:"#6B7255",borderColor:"#C3C7A6"}}>
                  {c.name}
                </button>
              ))}
            </div>
            {selCats.length === 0 && <p className="text-xs text-[#4A5C35] mt-1">Please select at least one category</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-2">Type <span className="normal-case font-normal">(optional)</span></label>
            <div className="flex flex-wrap gap-2">
              {taskTypes.map(t => (
                <button key={t.id} onClick={()=>toggleType(t.name)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${selTypes.includes(t.name) ? "bg-[#4A5C35] text-[#EEF1DE] border-[#4A5C35]" : "bg-[#E9ECCF] text-[#6B7255] border-[#C3C7A6]"}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Notes</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add notes..."
              className="w-full h-24 text-sm text-[#3A4A28] bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#4A5C35]/40 placeholder:text-[#8A9170]" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={()=>{onDuplicate(task);onClose();}}
            className="flex-1 bg-[#E9ECCF] hover:bg-[#DDE0C0] border border-[#C3C7A6] text-[#3A4A28] text-sm font-semibold py-2 rounded-xl transition-colors">Duplicate</button>
          <button onClick={()=>{onSave(task.id,{name,dueDate,dueTime,categories:selCats,types:selTypes,notes});onClose();}}
            disabled={!canSave}
            className="flex-grow bg-[#4A5C35] hover:bg-[#3D4D2C] disabled:opacity-40 text-[#EEF1DE] text-sm font-semibold py-2 rounded-xl transition-colors">Save Changes</button>
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
      <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-2xl shadow-xl w-[500px] max-h-[85vh] overflow-y-auto p-6 relative" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[#8A9170] hover:text-[#3A4A28] text-xl">✕</button>
        <h2 style={lora} className="text-xl text-[#3A4A28] mb-5">{prefill ? "Duplicate Task" : "Add New Task"}</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Task Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Math HW 9"
              className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 text-[#3A4A28] placeholder:text-[#8A9170]" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
                className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 text-[#3A4A28]" />
            </div>
            <div className="w-36">
              <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Due Time</label>
              <input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)}
                className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 text-[#3A4A28]" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Category <span className="text-[#4A5C35]">*</span></label>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 && <p className="text-xs text-[#8A9170]">No categories yet — add some in Manage first!</p>}
              {categories.map(c => (
                <button key={c.name} onClick={()=>toggleCat(c.name)}
                  className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
                  style={selCats.includes(c.name) ? {background:c.bg,color:c.text,borderColor:c.border} : {background:"#E9ECCF",color:"#6B7255",borderColor:"#C3C7A6"}}>
                  {c.name}
                </button>
              ))}
            </div>
            {categories.length > 0 && selCats.length === 0 && <p className="text-xs text-[#4A5C35] mt-1">Please select at least one category</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-2">Type <span className="normal-case font-normal">(optional)</span></label>
            <div className="flex flex-wrap gap-2">
              {taskTypes.map(t => (
                <button key={t.id} onClick={()=>toggleType(t.name)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${selTypes.includes(t.name) ? "bg-[#4A5C35] text-[#EEF1DE] border-[#4A5C35]" : "bg-[#E9ECCF] text-[#6B7255] border-[#C3C7A6]"}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Notes <span className="normal-case font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any extra details..."
              className="w-full h-20 text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#4A5C35]/40 text-[#3A4A28] placeholder:text-[#8A9170]" />
          </div>
        </div>
        <button onClick={()=>{onAdd({name,dueDate,dueTime,categories:selCats,types:selTypes,done:false,notes});onClose();}}
          disabled={!canSubmit}
          className="mt-5 w-full bg-[#4A5C35] hover:bg-[#3D4D2C] disabled:opacity-40 disabled:cursor-not-allowed text-[#EEF1DE] text-sm font-semibold py-2.5 rounded-xl transition-colors">
          {prefill ? "Add Duplicate" : "Add Task"}
        </button>
      </div>
    </div>
  );
}

// ── Main TaskList ──────────────────────────────────────────────
export default function TaskList({ tasks, updateTask, addTask, categories, addCategory, removeCategory, updateCategory, taskTypes, addTaskType, removeTaskType, onExcelImport, deleteAllCompleted }) {
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

  const activeTasks = tasks.filter(t => !t.done).sort((a,b) => {
    if (sortByCategory) return (a.categories?.[0]||"").localeCompare(b.categories?.[0]||"");
    return new Date(`${a.due_date}T${a.due_time}:00`) - new Date(`${b.due_date}T${b.due_time}:00`);
  });
  const completedTasks = tasks.filter(t => t.done);

  function handleDuplicate(task) { setDuplicatePrefill(task); setShowAddTask(true); }

  function handleCheckDone(taskId) {
    if (animatingOut.includes(taskId)) return;
    setAnimatingOut(prev => [...prev, taskId]);
    setTimeout(() => {
      updateTask(taskId, { done: true });
      setAnimatingOut(prev => prev.filter(id => id !== taskId));
      undoStack.current = [...undoStack.current, taskId];
    }, 700);
  }

  const urgencyBar = (raw) => {
    if (raw < 0)  return "bg-[#C49A8A]";
    if (raw <= 1) return "bg-[#C4A87A]";
    if (raw <= 5) return "bg-[#B8BD7A]";
    return "bg-[#84A87A]";
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-[#F7F8EE]">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[11px] font-bold text-[#8A9170] uppercase tracking-[0.15em] mb-1">{today}</p>
            <h1 style={lora} className="text-4xl text-[#3A4A28] leading-tight">My Tasks</h1>
          </div>
          <div className="flex gap-2 items-center mt-2">
            <label className="flex items-center gap-1.5 bg-[#E9ECCF] border border-[#C3C7A6] hover:bg-[#DDE0C0] text-[#6B7255] text-xs font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer">
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
              className="flex items-center gap-1.5 bg-[#E9ECCF] border border-[#C3C7A6] hover:bg-[#DDE0C0] text-[#6B7255] text-xs font-semibold px-3.5 py-2 rounded-xl transition-all">
              Manage
            </button>
            <button onClick={() => { setDuplicatePrefill(null); setShowAddTask(true); }}
              className="flex items-center gap-1.5 bg-[#4A5C35] hover:bg-[#3D4D2C] text-[#EEF1DE] text-xs font-semibold px-4 py-2 rounded-xl transition-all">
              + Add Task
            </button>
          </div>
        </div>

        {/* ── Sort / view controls ── */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] font-bold text-[#8A9170] uppercase tracking-wider mr-1">Sort</span>
          <button onClick={() => setSortByCategory(false)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${!sortByCategory ? "bg-[#4A5C35] text-[#EEF1DE] border-[#4A5C35]" : "bg-[#E9ECCF] text-[#6B7255] border-[#C3C7A6] hover:bg-[#DDE0C0]"}`}>
            Due date
          </button>
          <button onClick={() => setSortByCategory(true)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${sortByCategory ? "bg-[#4A5C35] text-[#EEF1DE] border-[#4A5C35]" : "bg-[#E9ECCF] text-[#6B7255] border-[#C3C7A6] hover:bg-[#DDE0C0]"}`}>
            Category
          </button>
          <button onClick={() => setDateMode(d => d === "daysLeft" ? "dueDate" : "daysLeft")}
            className="ml-auto text-[11px] text-[#8A9170] hover:text-[#4A5C35] transition-colors flex items-center gap-1 font-medium">
            {dateMode === "daysLeft" ? "Showing days left" : "Showing due date"} <span className="opacity-70">⇄</span>
          </button>
        </div>

        {/* ── Task cards ── */}
        <div className="flex flex-col gap-2.5">
          {activeTasks.length === 0 && (
            <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-2xl px-6 py-14 text-center">
              <p className="text-sm text-[#8A9170]">No tasks yet — add your first one above!</p>
            </div>
          )}

          {activeTasks.map(task => {
            const { value, unit, raw } = getTimeLeft(task.due_date, task.due_time);
            const isAnimating = animatingOut.includes(task.id);
            return (
              <div key={task.id}
                className={`bg-[#F4F5E8] rounded-2xl border border-[#C3C7A6] overflow-hidden transition-opacity duration-500 ${isAnimating ? "opacity-25" : "hover:border-[#A8B090] hover:shadow-sm"}`}>
                <div className="flex items-stretch">
                  {/* Urgency accent bar */}
                  <div className={`w-1 flex-shrink-0 ${urgencyBar(raw)}`} />
                  {/* Content */}
                  <div className="flex items-center gap-4 px-4 py-3.5 flex-1 min-w-0">
                    {/* Name + pills */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium leading-snug ${isAnimating ? "line-through text-[#8A9170]" : "text-[#3A4A28] cursor-pointer hover:text-[#4A5C35]"} transition-colors`}
                        onClick={() => !isAnimating && setSelectedTask(task)}>
                        {task.name}{task.notes && <span className="text-[10px] text-[#8A9170] ml-1">·</span>}
                      </div>
                      {(task.categories || []).length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1.5 ${isAnimating ? "opacity-40" : ""}`}>
                          {task.categories.map(c => <CategoryPill key={c} cat={c} categories={categories} />)}
                        </div>
                      )}
                    </div>
                    {/* Date badge */}
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium flex-shrink-0 ${isAnimating ? "line-through text-[#8A9170] bg-[#E9ECCF]" : getUrgencyStyle(raw)}`}>
                      {dateMode === "daysLeft"
                        ? (raw < 0 ? `${Math.abs(Math.round(raw * 10) / 10)}d ago` : unit === "min" ? `${value}m` : `${value}d`)
                        : new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {/* Checkbox */}
                    <input type="checkbox" checked={isAnimating || task.done}
                      onChange={() => !isAnimating && handleCheckDone(task.id)}
                      disabled={isAnimating}
                      className="w-4 h-4 accent-[#4A5C35] cursor-pointer disabled:cursor-default flex-shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Completed section ── */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <button className="flex items-center gap-1.5 text-xs text-[#8A9170] hover:text-[#4A5C35] transition-colors font-medium"
              onClick={() => setShowCompleted(s => !s)}>
              <span className="text-[10px]">{showCompleted ? "▾" : "▸"}</span>
              Completed · {completedTasks.length}
            </button>
            {completedTasks.length > 0 && (
              <button onClick={() => setShowClearConfirm(true)}
                className="text-[11px] text-[#8A9170] hover:text-red-400 transition-colors">
                Clear all
              </button>
            )}
          </div>

          {showCompleted && (
            <div className="flex flex-col gap-2">
              {completedTasks.map(task => (
                <div key={task.id} className="bg-[#F4F5E8]/60 rounded-xl border border-[#C3C7A6] overflow-hidden opacity-55 hover:opacity-75 transition-opacity">
                  <div className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-[#8A9170] line-through">{task.name}</span>
                      {(task.categories || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.categories.map(c => <CategoryPill key={c} cat={c} categories={categories} />)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[#8A9170] flex-shrink-0">
                      {new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <input type="checkbox" checked={task.done} onChange={() => updateTask(task.id, { done: !task.done })}
                      className="w-4 h-4 accent-[#4A5C35] cursor-pointer flex-shrink-0" />
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
          <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 style={lora} className="text-xl text-[#3A4A28] mb-2">Clear all completed tasks?</h3>
            <p className="text-sm text-[#8A9170] mb-6">This will permanently delete all {completedTasks.length} completed task{completedTasks.length !== 1 ? "s" : ""}.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)}
                className="flex-1 text-sm text-[#6B7255] border border-[#C3C7A6] bg-[#E9ECCF] py-2 rounded-xl hover:bg-[#DDE0C0] transition-colors">
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

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} onSave={updateTask} onDuplicate={handleDuplicate} categories={categories} taskTypes={taskTypes} />}
      {showAddTask && <AddTaskModal onClose={() => { setShowAddTask(false); setDuplicatePrefill(null); }} onAdd={addTask} categories={categories} taskTypes={taskTypes} prefill={duplicatePrefill} />}
      {showManage && <ManageModal categories={categories} addCategory={addCategory} removeCategory={removeCategory} updateCategory={updateCategory} taskTypes={taskTypes} addTaskType={addTaskType} removeTaskType={removeTaskType} onClose={() => setShowManage(false)} />}
    </div>
  );
}
