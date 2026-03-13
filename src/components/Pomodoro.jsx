import { useState, useEffect } from "react";

// ── Color helpers ───────────────────────────────────────────────
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

// ── Constants ───────────────────────────────────────────────────
const MODES = {
  pomodoro:   { label: "Pomodoro",    default: 25, max: 60 },
  shortBreak: { label: "Short Break", default: 5,  max: 30 },
  longBreak:  { label: "Long Break",  default: 15, max: 60 },
};

const COLOR_PRESETS = [
  { name: "Coral",    hex: "#E8735A" },
  { name: "Ocean",    hex: "#4A7FB5" },
  { name: "Forest",   hex: "#4A8C5C" },
  { name: "Lavender", hex: "#7B68C8" },
  { name: "Slate",    hex: "#4A5568" },
  { name: "Sunset",   hex: "#D4845A" },
  { name: "Teal",     hex: "#3B8E8E" },
  { name: "Rose",     hex: "#C26B8A" },
];

// ── Pomodoro ────────────────────────────────────────────────────
export default function Pomodoro() {
  const [mode, setMode]             = useState("pomodoro");
  const [durations, setDurations]   = useState({ pomodoro: 25, shortBreak: 5, longBreak: 15 });
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning]       = useState(false);
  const [editing, setEditing]       = useState(false);
  const [editValue, setEditValue]   = useState("");
  const [bgColor, setBgColor]       = useState("#E8735A");
  const [showPalette, setShowPalette] = useState(false);

  // Timer tick
  useEffect(() => {
    if (!running) return;
    if (secondsLeft === 0) { setRunning(false); return; }
    const id = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running, secondsLeft]);

  function switchMode(m) {
    setMode(m);
    setRunning(false);
    setEditing(false);
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

  function reset() {
    setRunning(false);
    setEditing(false);
    setSecondsLeft(durations[mode] * 60);
  }

  // Derived display
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const done = secondsLeft === 0;

  // Color system
  const isDark     = getLuminance(bgColor) < 0.4;
  const textColor  = isDark ? "#FFFFFF" : "#1C1B19";
  const mutedColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)";
  const tabActive  = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)";
  const cardBg     = isDark ? shiftLightness(bgColor, -6) : shiftLightness(bgColor, 6);
  const startBg    = isDark ? "#FFFFFF" : "#1C1B19";
  const startText  = isDark ? bgColor   : "#FFFFFF";
  const resetBorder = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center font-sans relative transition-colors duration-500 select-none"
      style={{ background: bgColor }}
      onMouseDown={() => showPalette && setShowPalette(false)}
    >
      {/* Palette button */}
      <div className="absolute top-6 right-8" onMouseDown={e => e.stopPropagation()}>
        <button
          onClick={() => setShowPalette(p => !p)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-opacity hover:opacity-80"
          style={{ background: tabActive, color: textColor }}
          title="Customize theme color"
        >
          🎨
        </button>

        {showPalette && (
          <div
            className="absolute right-0 top-12 rounded-2xl shadow-2xl p-4 w-60 z-50"
            style={{ background: cardBg }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: mutedColor }}>
              Theme Color
            </p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {COLOR_PRESETS.map(p => (
                <button
                  key={p.hex}
                  onClick={() => { setBgColor(p.hex); setShowPalette(false); }}
                  title={p.name}
                  className="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                  style={{
                    background: p.hex,
                    borderColor: bgColor === p.hex ? textColor : "transparent",
                  }}
                >
                  {bgColor === p.hex && (
                    <span className="text-xs font-bold" style={{ color: getLuminance(p.hex) < 0.4 ? "#fff" : "#000" }}>✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs flex-1" style={{ color: mutedColor }}>Custom</span>
              <input
                type="color"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="w-10 h-8 rounded cursor-pointer border-0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 rounded-2xl p-1 mb-10" style={{ background: "rgba(0,0,0,0.1)" }}>
        {Object.entries(MODES).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: mode === key ? tabActive : "transparent",
              color: textColor,
              fontWeight: mode === key ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timer card */}
      <div
        className="rounded-3xl px-16 py-12 flex flex-col items-center shadow-lg"
        style={{ background: cardBg }}
      >
        {/* Timer display */}
        <div
          className="mb-8 flex flex-col items-center"
          onDoubleClick={handleDoubleClick}
          title={!running ? `Double-click to edit · max ${MODES[mode].max} min` : undefined}
        >
          {editing ? (
            <div className="flex items-end gap-2">
              <input
                autoFocus
                type="number"
                min="1"
                max={MODES[mode].max}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") { setEditing(false); }
                }}
                onBlur={commitEdit}
                className="text-center bg-transparent border-b-2 outline-none w-36 font-bold"
                style={{ color: textColor, borderColor: textColor, fontSize: "5rem", lineHeight: 1 }}
              />
              <span className="text-2xl font-medium mb-3" style={{ color: mutedColor }}>min</span>
            </div>
          ) : (
            <span
              className="font-bold tabular-nums"
              style={{ color: textColor, fontSize: "6rem", lineHeight: 1, cursor: running ? "default" : "text", letterSpacing: "-2px" }}
            >
              {mins}:{secs}
            </span>
          )}
          {done && (
            <p className="text-sm font-medium mt-3" style={{ color: textColor }}>
              Time&apos;s up! Great work 🎉
            </p>
          )}
          {!running && !editing && !done && (
            <p className="text-xs mt-2" style={{ color: mutedColor }}>
              Double-click to edit · max {MODES[mode].max} min
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setRunning(r => !r); setEditing(false); }}
            className="px-12 py-3 rounded-2xl font-bold uppercase tracking-widest text-sm shadow transition-all hover:opacity-90 active:scale-95"
            style={{ background: startBg, color: startText }}
          >
            {running ? "Pause" : done ? "Restart" : "Start"}
          </button>
          <button
            onClick={reset}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition-all hover:opacity-80"
            style={{ color: textColor, border: `2px solid ${resetBorder}` }}
            title="Reset"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Session label */}
      <p className="mt-6 text-sm" style={{ color: mutedColor }}>
        {mode === "pomodoro" ? "Focus session · stay off your phone!" : "Take a breather 🌿"}
      </p>
    </div>
  );
}
