import { useState } from "react";
import { supabase } from "../supabase";
import { THEMES } from "../theme";

const lora = { fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 };

function Section({ title, children }) {
  return (
    <div className="border rounded-2xl p-6 flex flex-col gap-4"
      style={{ background: "var(--t-bg-card)", borderColor: "var(--t-border)" }}>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.7px]" style={{ color: "var(--t-text-muted)" }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-[0.7px]" style={{ color: "var(--t-text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed border";

function ThemedInput(props) {
  return (
    <input {...props}
      className={inputCls}
      style={{
        background: "var(--t-bg-input)",
        borderColor: "var(--t-border)",
        color: "var(--t-text-dark)",
        "--tw-ring-color": "color-mix(in srgb, var(--t-primary) 40%, transparent)",
        ...(props.style || {})
      }} />
  );
}

function ThemedSelect({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange}
      className={inputCls}
      style={{ background: "var(--t-bg-input)", borderColor: "var(--t-border)", color: "var(--t-text-dark)" }}>
      {children}
    </select>
  );
}

export default function Settings({ session, deleteAllCompleted, onSignOut, themeKey, onThemeChange }) {
  const meta = session?.user?.user_metadata || {};

  // Profile
  const [firstName, setFirstName] = useState(meta.first_name || "");
  const [lastName,  setLastName]  = useState(meta.last_name  || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg,    setProfileMsg]    = useState("");

  // Password
  const [pwMsg,    setPwMsg]    = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // Preferences
  const [defaultPage, setDefaultPage] = useState(() => localStorage.getItem("pref_default_page") || "dashboard");
  const [dateDisplay, setDateDisplay] = useState(() => localStorage.getItem("pref_date_display") || "daysLeft");
  const [prefSaved,   setPrefSaved]   = useState(false);

  // Data
  const [clearConfirm,     setClearConfirm]     = useState(false);
  const [clearDone,        setClearDone]        = useState(false);
  const [deleteAccConfirm, setDeleteAccConfirm] = useState(false);

  async function saveProfile() {
    if (!firstName.trim() || !lastName.trim()) return;
    setProfileSaving(true); setProfileMsg("");
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName.trim(), last_name: lastName.trim() }
    });
    setProfileSaving(false);
    setProfileMsg(error ? `Error: ${error.message}` : "Profile saved!");
    setTimeout(() => setProfileMsg(""), 3000);
  }

  async function sendPasswordReset() {
    setPwSaving(true); setPwMsg("");
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: window.location.origin,
    });
    setPwSaving(false);
    setPwMsg(error ? `Error: ${error.message}` : "Password reset email sent — check your inbox.");
  }

  function savePreferences() {
    localStorage.setItem("pref_default_page", defaultPage);
    localStorage.setItem("pref_date_display", dateDisplay);
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2500);
  }

  async function handleClearCompleted() {
    await deleteAllCompleted();
    setClearConfirm(false);
    setClearDone(true);
    setTimeout(() => setClearDone(false), 3000);
  }

  const initials = (firstName[0] || "") + (lastName[0] || "");

  return (
    <div className="min-h-screen" style={{ background: "var(--t-bg-page)" }}>
      <div className="max-w-2xl mx-auto px-6 py-10">

        <h1 style={{ ...lora, color: "var(--t-text-dark)" }} className="text-4xl leading-tight mb-8">Settings</h1>

        <div className="flex flex-col gap-5">

          {/* ── Profile ── */}
          <Section title="Profile">
            <div className="flex items-center gap-4 mb-1">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--t-primary)" }}>
                <span className="text-sm font-bold uppercase" style={{ color: "var(--t-on-primary)" }}>{initials || "?"}</span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--t-text-dark)" }}>{firstName || "—"} {lastName || ""}</p>
                <p className="text-xs" style={{ color: "var(--t-text-muted)" }}>{session.user.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Field label="First Name">
                <ThemedInput value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nicole" />
              </Field>
              <Field label="Last Name">
                <ThemedInput value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Wang" />
              </Field>
            </div>
            <Field label="Email">
              <ThemedInput value={session.user.email} disabled />
            </Field>
            <div className="flex items-center gap-3">
              <button onClick={saveProfile} disabled={!firstName.trim() || !lastName.trim() || profileSaving}
                className="text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-40"
                style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--t-primary-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--t-primary)"}>
                {profileSaving ? "Saving..." : "Save Profile"}
              </button>
              {profileMsg && (
                <span className={`text-xs font-medium ${profileMsg.startsWith("Error") ? "text-red-500" : ""}`}
                  style={!profileMsg.startsWith("Error") ? { color: "var(--t-primary)" } : {}}>
                  {profileMsg}
                </span>
              )}
            </div>
          </Section>

          {/* ── Security ── */}
          <Section title="Security">
            <p className="text-sm" style={{ color: "var(--t-text-med)" }}>
              Reset your password via email. We&apos;ll send a link to{" "}
              <strong style={{ color: "var(--t-text-dark)" }}>{session.user.email}</strong>.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={sendPasswordReset} disabled={pwSaving}
                className="border text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-40"
                style={{ background: "var(--t-bg-input)", borderColor: "var(--t-border)", color: "var(--t-text-dark)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--t-bg-accent)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--t-bg-input)"}>
                {pwSaving ? "Sending..." : "Send password reset email"}
              </button>
              {pwMsg && (
                <span className={`text-xs font-medium ${pwMsg.startsWith("Error") ? "text-red-500" : ""}`}
                  style={!pwMsg.startsWith("Error") ? { color: "var(--t-primary)" } : {}}>
                  {pwMsg}
                </span>
              )}
            </div>
          </Section>

          {/* ── Preferences ── */}
          <Section title="Preferences">
            <Field label="Default page on login">
              <ThemedSelect value={defaultPage} onChange={e => setDefaultPage(e.target.value)}>
                <option value="dashboard">Dashboard</option>
                <option value="tasks">Tasks</option>
                <option value="calendar">Calendar</option>
              </ThemedSelect>
            </Field>
            <Field label="Default date display in Tasks">
              <ThemedSelect value={dateDisplay} onChange={e => setDateDisplay(e.target.value)}>
                <option value="daysLeft">Days remaining (e.g. 3d)</option>
                <option value="dueDate">Due date (e.g. Mar 24)</option>
              </ThemedSelect>
            </Field>

            {/* ── Color theme ── */}
            <Field label="App color theme">
              <div className="flex flex-wrap gap-2 mt-0.5">
                {Object.entries(THEMES).map(([key, t]) => (
                  <button key={key} onClick={() => onThemeChange(key)}
                    title={t.name}
                    className="w-8 h-8 rounded-full transition-all flex items-center justify-center"
                    style={{
                      background: t.swatch,
                      border: themeKey === key ? `3px solid ${t.primary}` : `2px solid transparent`,
                      outline: themeKey === key ? `2px solid ${t.swatch}` : "none",
                      outlineOffset: "1px",
                      boxShadow: themeKey === key ? `0 0 0 1px ${t.primary}` : "0 0 0 1px rgba(0,0,0,0.12)",
                    }}>
                    {themeKey === key && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={t.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2,6 5,9 10,3"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[11px] mt-1" style={{ color: "var(--t-text-muted)" }}>
                {THEMES[themeKey]?.name || "Green"} theme selected — applies across the whole app.
              </p>
            </Field>

            <div className="flex items-center gap-3">
              <button onClick={savePreferences}
                className="text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--t-primary-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--t-primary)"}>
                Save Preferences
              </button>
              {prefSaved && <span className="text-xs font-medium" style={{ color: "var(--t-primary)" }}>Preferences saved!</span>}
            </div>
          </Section>

          {/* ── Data ── */}
          <Section title="Data & Privacy">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--t-text-dark)" }}>Clear completed tasks</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--t-text-muted)" }}>Permanently delete all tasks you&apos;ve marked as done.</p>
              </div>
              {!clearConfirm ? (
                <button onClick={() => setClearConfirm(true)}
                  className="text-sm font-semibold text-red-400 hover:text-red-600 transition-colors px-4 py-2 rounded-xl border border-red-200 hover:border-red-400 flex-shrink-0">
                  Clear
                </button>
              ) : (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setClearConfirm(false)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors border"
                    style={{ color: "var(--t-text-med)", borderColor: "var(--t-border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--t-bg-input)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    Cancel
                  </button>
                  <button onClick={handleClearCompleted}
                    className="text-xs text-white bg-red-400 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-colors">
                    Confirm delete
                  </button>
                </div>
              )}
            </div>
            {clearDone && <p className="text-xs font-medium -mt-1" style={{ color: "var(--t-primary)" }}>All completed tasks cleared.</p>}

            <div className="pt-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--t-bg-accent)" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--t-text-dark)" }}>Sign out</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--t-text-muted)" }}>Sign out of your Planorama account.</p>
              </div>
              <button onClick={onSignOut}
                className="text-sm font-semibold transition-colors px-4 py-2 rounded-xl border flex-shrink-0"
                style={{ color: "var(--t-text-med)", borderColor: "var(--t-border)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--t-text-dark)"; e.currentTarget.style.background = "var(--t-bg-input)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--t-text-med)"; e.currentTarget.style.background = ""; }}>
                Sign out
              </button>
            </div>

            <div className="pt-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--t-bg-accent)" }}>
              <div>
                <p className="text-sm font-semibold text-red-500">Delete account</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--t-text-muted)" }}>Permanently delete your account and all data. This cannot be undone.</p>
              </div>
              {!deleteAccConfirm ? (
                <button onClick={() => setDeleteAccConfirm(true)}
                  className="text-sm font-semibold text-red-400 hover:text-red-600 transition-colors px-4 py-2 rounded-xl border border-red-200 hover:border-red-400 flex-shrink-0">
                  Delete
                </button>
              ) : (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setDeleteAccConfirm(false)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors border"
                    style={{ color: "var(--t-text-med)", borderColor: "var(--t-border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--t-bg-input)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    Cancel
                  </button>
                  <button onClick={async () => { await supabase.auth.admin?.deleteUser?.(session.user.id); await onSignOut(); }}
                    className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors">
                    Yes, delete forever
                  </button>
                </div>
              )}
            </div>
          </Section>

          {/* ── About ── */}
          <Section title="About">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium" style={{ color: "var(--t-text-med)" }}>Planorama</span>
              <span className="text-xs" style={{ color: "var(--t-text-muted)" }}>v1.0.0</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--t-text-muted)" }}>
              A calm, organized space for your tasks, deadlines, and events — built for students who have a lot going on.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
