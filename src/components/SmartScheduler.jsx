import { useState } from "react";
import { askClaude, stripColorEmoji } from "../anthropic";

const lora = { fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 };

const ENERGY_OPTIONS = ["Energized", "Okay", "Tired"];
const SLEEP_OPTIONS = ["8h+", "6-7h", "Under 6h"];

const SCHEDULE_SYSTEM_PROMPT = `You are a cognitive load optimizer and productivity coach.
Given the user's tasks, energy level, sleep quality, and any fixed commitments, create an optimized daily schedule that:
1. Front-loads cognitively demanding tasks (Exam, Project, Study, HW) in peak energy windows
2. Places lighter tasks (Review, Presentation prep) in afternoon/low-energy slots
3. Inserts 10-min breaks every 90 minutes (Pomodoro-aware)
4. Warns if the day is overloaded (more than 6 hours of focused work)
5. Adjusts all recommendations based on sleep and energy inputs

If the day is overloaded, start a line with exactly "WARNING:" followed by a short sentence naming a specific task to consider moving to tomorrow.

Respond with a friendly, specific schedule as plain text. Use time blocks formatted exactly like "9:00–10:30 AM: [task name]" on their own line, one per line.
Do not use any pictograph emoji — only ✦ ✿ ❀ characters if you want a small accent.
End with a single 1-sentence motivational note on its own line.
Keep total response under 250 words.`;

function parseSchedule(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const blocks = [];
  let warning = null;
  let motivational = null;
  const timeLineRegex = /^([\d:apmAPM\s.–-]+):\s*(.+)$/;

  lines.forEach(line => {
    if (line.toUpperCase().startsWith("WARNING:")) {
      warning = line.slice(line.indexOf(":") + 1).trim();
      return;
    }
    const m = line.match(timeLineRegex);
    if (m && /\d/.test(m[1])) {
      blocks.push({ time: m[1].trim(), text: m[2].trim() });
    } else {
      motivational = line;
    }
  });
  return { blocks, warning, motivational };
}

function matchBlockColor(blockText, tasks, categories) {
  const found = tasks.find(t => blockText.toLowerCase().includes(t.name.toLowerCase()));
  const catName = found?.categories?.[0];
  return categories.find(c => c.name === catName) || null;
}

