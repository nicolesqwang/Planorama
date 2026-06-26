import { useState } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { askClaude, parseClaudeJSON, stripColorEmoji, sleep } from "../anthropic";
import { localDateStr } from "../dateUtils";

const lora = { fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 };

// Hardcoded encouraging tip sets — used whenever the AI call isn't available
// (no API key, or a failed request) so the feature never looks broken.
const FALLBACK_TIP_SETS = [
  [
    "✦ you're keeping a nice balance between spending and saving this month — keep it up!",
    "✿ small recurring charges add up fast — a quick subscription audit could free up some cash.",
  ],
  [
    "✿ cooking at home a couple more nights a week tends to make the biggest dent in monthly spending.",
    "✦ setting aside a fixed amount the moment income arrives makes saving feel automatic.",
  ],
  [
    "✦ you're doing better than you think — consistency matters more than perfection here.",
    "✿ keeping an eye on your top spending category each week tends to reveal easy wins.",
  ],
  [
    "✿ leaving a little room in your budget for fun spending makes the rest easier to stick to.",
    "✦ reviewing your biggest expense category once a month is a great habit to keep building.",
  ],
];
function pickFallbackTips(prevIdx) {
  if (FALLBACK_TIP_SETS.length <= 1) return { idx: 0, text: FALLBACK_TIP_SETS[0].join("\n") };
  let idx;
  do { idx = Math.floor(Math.random() * FALLBACK_TIP_SETS.length); } while (idx === prevIdx);
  return { idx, text: FALLBACK_TIP_SETS[idx].join("\n") };
}

const EXPENSE_CATEGORIES = ["Food", "Housing", "Transport", "Entertainment", "Shopping", "Health", "Education", "Subscriptions", "Other"];
const INCOME_CATEGORIES  = ["Internship", "Job", "Freelance", "Family", "Other"];

const EXPENSE_COLORS = {
  Food: "#F9C9C9", Housing: "#A8C896", Transport: "#FAD98B",
  Entertainment: "#C5B8E8", Shopping: "#F5C4A0", Health: "#8EC8BC",
  Education: "#A8C8F0", Subscriptions: "#E3A6BB", Other: "#EDE0D8",
};
const INCOME_COLOR = "#A6B07E";

function categoryColor(category, type) {
  return type === "income" ? INCOME_COLOR : (EXPENSE_COLORS[category] || EXPENSE_COLORS.Other);
}

