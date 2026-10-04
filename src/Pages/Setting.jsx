import { useEffect, useState } from "react";
import { Mail, Save, UserRound } from "lucide-react";
import { supabase } from "../authentication/supabase";

const emailRegex = /^[A-Za-z][A-Za-z0-9._-]*@gmail\.com$/;

export default function Settings({ currentUser }) {
  const [fullName, setFullName] = useState(currentUser.fullName || "");
  const [email, setEmail] = useState(currentUser.email || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setFullName(currentUser.fullName || "");
    setEmail(currentUser.email || "");
  }, [currentUser.fullName, currentUser.email]);

  const save = async e => {
    e.preventDefault(); setError(""); setMessage("");
    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!emailRegex.test(email)) { setError("Enter a valid Gmail address."); return; }
    if (!supabase) { setError("Supabase is not configured."); return; }
    setSaving(true);
    try {
      const emailChanged = email !== currentUser.email;
      const { error: updateError } = await supabase.auth.updateUser({
        ...(emailChanged ? { email } : {}),
        data: { full_name: fullName.trim() },
      });
      if (updateError) setError(updateError.message);
      else setMessage(emailChanged ? "Profile saved. Check your email to confirm the address change." : "Profile saved successfully.");
    } catch { setError("Unable to update your profile. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 700 }}>Settings</h2>
        <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: "0.855rem" }}>Manage your account profile</p>
      </div>
      <div className="card-shadow" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "18px 22px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Profile details</h3>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.78rem", margin: "4px 0 0" }}>Update the name and email associated with your account.</p>
        </div>
        <form onSubmit={save} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: "0.8rem", fontWeight: 600 }}>
            Full name
            <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <UserRound size={17} style={{ position: "absolute", left: 12, color: "var(--muted-foreground)" }} />
              <input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Your full name" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "11px 12px 11px 40px", background: "var(--muted)" }} />
            </span>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: "0.8rem", fontWeight: 600 }}>
            Email address
            <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Mail size={17} style={{ position: "absolute", left: 12, color: "var(--muted-foreground)" }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@gmail.com" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "11px 12px 11px 40px", background: "var(--muted)" }} />
            </span>
            <span style={{ fontWeight: 400, color: "var(--muted-foreground)", fontSize: "0.72rem" }}>Changing your email may require confirmation.</span>
          </label>
          {error && <div role="alert" className="badge-red" style={{ borderRadius: "var(--radius)", padding: 12, fontSize: "0.8rem" }}>{error}</div>}
          {message && <div role="status" className="badge-green" style={{ borderRadius: "var(--radius)", padding: 12, fontSize: "0.8rem" }}>{message}</div>}
          <button type="submit" disabled={saving} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "var(--primary-foreground)", border: 0, borderRadius: "var(--radius)", padding: "10px 18px", fontWeight: 600, cursor: saving ? "wait" : "pointer" }}><Save size={16} /> {saving ? "Saving…" : "Save Profile"}</button>
        </form>
      </div>
    </div>
  );
}
