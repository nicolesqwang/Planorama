import { useState } from "react";
import { supabase } from "../supabase";

const lora = { fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 };

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

  if (!mode) return (
    <div className="min-h-screen bg-[var(--t-on-primary)] flex flex-col">
      <nav className="px-10 py-5 flex items-center justify-between">
        <span style={lora} className="text-[20px] text-[var(--t-primary)]">Planorama</span>
        <div className="flex gap-3">
          <button type="button" onClick={() => setMode("login")}
            className="text-sm font-semibold text-[var(--t-text-med)] hover:text-[var(--t-text-dark)] px-4 py-2 rounded-xl transition-colors border border-[var(--t-border)] bg-[var(--t-bg-input)] hover:bg-[var(--t-bg-accent)]">
            Log in
          </button>
          <button type="button" onClick={() => setMode("signup")}
            className="text-sm font-semibold bg-[var(--t-primary)] hover:bg-[var(--t-primary-hover)] text-[var(--t-on-primary)] px-4 py-2 rounded-xl transition-colors">
            Sign up
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 -mt-12">
        <div className="inline-block bg-[var(--t-bg-accent)] text-[var(--t-primary)] text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase border border-[var(--t-border)]">
          Your personal task HQ
        </div>
        <h1 style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 }}
          className="text-6xl text-[var(--t-text-dark)] leading-tight mb-4">
          Plan smarter.<br /><span className="text-[var(--t-primary)]">Stay on track.</span>
        </h1>
        <p className="text-base text-[var(--t-text-muted)] max-w-md mb-10 font-medium leading-relaxed">
          Planorama brings your tasks, deadlines, and events into one calm, organized space — built for students who have a lot going on.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setMode("signup")}
            className="bg-[var(--t-primary)] hover:bg-[var(--t-primary-hover)] text-[var(--t-on-primary)] font-semibold px-8 py-3 rounded-xl text-sm transition-colors shadow-sm">
            Get started
          </button>
          <button onClick={() => setMode("login")}
            className="bg-[var(--t-bg-input)] border border-[var(--t-border)] hover:bg-[var(--t-bg-accent)] text-[var(--t-text-dark)] font-semibold px-8 py-3 rounded-xl text-sm transition-colors">
            Log in
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-14">
          {["Calendar + list view","Task tracking","Custom categories","Instant sync","Duplicate tasks","Notes per task"].map(f => (
            <span key={f} className="bg-[var(--t-bg-input)] border border-[var(--t-border)] text-sm text-[var(--t-text-med)] font-medium px-4 py-2 rounded-full">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );

  if (confirmed) return (
    <div className="min-h-screen bg-[var(--t-on-primary)] flex items-center justify-center">
      <div className="bg-[var(--t-bg-card)] border border-[var(--t-border)] rounded-2xl shadow-sm p-10 w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--t-bg-accent)] flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--t-primary)" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="4" width="18" height="14" rx="2"/><polyline points="2,4 11,13 20,4"/>
          </svg>
        </div>
        <h2 style={lora} className="text-xl text-[var(--t-text-dark)] mb-2">Check your email</h2>
        <p className="text-sm text-[var(--t-text-muted)] font-medium">We sent a confirmation link to <strong className="text-[var(--t-text-dark)]">{email}</strong>. Click it to activate your account.</p>
        <button onClick={() => { setMode("login"); setConfirmed(false); }}
          className="mt-6 w-full bg-[var(--t-primary)] hover:bg-[var(--t-primary-hover)] text-[var(--t-on-primary)] text-sm font-semibold py-2.5 rounded-xl transition-colors">
          Go to log in
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--t-on-primary)] flex items-center justify-center">
      <div className="bg-[var(--t-bg-card)] border border-[var(--t-border)] rounded-2xl shadow-sm p-10 w-full max-w-sm">
        <button onClick={() => { setMode(null); setError(""); }}
          className="text-xs text-[var(--t-text-muted)] hover:text-[var(--t-text-dark)] mb-6 flex items-center gap-1 transition-colors font-semibold">
          ← Back
        </button>
        <h2 style={lora} className="text-2xl text-[var(--t-text-dark)] mb-1">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-[var(--t-text-muted)] font-medium mb-6">
          {mode === "login" ? "Log in to your Planorama account" : "Start organizing your life for free"}
        </p>
        <div className="flex flex-col gap-4">
          {mode === "signup" && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="Nicole"
                  className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 font-medium text-[var(--t-text-dark)] placeholder:text-[var(--t-text-muted)]" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="Wang"
                  className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 font-medium text-[var(--t-text-dark)] placeholder:text-[var(--t-text-muted)]" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="you@example.com"
              className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 font-medium text-[var(--t-text-dark)] placeholder:text-[var(--t-text-muted)]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--t-text-muted)] uppercase tracking-[0.7px] mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="••••••••"
              className="w-full text-sm bg-[var(--t-bg-input)] border border-[var(--t-border)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--t-primary)]/40 font-medium text-[var(--t-text-dark)]" />
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mt-3 font-medium">{error}</p>}
        <button onClick={handleSubmit} disabled={!email || !password || loading || (mode === "signup" && (!firstName.trim() || !lastName.trim()))}
          className="mt-5 w-full bg-[var(--t-primary)] hover:bg-[var(--t-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--t-on-primary)] text-sm font-semibold py-2.5 rounded-xl transition-colors">
          {loading ? "Loading..." : mode === "login" ? "Log in" : "Create account"}
        </button>
        <p className="text-center text-xs text-[var(--t-text-muted)] mt-4 font-medium">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            className="text-[var(--t-primary)] hover:underline font-bold">
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
