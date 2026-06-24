import { useState } from "react";
import { supabase } from "../supabase";

const lora = { fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 };

const FEATURES = [
  { icon: "☽", label: "Calendar" },
  { icon: "✿", label: "Tasks" },
  { icon: "◌", label: "Pomodoro" },
  { icon: "❀", label: "Daily habits" },
];

function Footer() {
  return (
    <footer className="relative z-10 px-10 py-8 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-center"
      style={{ borderTop: "1px solid var(--border)", color: "var(--plum-light)", background: "rgba(255,253,248,0.65)" }}>
      <span>Created by Nicole Wang</span>
      <span>·</span>
      <a href="mailto:nicoleswang@berkeley.edu" className="hover:underline" style={{ color: "var(--rose-deep)" }}>Email</a>
      <span>·</span>
      <a href="https://linkedin.com/in/nicoleswang" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "var(--rose-deep)" }}>LinkedIn</a>
      <span>·</span>
      <a href="https://nicoleswang.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "var(--rose-deep)" }}>Website</a>
    </footer>
  );
}

function Page({ children }) {
  return (
    <div className="relative bg-bloom">
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* soft glow auras */}
        <div className="aura aura-rose"   style={{ width: 380, height: 380, top: -90, left: -70 }} />
        <div className="aura aura-sage"   style={{ width: 360, height: 360, bottom: -70, right: -50 }} />
        <div className="aura aura-butter" style={{ width: 260, height: 260, top: "38%", right: "10%" }} />
        {/* a few quiet motifs — not a confetti field */}
        <span className="absolute top-[18%] left-[9%] text-2xl opacity-40 select-none">✿</span>
        <span className="absolute bottom-[24%] right-[10%] text-2xl opacity-40 select-none">✦</span>
        {children}
      </div>
      <Footer />
    </div>
  );
}

