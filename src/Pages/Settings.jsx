import { useEffect, useState } from "react";
import { Mail, Save, UserRound, RefreshCw, Database } from "lucide-react";
import { supabase } from "../Authentication/supabase";
import {
  initialCategories,
  initialProducts,
  initialSuppliers,
  initialPurchases,
  initialSales,
} from "../data";

const emailRegex = /^[A-Za-z][A-Za-z0-9._-]*@gmail\.com$/;

export default function Settings({
  currentUser,
  setCategories,
  setProducts,
  setSuppliers,
  setPurchases,
  setSales,
}) {
  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dataSyncMsg, setDataSyncMsg] = useState("");

  useEffect(() => {
    setFullName(currentUser?.fullName || "");
    setEmail(currentUser?.email || "");
  }, [currentUser?.fullName, currentUser?.email]);

  const save = async e => {
    e.preventDefault(); setError(""); setMessage("");
    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!emailRegex.test(email)) { setError("Enter a valid Gmail address."); return; }
    if (!supabase) { setError("Supabase is not configured."); return; }
    setSaving(true);
    try {
      const emailChanged = email !== currentUser?.email;
      const { error: updateError } = await supabase.auth.updateUser({
        ...(emailChanged ? { email } : {}),
        data: { full_name: fullName.trim() },
      });
      if (updateError) setError(updateError.message);
      else setMessage(emailChanged ? "Profile saved. Check your email to confirm the address change." : "Profile saved successfully.");
    } catch { setError("Unable to update your profile. Please try again."); }
    finally { setSaving(false); }
  };

  const handleSyncDataJs = () => {
    if (!confirm("Reload all data from src/data.js? This will update products, sales (customer names), suppliers, and categories to match data.js.")) return;
    if (setCategories) setCategories(initialCategories);
    if (setProducts) setProducts(initialProducts);
    if (setSuppliers) setSuppliers(initialSuppliers);
    if (setPurchases) setPurchases(initialPurchases);
    if (setSales) setSales(initialSales);
    setDataSyncMsg("All inventory & sales data successfully reloaded from src/data.js and saved to database!");
    setTimeout(() => setDataSyncMsg(""), 5000);
  };

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 700 }}>Settings</h2>
        <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: "0.855rem" }}>Manage your account profile and data preferences</p>
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

      {/* Data Management & Sync */}
      <div className="card-shadow" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={18} color="var(--primary)" />
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Data Sync (src/data.js)</h3>
          </div>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.78rem", margin: "4px 0 0" }}>
            Synchronize your database with custom entries or changes made directly in <code style={{ fontFamily: "JetBrains Mono, monospace" }}>src/data.js</code>.
          </p>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)", lineHeight: 1.5, margin: 0 }}>
            If you changed customer names, product names, or seed values in <code style={{ fontFamily: "JetBrains Mono, monospace" }}>src/data.js</code>, click below to force-refresh all active inventory tables and sync them to the database.
          </p>

          {dataSyncMsg && (
            <div role="status" className="badge-green" style={{ borderRadius: "var(--radius)", padding: 12, fontSize: "0.8rem" }}>
              {dataSyncMsg}
            </div>
          )}

          <button
            type="button"
            onClick={handleSyncDataJs}
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#ffffff",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "10px 16px",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} /> Reload Data from data.js
          </button>
        </div>
      </div>
    </div>
  );
}

