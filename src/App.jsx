import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import * as XLSX from "xlsx";
import Landing from "./components/Landing";
import Dashboard from "./components/Dashboard";
import TaskList from "./components/TaskList";
import Pomodoro from "./components/Pomodoro";

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

export default function App() {
  const [session, setSession]      = useState(null);
  const [loading, setLoading]      = useState(true);
  const [page, setPage]            = useState("dashboard");
  const [tasks, setTasksState]     = useState([]);
  const [events, setEventsState]   = useState([]);
  const [categories, setCatsState] = useState([]);
  const [taskTypes, setTTState]    = useState([]);
  const [eventTypes, setETState]   = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (!session) { setTasksState([]); setEventsState([]); setCatsState([]); setTTState([]); setETState([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

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

  if (loading) return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
      <div className="text-[#8C8880] text-sm">Loading...</div>
    </div>
  );

  if (!session) return <Landing />;

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      <nav className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-base font-bold text-[#1C1B19] hover:text-[#E8735A] transition-colors cursor-pointer">Planorama</a>
          {[["dashboard","Dashboard"],["tasks","Tasks"],["pomodoro","Pomodoro"]].map(([id,label]) => (
            <button key={id} onClick={() => setPage(id)}
              className={`text-sm font-medium pb-0.5 transition-colors ${page===id ? "text-[#E8735A] border-b-2 border-[#E8735A]" : "text-[#8C8880] hover:text-[#1C1B19]"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8C8880]">{session.user.email}</span>
          <button onClick={handleSignOut}
            className="text-xs text-[#8C8880] hover:text-[#E8735A] border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            Sign out
          </button>
        </div>
      </nav>

      {page === "dashboard" && (
        <Dashboard tasks={tasks} setTasks={updateTask} addTask={addTask}
          events={events} addEvent={addEvent} categories={normCats}
          taskTypes={taskTypes}
          eventTypes={eventTypes} addEventType={addEventType} removeEventType={removeEventType}
          onExcelImport={handleExcelImport} onICSImport={handleICSImport} />
      )}
      {page === "pomodoro" && <Pomodoro tasks={tasks} updateTask={updateTask} />}
      {page === "tasks" && (
        <TaskList tasks={tasks} updateTask={updateTask} addTask={addTask}
          categories={normCats} addCategory={addCategory} removeCategory={removeCategory} updateCategory={updateCategory}
          taskTypes={taskTypes} addTaskType={addTaskType} removeTaskType={removeTaskType}
          onExcelImport={handleExcelImport} deleteAllCompleted={deleteAllCompleted} />
      )}
    </div>
  );
}