export default function Landing() {
  const [mode, setMode]           = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSubmit() {
    setError(""); setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { first_name: firstName.trim(), last_name: lastName.trim() } }
      });
      if (error) setError(error.message);
      else setConfirmed(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  }

  const inputStyle = { background: "var(--cream)", borderColor: "var(--border-rose)", color: "var(--plum)", "--tw-ring-color": "rgba(231,159,176,0.45)" };

  if (!mode) return (
    <Page>
      <nav className="px-10 py-5 flex items-center justify-between relative z-10" style={{ background: "rgba(255,253,248,0.7)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(6px)" }}>
        <span style={{ ...lora, color: "var(--rose-deep)" }} className="text-[21px]">bloomtasks ✿</span>
        <div className="flex gap-3">
          <button type="button" onClick={() => setMode("login")}
            className="text-sm font-bold px-5 py-2 rounded-full transition-colors border-[1.5px]"
            style={{ color: "var(--rose-deep)", borderColor: "var(--rose)", background: "transparent" }}>
            log in
          </button>
          <button type="button" onClick={() => setMode("signup")}
            className="text-sm font-bold px-5 py-2 rounded-full transition-colors glow-rose"
            style={{ background: "var(--rose)", color: "#fff" }}>
            sign up
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 -mt-8 relative z-10">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full mb-7 tracking-widest uppercase"
          style={{ background: "var(--rose-soft)", color: "var(--rose-deep)", border: "1px dashed var(--border-rose)" }}>
          ✦ your cozy personal planner ✦
        </div>
        <h1 className="text-6xl leading-[1.05] mb-4" style={{ ...lora, color: "var(--plum)" }}>
          bloom into <br/>your day <span style={{ color: "var(--rose-deep)" }}>✿</span>
        </h1>
        <p className="text-base max-w-md mb-10 font-semibold leading-relaxed" style={{ color: "var(--plum-mid)" }}>
          tasks, calendar, and focus — all in one soft, cozy place
        </p>
        <div className="flex gap-3">
          <button onClick={() => setMode("signup")}
            className="font-bold px-8 py-3 rounded-full text-sm transition-colors glow-rose"
            style={{ background: "var(--rose)", color: "#fff" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--rose-deep)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--rose)"}>
            Get started ✦
          </button>
          <button onClick={() => setMode("login")}
            className="font-bold px-8 py-3 rounded-full text-sm transition-colors border-[1.5px]"
            style={{ background: "var(--surface)", borderColor: "var(--border-sage)", color: "var(--sage-deep)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--sage-soft)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}>
            Log in
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-14">
          {FEATURES.map((f, i) => (
            <span key={f.label} className="text-sm font-bold px-4 py-2 rounded-full border-[1.5px] flex items-center gap-1.5"
              style={{ background: "var(--surface)", borderColor: i % 2 ? "var(--border-sage)" : "var(--border-rose)", color: "var(--plum-mid)" }}>
              <span>{f.icon}</span>{f.label}
            </span>
          ))}
        </div>
      </div>
    </Page>
  );

  if (confirmed) return (
    <Page>
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="rounded-3xl p-10 w-full max-w-sm text-center border-[1.5px] glow-rose overflow-hidden"
          style={{ background: "var(--surface)", borderColor: "var(--rose)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--rose-soft)" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--rose-deep)" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="4" width="18" height="14" rx="2"/><polyline points="2,4 11,13 20,4"/>
            </svg>
          </div>
          <h2 style={{ ...lora, color: "var(--plum)" }} className="text-xl mb-2">Check your email</h2>
          <p className="text-sm font-semibold" style={{ color: "var(--plum-light)" }}>We sent a confirmation link to <strong style={{ color: "var(--plum)" }}>{email}</strong>. Click it to activate your account.</p>
          <button onClick={() => { setMode("login"); setConfirmed(false); }}
            className="mt-6 w-full text-sm font-bold py-2.5 rounded-full transition-colors"
            style={{ background: "var(--rose)", color: "#fff" }}>
            Go to log in
          </button>
        </div>
      </div>
    </Page>
  );

  return (
    <Page>
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="rounded-3xl w-full max-w-sm border-[1.5px] glow-rose overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--rose)" }}>
          <div className="p-10">
          <button onClick={() => { setMode(null); setError(""); }}
            className="text-xs mb-6 flex items-center gap-1 transition-colors font-bold"
            style={{ color: "var(--plum-light)" }}>
            ← Back
          </button>
          <h2 style={{ ...lora, color: "var(--plum)" }} className="text-2xl mb-1">
            {mode === "login" ? "Welcome back ✦" : "Create your account ✿"}
          </h2>
          <p className="text-sm font-semibold mb-6" style={{ color: "var(--plum-light)" }}>
            {mode === "login" ? "Log in to your bloomtasks account" : "Start organizing your life for free"}
          </p>
          <div className="flex flex-col gap-4">
            {mode === "signup" && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.7px] mb-1" style={{ color: "var(--plum-light)" }}>First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="First name"
                    className="w-full text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 font-medium border" style={inputStyle} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.7px] mb-1" style={{ color: "var(--plum-light)" }}>Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="Last name"
                    className="w-full text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 font-medium border" style={inputStyle} />
                </div>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.7px] mb-1" style={{ color: "var(--plum-light)" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="you@example.com"
                className="w-full text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 font-medium border" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.7px] mb-1" style={{ color: "var(--plum-light)" }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="••••••••"
                className="w-full text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 font-medium border" style={inputStyle} />
            </div>
          </div>
          {error && <p className="text-xs mt-3 font-semibold text-red-500">{error}</p>}
          <button onClick={handleSubmit} disabled={!email || !password || loading || (mode === "signup" && (!firstName.trim() || !lastName.trim()))}
            className="mt-5 w-full disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold py-2.5 rounded-full transition-colors"
            style={{ background: "var(--rose)", color: "#fff" }}>
            {loading ? "Loading..." : mode === "login" ? "Log in" : "Create account"}
          </button>
          <p className="text-center text-xs mt-4 font-semibold" style={{ color: "var(--plum-light)" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              className="hover:underline font-bold" style={{ color: "var(--rose-deep)" }}>
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
          </div>
        </div>
      </div>
    </Page>
  );
}
