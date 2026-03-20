import { useState } from "react";
import { supabase } from "../supabase";

const lora = { fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 500 };

function Section({ title, children }) {
  return (
    <div className="bg-[#F4F5E8] border border-[#C3C7A6] rounded-2xl p-6 flex flex-col gap-4">
      <h3 className="text-[11px] font-bold text-[#8A9170] uppercase tracking-[0.7px]">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-[#8A9170] uppercase tracking-[0.7px]">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full text-sm bg-[#E9ECCF] border border-[#C3C7A6] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#4A5C35]/40 font-medium text-[#3A4A28] placeholder:text-[#8A9170] disabled:opacity-50 disabled:cursor-not-allowed";

export default function Settings({ session, deleteAllCompleted, onSignOut }) {
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
  const [defaultPage, setDefaultPage]       = useState(() => localStorage.getItem("pref_default_page") || "dashboard");
  const [dateDisplay, setDateDisplay]       = useState(() => localStorage.getItem("pref_date_display") || "daysLeft");
  const [prefSaved,   setPrefSaved]         = useState(false);

  // Data
  const [clearConfirm, setClearConfirm]     = useState(false);
  const [clearDone,    setClearDone]        = useState(false);
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
    localStorage.setItem("pref_default_page",    defaultPage);
    localStorage.setItem("pref_date_display",    dateDisplay);
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
    <div className="min-h-screen bg-[#F7F8EE]">
      <div className="max-w-2xl mx-auto px-6 py-10">

        <h1 style={lora} className="text-4xl text-[#3A4A28] leading-tight mb-8">Settings</h1>

        {/* ── Profile ── */}
        <div className="flex flex-col gap-5">
          <Section title="Profile">
            <div className="flex items-center gap-4 mb-1">
              <div className="w-12 h-12 rounded-full bg-[#4A5C35] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#EEF1DE] uppercase">{initials || "?"}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#3A4A28]">{firstName || "—"} {lastName || ""}</p>
                <p className="text-xs text-[#8A9170]">{session.user.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Field label="First Name">
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nicole"
                  className={inputCls} />
              </Field>
              <Field label="Last Name">
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Wang"
                  className={inputCls} />
              </Field>
            </div>
            <Field label="Email">
              <input value={session.user.email} disabled className={inputCls} />
            </Field>
            <div className="flex items-center gap-3">
              <button onClick={saveProfile} disabled={!firstName.trim() || !lastName.trim() || profileSaving}
                className="bg-[#4A5C35] hover:bg-[#3D4D2C] disabled:opacity-40 text-[#EEF1DE] text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
                {profileSaving ? "Saving..." : "Save Profile"}
              </button>
              {profileMsg && (
                <span className={`text-xs font-medium ${profileMsg.startsWith("Error") ? "text-red-500" : "text-[#4A5C35]"}`}>
                  {profileMsg}
                </span>
              )}
            </div>
          </Section>

          {/* ── Security ── */}
          <Section title="Security">
            <p className="text-sm text-[#6B7255]">
              Reset your password via email. We&apos;ll send a link to <strong className="text-[#3A4A28]">{session.user.email}</strong>.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={sendPasswordReset} disabled={pwSaving}
                className="bg-[#E9ECCF] border border-[#C3C7A6] hover:bg-[#DDE0C0] text-[#3A4A28] text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-40">
                {pwSaving ? "Sending..." : "Send password reset email"}
              </button>
              {pwMsg && (
                <span className={`text-xs font-medium ${pwMsg.startsWith("Error") ? "text-red-500" : "text-[#4A5C35]"}`}>
                  {pwMsg}
                </span>
              )}
            </div>
          </Section>

          {/* ── Preferences ── */}
          <Section title="Preferences">
            <Field label="Default page on login">
              <select value={defaultPage} onChange={e => setDefaultPage(e.target.value)}
                className={inputCls}>
                <option value="dashboard">Dashboard</option>
                <option value="tasks">Tasks</option>
                <option value="calendar">Calendar</option>
              </select>
            </Field>
            <Field label="Default date display in Tasks">
              <select value={dateDisplay} onChange={e => setDateDisplay(e.target.value)}
                className={inputCls}>
                <option value="daysLeft">Days remaining (e.g. 3d)</option>
                <option value="dueDate">Due date (e.g. Mar 24)</option>
              </select>
            </Field>
            <div className="flex items-center gap-3">
              <button onClick={savePreferences}
                className="bg-[#4A5C35] hover:bg-[#3D4D2C] text-[#EEF1DE] text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
                Save Preferences
              </button>
              {prefSaved && <span className="text-xs text-[#4A5C35] font-medium">Preferences saved!</span>}
            </div>
          </Section>

          {/* ── Data ── */}
          <Section title="Data & Privacy">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-[#3A4A28]">Clear completed tasks</p>
                <p className="text-xs text-[#8A9170] mt-0.5">Permanently delete all tasks you&apos;ve marked as done.</p>
              </div>
              {!clearConfirm ? (
                <button onClick={() => setClearConfirm(true)}
                  className="text-sm font-semibold text-red-400 hover:text-red-600 transition-colors px-4 py-2 rounded-xl border border-red-200 hover:border-red-400 flex-shrink-0">
                  Clear
                </button>
              ) : (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setClearConfirm(false)}
                    className="text-xs text-[#6B7255] border border-[#C3C7A6] px-3 py-1.5 rounded-lg hover:bg-[#E9ECCF] transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleClearCompleted}
                    className="text-xs text-white bg-red-400 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-colors">
                    Confirm delete
                  </button>
                </div>
              )}
            </div>
            {clearDone && <p className="text-xs text-[#4A5C35] font-medium -mt-1">All completed tasks cleared.</p>}

            <div className="border-t border-[#DDE0C0] pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#3A4A28]">Sign out</p>
                <p className="text-xs text-[#8A9170] mt-0.5">Sign out of your Planorama account.</p>
              </div>
              <button onClick={onSignOut}
                className="text-sm font-semibold text-[#6B7255] hover:text-[#3A4A28] transition-colors px-4 py-2 rounded-xl border border-[#C3C7A6] hover:bg-[#E9ECCF] flex-shrink-0">
                Sign out
              </button>
            </div>

            <div className="border-t border-[#DDE0C0] pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-500">Delete account</p>
                <p className="text-xs text-[#8A9170] mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
              </div>
              {!deleteAccConfirm ? (
                <button onClick={() => setDeleteAccConfirm(true)}
                  className="text-sm font-semibold text-red-400 hover:text-red-600 transition-colors px-4 py-2 rounded-xl border border-red-200 hover:border-red-400 flex-shrink-0">
                  Delete
                </button>
              ) : (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setDeleteAccConfirm(false)}
                    className="text-xs text-[#6B7255] border border-[#C3C7A6] px-3 py-1.5 rounded-lg hover:bg-[#E9ECCF] transition-colors">
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
              <span className="text-[#6B7255] font-medium">Planorama</span>
              <span className="text-[#8A9170] text-xs">v1.0.0</span>
            </div>
            <p className="text-xs text-[#8A9170] leading-relaxed">
              A calm, organized space for your tasks, deadlines, and events — built for students who have a lot going on.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
