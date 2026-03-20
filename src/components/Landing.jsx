import { useState } from "react";
import { supabase } from "../supabase";

const lora = { fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 };

export default function Landing() {
  const [mode, setMode]           = useState(null);
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSubmit() {
    setError(""); setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setConfirmed(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  }

  if (!mode) return (
    <div className="min-h-screen bg-[#EEF1DE] flex flex-col">
      <nav className="px-10 py-5 flex items-center justify-between">
        <span style={lora} className="text-[20px] text-[#4A5C35]">Planorama</span>
        <div className="flex gap-3">
          <button type="button" onClick={() => setMode("login")}
            className="text-sm font-semibold text-[#6B7255] hover:text-[#3A4A28] px-4 py-2 rounded-xl transition-colors border border-[#C3C7A6] bg-[#E9ECCF] hover:bg-[#DDE0C0]">
            Log in
          </button>
          <button type="button" onClick={() => setMode("signup")}
            className="text-sm font-semibold bg-[#4A5C35] hover:bg-[#3D4D2C] text-[#EEF1DE] px-4 py-2 rounded-xl transition-colors">
            Sign up
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 -mt-12">
        <div className="inline-block bg-[#D9E0C8] text-[#4A5C35] text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase border border-[#C3C7A6]">
          Your personal task HQ
        </div>
        <h1 style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 }}
          className="text-6xl text-[#3A4A28] leading-tight mb-4">
          Plan smarter.<br /><span className="text-[#4A5C35]">Stay on track.</span>
        </h1>
        <p className="text-base text-[#8A9170] max-w-md mb-10 font-medium leading-relaxed">
          Planorama brings your tasks, deadlines, and events into one calm, organized space — built for students who have a lot going on.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setMode("signup")}
            className="bg-[#4A5C35] hover:bg-[#3D4D2C] text-[#EEF1DE] font-semibold px-8 py-3 rounded-xl text-sm transition-colors shadow-sm">
            Get started
          </button>
          <button onClick={() => setMode("login")}
            className="bg-[#E9ECCF] border border-[#C3C7A6] hover:bg-[#DDE0C0] text-[#3A4A28] font-semibold px-8 py-3 rounded-xl text-sm transition-colors">
            Log in
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-14">
          {["Calendar + list view","Task tracking","Custom categories","Instant sync","Duplicate tasks","Notes per task"].map(f => (
            <span key={f} className="bg-[#E9ECCF] border border-[#C3C7A6] text-sm text-[#6B7255] font-medium px-4 py-2 rounded-full">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );

  if (confirmed) return (
    <div className="min-h-screen bg-[#EEF1DE] flex items-center justify-center">
      <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-2xl shadow-sm p-10 w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-[#D9E0C8] flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#4A5C35" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="4" width="18" height="14" rx="2"/><polyline points="2,4 11,13 20,4"/>
          </svg>
        </div>
        <h2 style={lora} className="text-xl text-[#3A4A28] mb-2">Check your email</h2>
        <p className="text-sm text-[#8A9170] font-medium">We sent a confirmation link to <strong className="text-[#3A4A28]">{email}</strong>. Click it to activate your account.</p>
        <button onClick={() => { setMode("login"); setConfirmed(false); }}
          className="mt-6 w-full bg-[#4A5C35] hover:bg-[#3D4D2C] text-[#EEF1DE] text-sm font-semibold py-2.5 rounded-xl transition-colors">
          Go to log in
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EEF1DE] flex items-center justify-center">
      <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-2xl shadow-sm p-10 w-full max-w-sm">
        <button onClick={() => { setMode(null); setError(""); }}
          className="text-xs text-[#8A9170] hover:text-[#3A4A28] mb-6 flex items-center gap-1 transition-colors font-semibold">
          ← Back
        </button>
        <h2 style={lora} className="text-2xl text-[#3A4A28] mb-1">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-[#8A9170] font-medium mb-6">
          {mode === "login" ? "Log in to your Planorama account" : "Start organizing your life for free"}
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="you@example.com"
              className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28] placeholder:text-[#8A9170]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px] mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="••••••••"
              className="w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28]" />
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mt-3 font-medium">{error}</p>}
        <button onClick={handleSubmit} disabled={!email || !password || loading}
          className="mt-5 w-full bg-[#4A5C35] hover:bg-[#3D4D2C] disabled:opacity-40 disabled:cursor-not-allowed text-[#EEF1DE] text-sm font-semibold py-2.5 rounded-xl transition-colors">
          {loading ? "Loading..." : mode === "login" ? "Log in" : "Create account"}
        </button>
        <p className="text-center text-xs text-[#8A9170] mt-4 font-medium">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            className="text-[#4A5C35] hover:underline font-bold">
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
