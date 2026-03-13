import { useState, useEffect } from "react";

// ── Color helpers ────────────────────────────────────────────────
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

function getLuminance(hex) {
  if (!hex || hex.length < 7) return 0.5;
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const toLinear = c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  return 0.2126*toLinear(r) + 0.7152*toLinear(g) + 0.0722*toLinear(b);
}

function shiftLightness(hex, delta) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(5, Math.min(95, l + delta)));
}

// ── Constants ────────────────────────────────────────────────────
const MODES = {
  pomodoro:   { label: "Pomodoro",    default: 25, max: 60 },
  shortBreak: { label: "Short Break", default: 5,  max: 30 },
  longBreak:  { label: "Long Break",  default: 15, max: 60 },
};

const DEFAULT_COLORS = [
  { id: "baby-pink", hex: "#F9C4CF", name: "Baby Pink" },
  { id: "plum",      hex: "#4D1F5A", name: "Plum" },
  { id: "navy",      hex: "#1D3557", name: "Navy" },
  { id: "mint",      hex: "#D4EDD4", name: "Mint" },
  { id: "cyan",      hex: "#9CF6F6", name: "Cyan" },
  { id: "yellow",    hex: "#FFF07C", name: "Yellow" },
  { id: "red",       hex: "#BF4342", name: "Red" },
];

function loadSavedColors() {
  try { return JSON.parse(localStorage.getItem("pomo_colors") || "null") || DEFAULT_COLORS; }
  catch { return DEFAULT_COLORS; }
}

function loadBgImages() {
  try { return JSON.parse(localStorage.getItem("pomo_images") || "[]"); }
  catch { return []; }
}

