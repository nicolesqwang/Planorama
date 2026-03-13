import { useState } from "react";
import { supabase } from "../supabase";

export default function Landing() {
  const [mode, setMode]         = useState(null);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
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
  <div className="min-h-screen bg-[#F7F5F2] flex flex-col">
    <nav className="px-10 py-5 flex items-center justify-between">
      <span className="text-xl font-bold text-[#1C1B19]">Planorama</span>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setMode("login")}
          className="text-sm font-medium text-[#8C8880] hover:text-[#1C1B19] px-4 py-2 rounded-xl transition-colors border border-gray-200">
          Log in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className="text-sm font-medium bg-[#E8735A] hover:bg-[#d4624a] text-white px-4 py-2 rounded-xl transition-colors">
          Sign up
        </button>
      </div>
    </nav>
    {/* rest stays the same */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 -mt-16">
        <div className="inline-block bg-[#FDEDEC] text-[#E8735A] text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
          Your personal task HQ
        </div>
        <h1 className="text-6xl font-bold text-[#1C1B19] leading-tight mb-4">
          Plan smarter.<br /><span className="text-[#E8735A]">Stay on track.</span>
        </h1>
        <p className="text-lg text-[#8C8880] max-w-md mb-10">
          Planorama brings your tasks, deadlines, and events into one calm, organized space — built for students who have a lot going on.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setMode("signup")}
            className="bg-[#E8735A] hover:bg-[#d4624a] text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors shadow-sm">
            Get started
          </button>
          <button onClick={() => setMode("login")}
            className="bg-white border border-gray-200 hover:border-gray-300 text-[#1C1B19] font-medium px-8 py-3 rounded-xl text-sm transition-colors">
            Log in
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-14">
          {["📅 Calendar + list view","✅ Task tracking","🏷 Custom categories","⚡ Instant sync","🔁 Duplicate tasks","📝 Notes per task"].map(f => (
            <span key={f} className="bg-white border border-gray-200 text-sm text-[#8C8880] px-4 py-2 rounded-full">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );

  if (confirmed) return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-sm text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="text-lg font-semibold text-[#1C1B19] mb-2">Check your email</h2>
        <p className="text-sm text-[#8C8880]">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back to log in.</p>
        <button onClick={() => { setMode("login"); setConfirmed(false); }}
          className="mt-6 w-full bg-[#E8735A] hover:bg-[#d4624a] text-white text-sm font-medium py-2 rounded-xl transition-colors">
          Go to log in
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-sm">
        <button onClick={() => { setMode(null); setError(""); }}
          className="text-xs text-[#8C8880] hover:text-[#1C1B19] mb-6 flex items-center gap-1 transition-colors">
          ← Back
        </button>
        <h2 className="text-xl font-bold text-[#1C1B19] mb-1">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-[#8C8880] mb-6">
          {mode === "login" ? "Log in to your Planorama account" : "Start organizing your life for free"}
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="you@example.com"
              className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8C8880] uppercase tracking-wide mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="••••••••"
              className="w-full text-sm bg-[#F7F5F2] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E8735A]/40" />
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        <button onClick={handleSubmit} disabled={!email || !password || loading}
          className="mt-5 w-full bg-[#E8735A] hover:bg-[#d4624a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
          {loading ? "Loading..." : mode === "login" ? "Log in" : "Create account"}
        </button>
        <p className="text-center text-xs text-[#8C8880] mt-4">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            className="text-[#E8735A] hover:underline font-medium">
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}