function monthKey(dateStr) { return (dateStr || "").slice(0, 7); }
function fmtMoney(n) { return `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

const PARSE_SYSTEM_PROMPT = `You are a friendly personal finance assistant.
Parse the user's message and extract transaction data.
Respond ONLY with valid JSON, no other text:
{
  "amount": number (always positive),
  "type": "expense" or "income",
  "category": one of [Food, Housing, Transport, Entertainment, Shopping, Health, Education, Subscriptions, Other, Internship, Job, Freelance, Family],
  "description": short description string,
  "date": today's date as YYYY-MM-DD, today is ${localDateStr()}
}
If you cannot parse a transaction, return:
{"error": "could not parse"}`;

const RECS_SYSTEM_PROMPT = `You are a friendly, encouraging personal finance advisor with a warm, slightly playful tone.
Given this month's transaction data, give 2-3 short, specific, actionable recommendations.
Be encouraging but honest. Reference specific categories the user actually spent on.
Keep each recommendation under 2 sentences. Use a ✦ or ✿ at the start of each one.
Examples of good tone:
"you are genuinely crushing it on savings this month ✦"
"heads up — food is your biggest category at 34%, maybe cook at home twice this week? ✿"
"your subscriptions are adding up to $67/month — worth auditing those! ✦"
Format as plain text with line breaks between each tip. Do not use any pictograph emoji — only ✦ ✿ ❀ characters.`;

// ── Chat-style add bar ───────────────────────────────────────────
function AddBar({ onAdd }) {
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState(null);

  async function handleSubmit() {
    const message = input.trim();
    if (!message || loading) return;
    setLoading(true); setToast(null);
    try {
      const reply = await askClaude(PARSE_SYSTEM_PROMPT, message, 300);
      const parsed = parseClaudeJSON(reply);
      if (parsed.error || !parsed.amount || !parsed.category) {
        setToast({ ok: false, text: "hmm, try something like 'spent $30 on food' ♡" });
      } else {
        await onAdd({
          amount: Math.abs(Number(parsed.amount)),
          type: parsed.type === "income" ? "income" : "expense",
          category: parsed.category,
          description: parsed.description || message,
          date: parsed.date || localDateStr(),
        });
        setToast({ ok: true, text: `✿ logged $${Math.abs(Number(parsed.amount)).toFixed(0)} to ${parsed.category}!` });
        setInput("");
      }
    } catch (err) {
      setToast({ ok: false, text: err.message.includes("VITE_ANTHROPIC_KEY")
        ? "AI key not set up yet — add VITE_ANTHROPIC_KEY to .env ♡"
        : "hmm, try something like 'spent $30 on food' ♡" });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="relative">
      <div className="rounded-full flex items-center gap-2 px-2 py-1.5 glow-rose" style={{ background: "var(--surface)", border: "1.5px solid var(--border-rose)" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          disabled={loading}
          placeholder="tell me what you spent or earned... ✦"
          className="flex-1 text-sm bg-transparent outline-none px-4 py-2 font-medium text-[var(--t-text-dark)] placeholder:text-[var(--t-text-muted)]" />
        <button onClick={handleSubmit} disabled={loading || !input.trim()}
          className="text-xs font-bold px-5 py-2.5 rounded-full transition-all disabled:opacity-40"
          style={{ background: "var(--rose)", color: "#fff" }}>
          {loading ? "thinking…" : "log it"}
        </button>
      </div>
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-10 text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap"
          style={{ background: toast.ok ? "var(--rose-soft)" : "var(--butter-soft)", color: toast.ok ? "var(--rose-deep)" : "#8A6E2E" }}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

// ── Stat cards ───────────────────────────────────────────────────
function StatCards({ income, expenses, biggestCategory }) {
  const saved = income - expenses;
  const cards = [
    { label: "Total Income",  value: fmtMoney(income),   bg: "var(--sage-soft)",   ink: "var(--sage-deep)", border: "var(--border-sage)" },
    { label: "Total Expenses", value: fmtMoney(expenses), bg: "var(--rose-soft)",   ink: "var(--rose-deep)", border: "var(--border-rose)" },
    { label: "Saved",         value: `${saved < 0 ? "-" : ""}${fmtMoney(saved)}`, bg: saved >= 0 ? "var(--sage-soft)" : "#F6E5DE", ink: saved >= 0 ? "var(--sage-deep)" : "#B5673F", border: saved >= 0 ? "var(--border-sage)" : "#E7B9A4" },
    { label: "Biggest Category", value: biggestCategory || "—", bg: "var(--butter-soft)", ink: "#A9852F", border: "#EAD08A" },
  ];
  return (
    <div className="grid grid-cols-4 gap-[14px] mb-5">
      {cards.map(c => (
        <div key={c.label} className="rounded-2xl px-[18px] py-[16px]" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.8px] mb-1.5" style={{ color: c.ink }}>{c.label}</p>
          <p className="text-[26px] leading-none truncate" style={{ ...lora, color: c.ink }}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Charts ───────────────────────────────────────────────────────
function ExpensePie({ transactions }) {
  const totals = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
  });
  const data = Object.entries(totals).map(([name, value]) => ({ name, value }));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-2xl glow-rose p-5 flex-1" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <h3 style={lora} className="text-[16px] text-[var(--t-text-dark)] mb-3">where your money went <span style={{ color: "var(--rose)" }}>✦</span></h3>
      {data.length === 0 ? (
        <p className="text-sm font-semibold text-center py-16" style={{ color: "var(--t-text-muted)" }}>no expenses logged yet ✿</p>
      ) : (
        <div className="relative" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                {data.map(d => <Cell key={d.name} fill={categoryColor(d.name, "expense")} stroke="var(--surface)" strokeWidth={2} />)}
              </Pie>
              <Tooltip formatter={v => fmtMoney(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontFamily: "Nunito" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p style={lora} className="text-[20px] text-[var(--t-text-dark)]">{fmtMoney(total)}</p>
            <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--t-text-muted)" }}>total</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {data.map(d => (
          <span key={d.name} className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
            style={{ background: "var(--cream)", color: "var(--t-text-dark)" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: categoryColor(d.name, "expense") }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function IncomeExpenseBars({ transactions }) {
  const now = new Date();
  const months = [0, 1, 2].map(i => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-US", { month: "short" }) };
  }).reverse();

  const data = months.map(m => {
    const inMonth = transactions.filter(t => monthKey(t.date) === m.key);
    return {
      month: m.label,
      income: inMonth.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
      expense: inMonth.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  return (
    <div className="rounded-2xl glow-sage p-5 flex-1" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <h3 style={lora} className="text-[16px] text-[var(--t-text-dark)] mb-3">income vs. expenses <span style={{ color: "var(--rose)" }}>✦</span></h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={6}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "Nunito", fill: "var(--t-text-muted)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fontFamily: "Nunito", fill: "var(--t-text-muted)" }} axisLine={false} tickLine={false} width={36} />
          <Tooltip formatter={v => fmtMoney(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontFamily: "Nunito" }} />
          <Bar dataKey="income" name="Income" fill="var(--sage)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="var(--rose)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2">
        <span className="text-[10px] font-bold flex items-center gap-1.5" style={{ color: "var(--sage-deep)" }}><span className="w-2 h-2 rounded-full" style={{ background: "var(--sage)" }} />Income</span>
        <span className="text-[10px] font-bold flex items-center gap-1.5" style={{ color: "var(--rose-deep)" }}><span className="w-2 h-2 rounded-full" style={{ background: "var(--rose)" }} />Expense</span>
      </div>
    </div>
  );
}

// ── Transaction history ─────────────────────────────────────────
function TransactionHistory({ transactions, onDelete }) {
  const recent = transactions.slice(0, 20);
  return (
    <div className="rounded-2xl glow-soft p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <h3 style={lora} className="text-[16px] text-[var(--t-text-dark)] mb-3">recent transactions</h3>
      {recent.length === 0 ? (
        <p className="text-sm font-semibold text-center py-10" style={{ color: "var(--t-text-muted)" }}>no transactions yet ✿ log your first one above!</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {recent.map(t => (
            <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl group" style={{ background: "var(--cream)" }}>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background: categoryColor(t.category, t.type), color: "var(--t-text-dark)" }}>
                {t.category}
              </span>
              <span className="text-sm font-semibold flex-1 truncate" style={{ color: "var(--t-text-dark)" }}>{t.description || t.category}</span>
              <span className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--t-text-muted)" }}>
                {new Date(t.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span className="text-sm font-bold flex-shrink-0 w-20 text-right" style={{ color: t.type === "income" ? "var(--sage-deep)" : "var(--rose-deep)" }}>
                {t.type === "income" ? "+" : "-"}{fmtMoney(t.amount)}
              </span>
              <button onClick={() => onDelete(t.id)}
                className="text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "var(--t-text-muted)" }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AI recommendations ──────────────────────────────────────────
function FinancialNotes({ transactions }) {
  const [notes, setNotes]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [fallbackIdx, setFallbackIdx] = useState(-1);

  async function generate() {
    setLoading(true); setError(null);
    const now = new Date();
    const thisMonth = transactions.filter(t => monthKey(t.date) === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    if (thisMonth.length === 0) {
      setError("log a few transactions first so I have something to look at ♡");
      setLoading(false);
      return;
    }
    const summary = thisMonth.map(t => `${t.type} $${t.amount} ${t.category}${t.description ? ` (${t.description})` : ""}`).join("\n");
    try {
      const reply = await askClaude(RECS_SYSTEM_PROMPT, `This month's transactions:\n${summary}`, 400);
      setNotes(stripColorEmoji(reply));
    } catch {
      // No key configured, or the request failed — fall back silently so the
      // feature never looks broken to the user.
      await sleep(400 + Math.random() * 400);
      const { idx, text } = pickFallbackTips(fallbackIdx);
      setFallbackIdx(idx);
      setNotes(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl p-5 mt-5" style={{ background: "var(--butter-soft)", border: "1px solid #EAD08A" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[16px]" style={{ ...lora, color: "#8A6E2E" }}>financial notes ✿</h3>
        <button onClick={generate} disabled={loading}
          className="text-[11px] font-bold px-3.5 py-1.5 rounded-full transition-all disabled:opacity-50"
          style={{ background: "#FCEFC4", color: "#8A6E2E", border: "1px solid #EAD08A" }}>
          {loading ? "thinking…" : notes ? "refresh notes ✿" : "get financial notes ✿"}
        </button>
      </div>
      {error && <p className="text-sm font-semibold" style={{ color: "#B5673F" }}>{error}</p>}
      {!error && !notes && !loading && (
        <p className="text-sm font-medium" style={{ color: "#8A6E2E" }}>tap the button for a few gentle notes on this month's spending.</p>
      )}
      {notes && (
        <div className="flex flex-col gap-2">
          {notes.split("\n").filter(Boolean).map((line, i) => (
            <p key={i} className="text-[15px] leading-relaxed" style={{ ...lora, color: "#6B5420" }}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Finances page ────────────────────────────────────────────────
export default function Finances({ transactions, addTransaction, deleteTransaction }) {
  const now = new Date();
  const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = transactions.filter(t => monthKey(t.date) === curMonthKey);
  const income = thisMonth.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = thisMonth.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const catTotals = {};
  thisMonth.filter(t => t.type === "expense").forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount); });
  const biggestCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="min-h-screen p-[24px_28px] relative">
      <div className="aura aura-rose" style={{ width: 280, height: 280, top: -60, right: 40 }} />
      <div className="aura aura-sage" style={{ width: 260, height: 260, bottom: 20, left: -40 }} />
      <div className="relative z-10 max-w-5xl">
        <h2 style={lora} className="text-[30px] text-[var(--t-text-dark)] mb-5">Finances</h2>

        <div className="mb-6">
          <AddBar onAdd={addTransaction} />
        </div>

        <StatCards income={income} expenses={expenses} biggestCategory={biggestCategory} />

        <div className="flex gap-[14px] mb-5">
          <ExpensePie transactions={thisMonth} />
          <IncomeExpenseBars transactions={transactions} />
        </div>

        <TransactionHistory transactions={transactions} onDelete={deleteTransaction} />

        <FinancialNotes transactions={transactions} />
      </div>
    </div>
  );
}
