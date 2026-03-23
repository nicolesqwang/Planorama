import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import * as XLSX from "xlsx";
import Landing from "./components/Landing";
import Dashboard from "./components/Dashboard";
import TaskList from "./components/TaskList";
import Pomodoro from "./components/Pomodoro";
import Settings from "./components/Settings";
import { DEFAULT_THEME_KEY, applyTheme } from "./theme";

const DEFAULT_TASK_TYPES  = ["HW", "Study", "Project", "Exam", "Presentation", "Review"];
const DEFAULT_EVENT_TYPES = ["Meeting", "Social", "Workshop", "Event", "Office Hours", "Club"];

// ── Excel column name fuzzy matcher ───────────────────────────
function normalizeKey(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const COLUMN_ALIASES = {
  task:       ["task", "name", "taskname", "title", "assignment", "homework", "item", "todo", "work", "taskitem", "assignmentname", "taskdescription"],
  dueDate:    ["duedate", "due", "date", "deadline", "dueon", "dueday", "by", "submitby", "duebydate", "targetdate"],
  dueTime:    ["duetime", "dueat", "time", "duetiime"],
  categories: ["tasktype", "type", "category", "categories", "subject", "class", "course", "label", "tag", "tags", "group", "area", "section", "topic"],
  done:       ["done", "completed", "finished", "status", "complete", "iscomplete", "isdone", "check", "checked"],
  notes:      ["notes", "note", "description", "details", "comments", "comment", "info", "additional", "extras", "memo"],
};

function matchColumn(header) {
  const norm = normalizeKey(header);
  // 1. Exact match against all aliases
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(norm)) return field;
  }
  // 2. Partial match: alias is contained within header (e.g. "assignment name" → task)
  //    Check categories first to prevent "tasktype" from matching "task"
  const orderedFields = ["categories", "dueDate", "dueTime", "done", "notes", "task"];
  for (const field of orderedFields) {
    const aliases = COLUMN_ALIASES[field];
    if (aliases.some(a => norm.includes(a) || (a.length > 4 && a.includes(norm)))) return field;
  }
  return null;
}

function parseExcelDate(val) {
  if (!val) return null;
  // Excel serial date number
  if (typeof val === "number") {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  // String date like "3/15/2026" or "2026-03-15"
  const str = String(val).trim();
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
  }
  const dashMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dashMatch) return `${dashMatch[1]}-${dashMatch[2]}-${dashMatch[3]}`;
  return null;
}

function parseDoneValue(val) {
  if (!val) return false;
  const s = String(val).toLowerCase().trim();
  return ["y","yes","true","1","done","completed","finished","x"].includes(s);
}

export function parseExcelFile(file, existingCategories) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
        if (rows.length < 2) return resolve({ tasks: [], newCategories: [] });

        const headers = rows[0].map(h => String(h).trim());
        const colMap = {};
        headers.forEach((h, i) => {
          const field = matchColumn(h);
          if (field && !(field in colMap)) colMap[field] = i;
        });

        const newCatNames = new Set();
        const tasks = [];

        rows.slice(1).forEach(row => {
          const name = colMap.task !== undefined ? String(row[colMap.task] || "").trim() : "";
          if (!name) return;

          let dueDate = new Date().toISOString().split("T")[0];
          if (colMap.dueDate !== undefined) {
            const raw = row[colMap.dueDate];
            if (raw) {
              // cellDates:true returns actual JS Date objects — use local date methods to avoid UTC offset shifting the day
              if (raw instanceof Date) {
                const y = raw.getFullYear();
                const m = String(raw.getMonth() + 1).padStart(2, "0");
                const d = String(raw.getDate()).padStart(2, "0");
                dueDate = `${y}-${m}-${d}`;
              } else if (typeof raw === "number") {
                // Excel serial date number (fallback if cellDates didn't kick in)
                const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                const msPerDay = 86400 * 1000;
                const dateObj = new Date(excelEpoch.getTime() + raw * msPerDay);
                dueDate = dateObj.toISOString().split("T")[0];
              } else {
                const str = String(raw).trim();
                const slash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
                if (slash) {
                  const y = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
                  dueDate = `${y}-${slash[1].padStart(2,"0")}-${slash[2].padStart(2,"0")}`;
                } else if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
                  dueDate = str.substring(0, 10);
                } else if (str.match(/^\d{1,2}-\d{1,2}-\d{2,4}$/)) {
                  const parts = str.split("-");
                  const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                  dueDate = `${y}-${parts[0].padStart(2,"0")}-${parts[1].padStart(2,"0")}`;
                }
              }
            }
          }

          const rawCat = colMap.categories !== undefined ? String(row[colMap.categories] || "").trim() : "";
          const cats = rawCat ? [rawCat] : [];
          if (rawCat) newCatNames.add(rawCat);

          const done = colMap.done !== undefined ? parseDoneValue(row[colMap.done]) : false;
          const notes = colMap.notes !== undefined ? String(row[colMap.notes] || "").trim() : "";

          tasks.push({ name, dueDate, dueTime: "23:59", categories: cats, types: [], done, notes });
        });

        const existingNames = new Set(existingCategories.map(c => c.name.toLowerCase()));
        const newCategories = [...newCatNames]
          .filter(n => !existingNames.has(n.toLowerCase()))
          .map(name => ({ name, bg: "#F2F3F4", text: "#717D7E", border: "#CCD1D1" }));

        resolve({ tasks, newCategories });
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// ── iCal parser ────────────────────────────────────────────────
const TASK_KEYWORDS = ["hw","homework","assignment","due","submit","project","exam","quiz","lab","essay","report"];