export default function SmartScheduler({ tasks, categories, onClose }) {
  const [step, setStep]             = useState(1);
  const [energy, setEnergy]         = useState(null);
  const [sleep, setSleep]           = useState(null);
  const [commitments, setCommitments] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [result, setResult]         = useState(null);
  const [exportToast, setExportToast] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const relevantTasks = tasks.filter(t => !t.done && (t.due_date === todayStr || t.due_date === tomorrowStr));

  async function handleGenerate() {
    setLoading(true); setError(null);
    const taskList = relevantTasks.length
      ? relevantTasks.map(t => `- ${t.name} (due ${t.due_date === todayStr ? "today" : "tomorrow"}, category: ${(t.categories || []).join(", ") || "none"}, type: ${(t.types || []).join(", ") || "none"})`).join("\n")
      : "No tasks due today or tomorrow.";
    const userMessage = `Energy level: ${energy}\nSleep last night: ${sleep}\nFixed commitments today: ${commitments.trim() || "none"}\n\nTasks:\n${taskList}`;
    try {
      const reply = await askClaude(SCHEDULE_SYSTEM_PROMPT, userMessage, 600);
      setResult(parseSchedule(stripColorEmoji(reply)));
      setStep(3);
    } catch (err) {
      setError(err.message.includes("VITE_ANTHROPIC_KEY")
        ? "AI key not set up yet — add VITE_ANTHROPIC_KEY to .env ♡"
        : "couldn't build a schedule right now, try again in a bit ♡");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="rounded-2xl w-[480px] max-h-[85vh] overflow-y-auto p-6 relative glow-rose"
        style={{ background: "var(--surface)", border: "1.5px solid var(--rose)" }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-xl" style={{ color: "var(--t-text-muted)" }}>✕</button>
        <h2 style={lora} className="text-xl text-[var(--t-text-dark)] mb-1">Smart Scheduler</h2>
        <p className="text-xs font-semibold mb-5" style={{ color: "var(--t-text-muted)" }}>let's plan a day that actually fits you ✦</p>

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.7px] mb-2" style={{ color: "var(--t-text-muted)" }}>how are you feeling today?</label>
              <div className="flex gap-2">
                {ENERGY_OPTIONS.map(o => (
                  <button key={o} onClick={() => setEnergy(o)}
                    className="flex-1 text-sm font-bold py-2 rounded-full border-[1.5px] transition-all"
                    style={energy === o ? { background: "var(--rose)", color: "#fff", borderColor: "var(--rose)" } : { background: "var(--cream)", color: "var(--t-text-med)", borderColor: "var(--border)" }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.7px] mb-2" style={{ color: "var(--t-text-muted)" }}>how did you sleep?</label>
              <div className="flex gap-2">
                {SLEEP_OPTIONS.map(o => (
                  <button key={o} onClick={() => setSleep(o)}
                    className="flex-1 text-sm font-bold py-2 rounded-full border-[1.5px] transition-all"
                    style={sleep === o ? { background: "var(--sage)", color: "#fff", borderColor: "var(--sage)" } : { background: "var(--cream)", color: "var(--t-text-med)", borderColor: "var(--border)" }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.7px] mb-2" style={{ color: "var(--t-text-muted)" }}>any big commitments today? <span className="normal-case font-normal">(optional)</span></label>
              <input value={commitments} onChange={e => setCommitments(e.target.value)} placeholder="e.g. 3pm meeting"
                className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 font-medium text-[var(--t-text-dark)] placeholder:text-[var(--t-text-muted)]" />
            </div>
            <p className="text-xs font-semibold" style={{ color: "var(--t-text-muted)" }}>
              {relevantTasks.length} task{relevantTasks.length !== 1 ? "s" : ""} due today/tomorrow will be considered.
            </p>
            {error && <p className="text-sm font-semibold" style={{ color: "#B5673F" }}>{error}</p>}
            <button onClick={handleGenerate} disabled={!energy || !sleep || loading}
              className="w-full text-sm font-bold py-3 rounded-full transition-all disabled:opacity-40"
              style={{ background: "var(--rose)", color: "#fff" }}>
              {loading ? "optimizing…" : "Optimize My Day ✦"}
            </button>
          </div>
        )}

        {step === 3 && result && (
          <div className="flex flex-col gap-4">
            {result.warning && (
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--rose-soft)", border: "1px solid var(--border-rose)" }}>
                <p className="text-sm font-bold" style={{ color: "var(--rose-deep)" }}>⚠ your day looks heavy — {result.warning} ✦</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {result.blocks.map((b, i) => {
                const cat = matchBlockColor(b.text, relevantTasks, categories);
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                    style={cat ? { background: cat.bg, border: `1px solid ${cat.border}` } : { background: "var(--cream)", border: "1px solid var(--border)" }}>
                    <span className="text-xs font-bold flex-shrink-0 w-[110px]" style={{ color: cat ? cat.text : "var(--t-text-muted)" }}>{b.time}</span>
                    <span className="text-sm font-semibold flex-1" style={{ color: cat ? cat.text : "var(--t-text-dark)" }}>{b.text}</span>
                  </div>
                );
              })}
            </div>
            {result.motivational && (
              <p className="text-[15px] text-center mt-1" style={{ ...lora, color: "var(--rose-deep)" }}>{result.motivational}</p>
            )}
            {exportToast && (
              <p className="text-xs font-bold text-center" style={{ color: "var(--sage-deep)" }}>saved! (notes export is coming soon ✿)</p>
            )}
            <div className="flex gap-2 mt-1">
              <button onClick={() => setExportToast(true)}
                className="flex-1 text-sm font-bold py-2.5 rounded-full border-[1.5px] transition-all"
                style={{ background: "var(--surface)", color: "var(--sage-deep)", borderColor: "var(--border-sage)" }}>
                export to notes
              </button>
              <button onClick={onClose}
                className="flex-1 text-sm font-bold py-2.5 rounded-full transition-all"
                style={{ background: "var(--rose)", color: "#fff" }}>
                looks good! ✿
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