// ── Pomodoro ─────────────────────────────────────────────────────
export default function Pomodoro({ tasks = [] }) {
  const [mode, setMode]               = useState("pomodoro");
  const [durations, setDurations]     = useState({ pomodoro: 25, shortBreak: 5, longBreak: 15 });
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning]         = useState(false);
  const [editing, setEditing]         = useState(false);
  const [editValue, setEditValue]     = useState("");

  // Theme
  const [bgColor, setBgColor]         = useState("#F9C4CF");
  const [bgImage, setBgImage]         = useState(() => localStorage.getItem("pomo_bg_image") || null);
  const [savedColors, setSavedColors] = useState(loadSavedColors);
  const [bgImages, setBgImages]       = useState(loadBgImages);

  // Palette UI
  const [showPalette, setShowPalette]       = useState(false);
  const [editingPalette, setEditingPalette] = useState(false);
  const [paletteTab, setPaletteTab]         = useState("colors");
  const [customColor, setCustomColor]       = useState("#ffffff");

  // Quick checklist
  const [quickNotes, setQuickNotes] = useState([]);
  const [quickInput, setQuickInput] = useState("");
  const [checked, setChecked]       = useState({});

  // Timer tick
  useEffect(() => {
    if (!running) return;
    if (secondsLeft === 0) { setRunning(false); return; }
    const id = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running, secondsLeft]);

  // Persist
  useEffect(() => { localStorage.setItem("pomo_colors", JSON.stringify(savedColors)); }, [savedColors]);
  useEffect(() => { localStorage.setItem("pomo_images", JSON.stringify(bgImages)); }, [bgImages]);
  useEffect(() => {
    if (bgImage) localStorage.setItem("pomo_bg_image", bgImage);
    else localStorage.removeItem("pomo_bg_image");
  }, [bgImage]);

  function switchMode(m) {
    setMode(m); setRunning(false); setEditing(false);
    setSecondsLeft(durations[m] * 60);
  }

  function handleDoubleClick() {
    if (running) return;
    setEditValue(String(durations[mode]));
    setEditing(true);
  }

  function commitEdit() {
    const val = parseInt(editValue, 10);
    const max = MODES[mode].max;
    if (!isNaN(val) && val >= 1) {
      const clamped = Math.min(val, max);
      setDurations(d => ({ ...d, [mode]: clamped }));
      setSecondsLeft(clamped * 60);
    }
    setEditing(false);
  }

  function reset() { setRunning(false); setEditing(false); setSecondsLeft(durations[mode] * 60); }

  function addCustomColor() {
    const id = `custom-${Date.now()}`;
    setSavedColors(p => [...p, { id, hex: customColor, name: "My color" }]);
    setBgColor(customColor);
    setBgImage(null);
    setShowPalette(false);
  }

  function deleteColor(id) { setSavedColors(p => p.filter(c => c.id !== id)); }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target.result;
      const newImgs = [...bgImages, { id: `img-${Date.now()}`, url, name: file.name }];
      setBgImages(newImgs);
      setBgImage(url);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function deleteImage(id) {
    const img = bgImages.find(i => i.id === id);
    if (img && bgImage === img.url) setBgImage(null);
    setBgImages(p => p.filter(i => i.id !== id));
  }

  // Top 3 upcoming tasks
  const upcomingTasks = tasks
    .filter(t => !t.done && t.due_date)
    .sort((a,b) => new Date(`${a.due_date}T${a.due_time||"23:59"}`) - new Date(`${b.due_date}T${b.due_time||"23:59"}`))
    .slice(0, 3);

  const checklistItems = [
    ...upcomingTasks.map(t => ({ id: t.id, label: t.name, dueDate: t.due_date })),
    ...quickNotes.map(n => ({ id: n.id, label: n.label, dueDate: null })),
  ];

  // Derived display
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const done = secondsLeft === 0;

  // Color system
  const isDark     = bgImage ? true : getLuminance(bgColor) < 0.4;
  const textColor  = isDark ? "#FFFFFF" : "#1C1B19";
  const mutedColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)";
  const tabActive  = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)";
  const cardBg     = bgImage
    ? "rgba(255,255,255,0.18)"
    : (isDark ? shiftLightness(bgColor, -6) : shiftLightness(bgColor, 6));
  const startBg    = isDark ? "#FFFFFF" : "#1C1B19";
  const startText  = isDark ? bgColor   : "#FFFFFF";
  const resetBorder = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";
  const panelBg    = isDark ? "rgba(20,10,25,0.88)" : "rgba(255,255,255,0.95)";
  const panelText  = isDark ? "#fff" : "#1C1B19";

  const bgStyle = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: bgColor };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center font-sans relative transition-colors duration-500 select-none pb-12"
      style={bgStyle}
      onMouseDown={() => showPalette && setShowPalette(false)}
    >
      {/* Top-right buttons */}
      <div className="absolute top-6 right-8 flex gap-2" onMouseDown={e => e.stopPropagation()}>
        {/* Image upload */}
        <label
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-opacity hover:opacity-80 cursor-pointer"
          style={{ background: tabActive, color: textColor }}
          title="Upload background image"
        >
          🖼
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>

        {/* Color palette toggle */}
        <button
          onClick={() => setShowPalette(p => !p)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-opacity hover:opacity-80"
          style={{ background: tabActive, color: textColor }}
          title="Customize theme"
        >
          🎨
        </button>

        {/* Palette panel */}
        {showPalette && (
          <div
            className="absolute right-0 top-12 rounded-2xl shadow-2xl p-4 w-72 z-50"
            style={{ background: panelBg, backdropFilter: "blur(16px)" }}
          >
            {/* Tab bar + Edit toggle */}
            <div className="flex items-center gap-1 mb-3">
              {["colors","images"].map(t => (
                <button key={t} onClick={() => setPaletteTab(t)}
                  className="px-3 py-1 rounded-full text-xs capitalize font-medium transition-all"
                  style={{
                    background: paletteTab === t ? panelText : "transparent",
                    color: paletteTab === t ? panelBg : mutedColor
                  }}
                >{t}</button>
              ))}
              <button
                onClick={() => setEditingPalette(p => !p)}
                className="ml-auto text-xs px-2 py-1 rounded-full transition-all"
                style={{ color: mutedColor }}
              >{editingPalette ? "Done" : "Edit"}</button>
            </div>

            {paletteTab === "colors" && (
              <>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {savedColors.map(c => (
                    <div key={c.id} className="relative flex items-center justify-center">
                      <button
                        onClick={() => { if (!editingPalette) { setBgColor(c.hex); setBgImage(null); setShowPalette(false); }}}
                        title={c.name}
                        className="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                        style={{ background: c.hex, borderColor: !bgImage && bgColor === c.hex ? panelText : "transparent" }}
                      >
                        {!bgImage && bgColor === c.hex && !editingPalette && (
                          <span style={{ color: getLuminance(c.hex) < 0.4 ? "#fff" : "#000", fontSize: "11px", fontWeight: 700 }}>✓</span>
                        )}
                      </button>
                      {editingPalette && (
                        <button onClick={() => deleteColor(c.id)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-10"
                          style={{ fontSize: "10px", lineHeight: 1 }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}` }}>
                  <span className="text-xs flex-1" style={{ color: mutedColor }}>Add custom</span>
                  <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border-0" />
                  <button onClick={addCustomColor}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium"
                    style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)", color: panelText }}>
                    + Add
                  </button>
                </div>
              </>
            )}

            {paletteTab === "images" && (
              <>
                {bgImages.length === 0 && (
                  <p className="text-xs mb-3" style={{ color: mutedColor }}>No saved images. Use the 🖼 button to upload one.</p>
                )}
                <div className="grid grid-cols-2 gap-2 mb-3 max-h-44 overflow-y-auto">
                  {bgImages.map(img => (
                    <div key={img.id} className="relative">
                      <button
                        onClick={() => { if (!editingPalette) { setBgImage(img.url); setShowPalette(false); }}}
                        className="w-full h-16 rounded-xl overflow-hidden border-2 transition-all"
                        style={{ borderColor: bgImage === img.url ? panelText : "transparent" }}
                      >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      </button>
                      {editingPalette && (
                        <button onClick={() => deleteImage(img.id)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-10"
                          style={{ fontSize: "10px" }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
                {bgImage && (
                  <button onClick={() => setBgImage(null)}
                    className="w-full text-xs py-1.5 rounded-lg transition-all"
                    style={{ background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", color: panelText }}>
                    Remove background image
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 rounded-2xl p-1 mb-10" style={{ background: "rgba(0,0,0,0.12)" }}>
        {Object.entries(MODES).map(([key, { label }]) => (
          <button key={key} onClick={() => switchMode(key)}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: mode === key ? tabActive : "transparent", color: textColor, fontWeight: mode === key ? 600 : 400 }}
          >{label}</button>
        ))}
      </div>

      {/* Timer card */}
      <div
        className="rounded-3xl px-16 py-12 flex flex-col items-center shadow-lg backdrop-blur-sm"
        style={{ background: cardBg }}
      >
        <div className="mb-8 flex flex-col items-center" onDoubleClick={handleDoubleClick}
          title={!running ? `Double-click to edit · max ${MODES[mode].max} min` : undefined}
        >
          {editing ? (
            <div className="flex items-end gap-2">
              <input autoFocus type="number" min="1" max={MODES[mode].max} value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => { if (e.key==="Enter") commitEdit(); if (e.key==="Escape") setEditing(false); }}
                onBlur={commitEdit}
                className="text-center bg-transparent border-b-2 outline-none w-36 font-bold"
                style={{ color: textColor, borderColor: textColor, fontSize: "5rem", lineHeight: 1 }} />
              <span className="text-2xl font-medium mb-3" style={{ color: mutedColor }}>min</span>
            </div>
          ) : (
            <span className="font-bold tabular-nums"
              style={{ color: textColor, fontSize: "6rem", lineHeight: 1, cursor: running ? "default" : "text", letterSpacing: "-2px" }}>
              {mins}:{secs}
            </span>
          )}
          {done && <p className="text-sm font-medium mt-3" style={{ color: textColor }}>Time&apos;s up! Great work 🎉</p>}
          {!running && !editing && !done && (
            <p className="text-xs mt-2" style={{ color: mutedColor }}>Double-click to edit · max {MODES[mode].max} min</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => { setRunning(r => !r); setEditing(false); }}
            className="px-12 py-3 rounded-2xl font-bold uppercase tracking-widest text-sm shadow transition-all hover:opacity-90 active:scale-95"
            style={{ background: startBg, color: startText }}>
            {running ? "Pause" : done ? "Restart" : "Start"}
          </button>
          <button onClick={reset}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition-all hover:opacity-80"
            style={{ color: textColor, border: `2px solid ${resetBorder}` }} title="Reset">
            ↺
          </button>
        </div>
      </div>

      <p className="mt-6 text-sm" style={{ color: mutedColor }}>
        {mode === "pomodoro" ? "Focus session · stay off your phone!" : "Take a breather 🌿"}
      </p>

      {/* Quick checklist */}
      <div className="mt-8 w-80 rounded-2xl p-4 backdrop-blur-sm" style={{ background: cardBg }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: mutedColor }}>Up Next</p>

        {checklistItems.length === 0 && (
          <p className="text-xs mb-2" style={{ color: mutedColor }}>No upcoming tasks — add a quick note below.</p>
        )}

        {checklistItems.map(item => {
          const isChecked = !!checked[item.id];
          const daysLeft = item.dueDate
            ? Math.ceil((new Date(`${item.dueDate}T23:59:00`) - new Date()) / (1000*60*60*24))
            : null;
          return (
            <div key={item.id} className="flex items-center gap-2 py-1.5">
              <button
                onClick={() => setChecked(c => ({ ...c, [item.id]: !c[item.id] }))}
                className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{ borderColor: isChecked ? textColor : mutedColor, background: isChecked ? textColor : "transparent" }}>
                {isChecked && <span style={{ color: isDark ? "#000" : "#fff", fontSize: "9px", lineHeight: 1 }}>✓</span>}
              </button>
              <span className="text-sm flex-1 truncate"
                style={{ color: isChecked ? mutedColor : textColor, textDecoration: isChecked ? "line-through" : "none" }}>
                {item.label}
              </span>
              {daysLeft !== null && (
                <span className="text-xs flex-shrink-0" style={{ color: mutedColor }}>
                  {daysLeft <= 0 ? "today" : `${daysLeft}d`}
                </span>
              )}
            </div>
          );
        })}

        {/* Add quick note */}
        <div className="flex items-center gap-2 mt-2 pt-2"
          style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}` }}>
          <span style={{ color: mutedColor, fontSize: "14px" }}>+</span>
          <input
            type="text"
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && quickInput.trim()) {
                setQuickNotes(n => [...n, { id: `q-${Date.now()}`, label: quickInput.trim() }]);
                setQuickInput("");
              }
            }}
            placeholder="Quick note (not saved)"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: textColor }}
          />
          {quickInput.trim() && (
            <button
              onClick={() => { setQuickNotes(n => [...n, { id: `q-${Date.now()}`, label: quickInput.trim() }]); setQuickInput(""); }}
              className="text-xs px-2 py-0.5 rounded-lg"
              style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)", color: textColor }}>
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