function parseICSDate(str) {
  if (!str) return null;
  const s = str.replace(/[TZ]/g, "").replace(/[-:]/g, "");
  const y = s.substring(0,4), m = s.substring(4,6), d = s.substring(6,8);
  const hr = s.substring(8,10) || "23", mn = s.substring(10,12) || "59";
  return { date: `${y}-${m}-${d}`, time: `${hr}:${mn}` };
}

export function parseICSFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text   = e.target.result;
        const events = [];
        const blocks = text.split("BEGIN:VEVENT");
        blocks.slice(1).forEach(block => {
          const get = (key) => {
            const match = block.match(new RegExp(`${key}[^:]*:(.+)`));
            return match ? match[1].trim().replace(/\\n/g, "\n").replace(/\\,/g, ",") : "";
          };
          const summary  = get("SUMMARY");
          const dtstart  = get("DTSTART");
          const desc     = get("DESCRIPTION");
          const parsed   = parseICSDate(dtstart);
          if (!summary || !parsed) return;

          const lower    = summary.toLowerCase() + " " + desc.toLowerCase();
          const isTask   = TASK_KEYWORDS.some(kw => lower.includes(kw));

          events.push({ summary, date: parsed.date, time: parsed.time, description: desc, isTask });
        });
        resolve(events);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function blendWithWhite(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgb(${Math.round(r*alpha+255*(1-alpha))},${Math.round(g*alpha+255*(1-alpha))},${Math.round(b*alpha+255*(1-alpha))})`;
}

export default function App() {
  const [session, setSession]      = useState(null);
  const [loading, setLoading]      = useState(true);
  const [page, setPage]            = useState("dashboard");
  const [tasks, setTasksState]     = useState([]);
  const [events, setEventsState]   = useState([]);
  const [categories, setCatsState] = useState([]);
  const [taskTypes, setTTState]    = useState([]);
  const [eventTypes, setETState]   = useState([]);
  const [pomodoroColor, setPomodoroColor] = useState(null);
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false);
      if (session) {
        const saved = session.user?.user_metadata?.theme_key || DEFAULT_THEME_KEY;
        setThemeKey(saved);
        applyTheme(saved);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (!session) { setTasksState([]); setEventsState([]); setCatsState([]); setTTState([]); setETState([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleThemeChange(key) {
    setThemeKey(key);
    applyTheme(key);
    await supabase.auth.updateUser({ data: { theme_key: key } });
  }

  useEffect(() => { if (session) loadAll(); }, [session]);

  async function loadAll() {
  const uid = session.user.id;
  const [t, e, c, tt, et] = await Promise.all([
    supabase.from("tasks").select("*").eq("user_id", uid).order("due_date"),
    supabase.from("events").select("*").eq("user_id", uid).order("date"),
    supabase.from("categories").select("*").eq("user_id", uid),
    supabase.from("task_types").select("*").eq("user_id", uid),
    supabase.from("event_types").select("*").eq("user_id", uid),
  ]);
  setTasksState(t.data || []);
  setEventsState(e.data || []);
  setCatsState(c.data || []);

  if ((tt.data || []).length === 0) {
    const rows = DEFAULT_TASK_TYPES.map(name => ({ user_id: uid, name }));
    const { data } = await supabase.from("task_types").insert(rows).select();
    setTTState(data || []);
  } else {
    // Deduplicate in case of previous double-inserts
    const seen = new Set();
    const unique = (tt.data || []).filter(t => {
      if (seen.has(t.name)) return false;
      seen.add(t.name); return true;
    });
    setTTState(unique);
  }

  if ((et.data || []).length === 0) {
    const rows = DEFAULT_EVENT_TYPES.map(name => ({ user_id: uid, name }));
    const { data } = await supabase.from("event_types").insert(rows).select();
    setETState(data || []);
  } else {
    // Deduplicate in case of previous double-inserts
    const seen = new Set();
    const unique = (et.data || []).filter(t => {
      if (seen.has(t.name)) return false;
      seen.add(t.name); return true;
    });
    setETState(unique);
  }
}
  async function addTask(task) {
    const { data, error } = await supabase.from("tasks").insert({
      user_id: session.user.id, name: task.name, due_date: task.dueDate,
      due_time: task.dueTime, categories: task.categories, types: task.types,
      done: task.done || false, notes: task.notes
    }).select().single();
    if (!error) setTasksState(p => [...p, data]);
  }

  async function updateTask(id, updates) {
    const patch = {};
    if (updates.name       !== undefined) patch.name       = updates.name;
    if (updates.dueDate    !== undefined) patch.due_date   = updates.dueDate;
    if (updates.dueTime    !== undefined) patch.due_time   = updates.dueTime;
    if (updates.categories !== undefined) patch.categories = updates.categories;
    if (updates.types      !== undefined) patch.types      = updates.types;
    if (updates.notes      !== undefined) patch.notes      = updates.notes;
    if (updates.done       !== undefined) patch.done       = updates.done;
    const { data, error } = await supabase.from("tasks").update(patch).eq("id", id).select().single();
    if (!error) setTasksState(p => p.map(t => t.id === id ? data : t));
  }

  async function addEvent(ev) {
    const { data, error } = await supabase.from("events").insert({
      user_id: session.user.id, name: ev.name, date: ev.date, time: ev.time,
      duration: ev.duration, category: ev.category, event_types: ev.event_types || [], notes: ev.notes
    }).select().single();
    if (!error) setEventsState(p => [...p, data]);
  }

  async function addCategory(cat) {
    const { data, error } = await supabase.from("categories").insert({
      user_id: session.user.id, name: cat.name, bg: cat.bg, text_color: cat.text, border: cat.border
    }).select().single();
    if (!error) setCatsState(p => [...p, data]);
    return data;
  }

  async function removeCategory(id) {
    await supabase.from("categories").delete().eq("id", id);
    setCatsState(p => p.filter(c => c.id !== id));
  }

  async function deleteAllCompleted() {
    const ids = tasks.filter(t => t.done).map(t => t.id);
    if (!ids.length) return;
    await supabase.from("tasks").delete().in("id", ids);
    setTasksState(p => p.filter(t => !t.done));
  }

  async function updateCategory(id, updates) {
    const { data, error } = await supabase.from("categories")
      .update({ name: updates.name, bg: updates.bg, text_color: updates.text, border: updates.border })
      .eq("id", id).select().single();
    if (!error) setCatsState(p => p.map(c => c.id === id ? data : c));
  }

  async function addTaskType(name) {
    const { data, error } = await supabase.from("task_types").insert({ user_id: session.user.id, name }).select().single();
    if (!error) setTTState(p => [...p, data]);
  }
  async function removeTaskType(id) {
    await supabase.from("task_types").delete().eq("id", id);
    setTTState(p => p.filter(t => t.id !== id));
  }

  async function addEventType(name) {
    const { data, error } = await supabase.from("event_types").insert({ user_id: session.user.id, name }).select().single();
    if (!error) setETState(p => [...p, data]);
  }
  async function removeEventType(id) {
    await supabase.from("event_types").delete().eq("id", id);
    setETState(p => p.filter(t => t.id !== id));
  }

  // ── Import Excel ───────────────────────────────────────────
  async function handleExcelImport(file) {
    const { tasks: newTasks, newCategories } = await parseExcelFile(file, categories);
    // Add new categories first
    const addedCats = [];
    for (const cat of newCategories) {
      const data = await addCategory(cat);
      if (data) addedCats.push(data);
    }
    // Add tasks
    for (const task of newTasks) {
      await addTask(task);
    }
    return { taskCount: newTasks.length, catCount: newCategories.length };
  }

  // ── Import iCal ────────────────────────────────────────────
  async function handleICSImport(file) {
    const items = await parseICSFile(file);
    let taskCount = 0, eventCount = 0;
    for (const item of items) {
      if (item.isTask) {
        await addTask({ name: item.summary, dueDate: item.date, dueTime: item.time, categories: [], types: [], done: false, notes: item.description });
        taskCount++;
      } else {
        await addEvent({ name: item.summary, date: item.date, time: item.time, duration: "1 hr", category: "", event_types: [], notes: item.description });
        eventCount++;
      }
    }
    return { taskCount, eventCount };
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setPage("dashboard");
  }

  const normCats = categories.map(c => ({ ...c, text: c.text_color }));

  // ── Display helpers ─────────────────────────────────────────
  const meta        = session?.user?.user_metadata || {};
  const emailUser   = session?.user?.email?.split("@")[0] || "";
  const nameParts   = emailUser.split(/[._\-]/).filter(Boolean);
  const displayName = meta.first_name
    ? meta.first_name.charAt(0).toUpperCase() + meta.first_name.slice(1)
    : nameParts.length > 1
      ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].slice(1)
      : emailUser.charAt(0).toUpperCase() + emailUser.slice(1);
  const initials = meta.first_name && meta.last_name
    ? (meta.first_name[0] + meta.last_name[0]).toUpperCase()
    : nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : emailUser.substring(0, 2).toUpperCase();
  const hour         = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const activeTasks  = tasks.filter(t => !t.done);

  const lora = { fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 };

  const headerBg     = page === "pomodoro" && pomodoroColor ? blendWithWhite(pomodoroColor, 0.5) : "var(--t-bg-input)";
  const headerBorder = page === "pomodoro" && pomodoroColor ? blendWithWhite(pomodoroColor, 0.7) : "var(--t-border)";

  const NAV_MAIN = [
    {
      id: "dashboard", label: "Dashboard",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1.5" y="1.5" width="5" height="5" rx="1.2"/><rect x="9.5" y="1.5" width="5" height="5" rx="1.2"/>
          <rect x="1.5" y="9.5" width="5" height="5" rx="1.2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.2"/>
        </svg>
      ),
    },
    {
      id: "tasks", label: "Tasks", badge: activeTasks.length || null,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="2" y1="4.5" x2="14" y2="4.5"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="11.5" x2="14" y2="11.5"/>
        </svg>
      ),
    },
    {
      id: "calendar", label: "Calendar",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/>
          <line x1="5" y1="1.5" x2="5" y2="4"/><line x1="11" y1="1.5" x2="11" y2="4"/>
          <line x1="1.5" y1="6.5" x2="14.5" y2="6.5"/>
        </svg>
      ),
    },
  ];
  const NAV_TOOLS = [
    {
      id: "pomodoro", label: "Pomodoro",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="8" cy="8" r="5.5"/><line x1="8" y1="8" x2="8" y2="4.5"/><line x1="8" y1="8" x2="11" y2="9.5"/>
        </svg>
      ),
    },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--t-bg-page)" }}>
      <div className="text-sm font-medium" style={{ color: "var(--t-text-muted)" }}>Loading...</div>
    </div>
  );

  if (!session) return <Landing />;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--t-bg-page)" }}>

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className="w-[196px] fixed left-0 top-0 h-full flex flex-col z-30 transition-colors duration-500"
        style={{ background: headerBg, borderRight: `1px solid ${headerBorder}` }}>

        {/* Logo */}
        <div className="px-4 h-[58px] flex items-center flex-shrink-0" style={{ borderBottom: `1px solid ${headerBorder}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--t-border)" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="2" fill="var(--t-primary)"/>
                <circle cx="6.5" cy="1.5" r="1.1" fill="var(--t-primary)"/>
                <circle cx="6.5" cy="11.5" r="1.1" fill="var(--t-primary)"/>
                <circle cx="1.5" cy="6.5" r="1.1" fill="var(--t-primary)"/>
                <circle cx="11.5" cy="6.5" r="1.1" fill="var(--t-primary)"/>
              </svg>
            </div>
            <div>
              <div style={{ ...lora, color: "var(--t-primary)" }} className="text-[15px] leading-tight">Planorama</div>
              <div className="text-[9px] font-medium mt-0.5" style={{ color: "var(--t-text-muted)" }}>your personal planner</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <p className="text-[9px] font-bold uppercase tracking-[0.7px] px-2 mb-1.5" style={{ color: "var(--t-text-muted)" }}>Main</p>
          {NAV_MAIN.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); if (item.id !== "pomodoro") setPomodoroColor(null); }}
              style={page === item.id ? { background: "var(--t-primary)", color: "var(--t-on-primary)" } : {}}
              className={`flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-[10px] text-[12.5px] font-medium transition-all text-left ${
                page === item.id ? "" : "nav-item-inactive"
              }`}>
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={page === item.id
                    ? { background: "var(--t-bg-accent)", color: "var(--t-primary)" }
                    : { background: "var(--t-border)", color: "var(--t-primary)" }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <p className="text-[9px] font-bold uppercase tracking-[0.7px] px-2 mt-4 mb-1.5" style={{ color: "var(--t-text-muted)" }}>Tools</p>
          {NAV_TOOLS.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); if (item.id !== "pomodoro") setPomodoroColor(null); }}
              style={page === item.id ? { background: "var(--t-primary)", color: "var(--t-on-primary)" } : {}}
              className={`flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-[10px] text-[12.5px] font-medium transition-all text-left ${
                page === item.id ? "" : "nav-item-inactive"
              }`}>
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Settings + User card */}
        <div className="px-3 pb-4 pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${headerBorder}` }}>
          <button onClick={() => { setPage("settings"); setPomodoroColor(null); }}
            style={page === "settings" ? { background: "var(--t-primary)", color: "var(--t-on-primary)" } : {}}
            className={`flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-[10px] text-[12.5px] font-medium transition-all text-left ${
              page === "settings" ? "" : "nav-item-inactive"
            }`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="2.2"/>
              <path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85"/>
            </svg>
            <span>Settings</span>
          </button>
          <div className="rounded-xl p-2.5 flex items-center gap-2" style={{ background: "var(--t-bg-accent)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--t-primary)" }}>
              <span className="text-[9px] font-bold" style={{ color: "var(--t-on-primary)" }}>{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-bold leading-tight truncate" style={{ color: "var(--t-text-dark)" }}>{displayName}</p>
              <p className="text-[9px] truncate" style={{ color: "var(--t-text-muted)" }}>{session.user.email}</p>
            </div>
            <button onClick={handleSignOut}
              className="text-[8.5px] transition-colors flex-shrink-0 font-semibold" style={{ color: "var(--t-text-muted)" }}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────── */}
      <div className="ml-[196px] flex-1 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="px-7 h-[58px] flex items-center justify-between sticky top-0 z-20 flex-shrink-0 transition-colors duration-500"
          style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}>
          <div>
            <p style={{ ...lora, color: "var(--t-text-dark)" }} className="text-base leading-snug">
              {timeGreeting}, {displayName}
            </p>
            <p className="text-[10.5px] font-medium mt-0.5" style={{ color: "var(--t-text-muted)" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              {activeTasks.length > 0 && <span className="ml-1">· {activeTasks.length} task{activeTasks.length !== 1 ? "s" : ""} remaining</span>}
            </p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {page === "dashboard" && (
            <Dashboard tasks={tasks} setTasks={updateTask} addTask={addTask}
              events={events} addEvent={addEvent} categories={normCats}
              taskTypes={taskTypes}
              eventTypes={eventTypes} addEventType={addEventType} removeEventType={removeEventType}
              onExcelImport={handleExcelImport} onICSImport={handleICSImport} />
          )}
          {page === "calendar" && (
            <Dashboard tasks={tasks} setTasks={updateTask} addTask={addTask}
              events={events} addEvent={addEvent} categories={normCats}
              taskTypes={taskTypes}
              eventTypes={eventTypes} addEventType={addEventType} removeEventType={removeEventType}
              calendarOnly={true} />
          )}
          {page === "pomodoro" && <Pomodoro tasks={tasks} updateTask={updateTask} onColorChange={setPomodoroColor} />}
          {page === "tasks" && (
            <TaskList tasks={tasks} updateTask={updateTask} addTask={addTask}
              categories={normCats} addCategory={addCategory} removeCategory={removeCategory} updateCategory={updateCategory}
              taskTypes={taskTypes} addTaskType={addTaskType} removeTaskType={removeTaskType}
              onExcelImport={handleExcelImport} deleteAllCompleted={deleteAllCompleted} />
          )}
          {page === "settings" && (
            <Settings session={session} deleteAllCompleted={deleteAllCompleted} onSignOut={handleSignOut}
              themeKey={themeKey} onThemeChange={handleThemeChange} />
          )}
        </main>
      </div>
    </div>
  );
}