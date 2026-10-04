import { useState } from "react";
import { AlertTriangle, ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import { supabase } from "./supabase";

/* Validation helpers */
const emailRegex = /^[A-Za-z][A-Za-z0-9._-]*@gmail\.com$/;
const phoneRegex = /^9[678]\d{8}$/;

const pwdRules = [
  { id: "len",   label: "At least 8 characters",           test: v => v.length >= 8 && v.length <= 64 },
  { id: "upper", label: "One uppercase letter (A–Z)",      test: v => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter (a–z)",      test: v => /[a-z]/.test(v) },
  { id: "num",   label: "One number (0–9)",                test: v => /[0-9]/.test(v) },
  { id: "spec",  label: "One special character (!@#$…)",   test: v => /[^A-Za-z0-9]/.test(v) },
  { id: "nospace", label: "No spaces",                     test: v => !/\s/.test(v) },
];

function PasswordStrength({ password }) {
  const passed = pwdRules.filter(r => r.test(password)).length;
  const pct = (passed / pwdRules.length) * 100;
  const color = passed <= 2 ? "#ef4444" : passed <= 4 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 3, background: "#e2e8f0", borderRadius: 99, overflow: "hidden", marginBottom: 7 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.3s, background 0.3s" }} />
      </div>
      {password.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px" }}>
          {pwdRules.map(r => {
            const ok = r.test(password);
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", color: ok ? "#16a34a" : "#94a3b8" }}>
                <span style={{ fontWeight: 700 }}>{ok ? "✓" : "○"}</span> {r.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Login() {
  const [tab, setTab] = useState(window.location.pathname === "/reset-password" ? "reset" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => { setEmail(""); setPassword(""); setConfirmPass(""); setFullName(""); setPhone(""); setError(""); setSuccess(""); setAgree(false); };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    if (!emailRegex.test(email)) { setError("Enter a valid Gmail address (e.g. shiva123@gmail.com)."); return; }
    if (!password) { setError("Password is required."); return; }
    if (!supabase) { setError("Supabase is not configured. Add the public URL and publishable key to the app environment."); return; }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
    } catch { setError("Unable to sign in. Please try again."); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!phoneRegex.test(phone)) { setError("Enter a valid 10-digit phone number starting with 9 (e.g. 9812345678)."); return; }
    if (!emailRegex.test(email)) { setError("Enter a valid Gmail address (e.g. shiva123@gmail.com)."); return; }
    if (!pwdRules.every(r => r.test(password))) { setError("Password does not meet all requirements."); return; }
    if (password !== confirmPass) { setError("Passwords do not match."); return; }
    if (!agree) { setError("You must agree to the Terms and Conditions."); return; }
    if (!supabase) { setError("Supabase is not configured. Add the public URL and publishable key to the app environment."); return; }
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName.trim(), phone } } });
      if (signUpError) { setError(signUpError.message); return; }
      if (!data.session) {
        setSuccess("Check your email for a confirmation link, then sign in.");
        setTab("signin");
        setPassword(""); setConfirmPass("");
      }
    } catch { setError("Unable to create your account. Please try again."); }
    finally { setLoading(false); }
  };

  const handleForgot = async e => {
    e.preventDefault(); setError(""); setSuccess("");
    if (!emailRegex.test(email)) { setError("Enter a valid Gmail address."); return; }
    if (!supabase) { setError("Supabase is not configured."); return; }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (resetError) setError(resetError.message);
      else setSuccess("If an account exists for this email, you will receive a reset link shortly.");
    } catch { setError("Unable to send the reset link. Please try again."); }
    finally { setLoading(false); }
  };

  const handleReset = async e => {
    e.preventDefault(); setError("");
    if (!pwdRules.every(r => r.test(password))) { setError("Password does not meet all requirements."); return; }
    if (password !== confirmPass) { setError("Passwords do not match."); return; }
    if (!supabase) { setError("Supabase is not configured."); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("This reset link is invalid or has expired. Request a new one."); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(updateError.message); return; }
      await supabase.auth.signOut();
      window.history.replaceState({}, "", "/");
      setTab("signin"); setPassword(""); setConfirmPass("");
      setSuccess("Password updated. Sign in with your new password.");
    } catch { setError("Unable to update your password. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1a2332 60%, #0d3a35 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", width: "100%", maxWidth: 440, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1a2332 0%, #243044 100%)", padding: "28px 32px 24px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <h1 style={{ color: "#f1f5f9", fontFamily: "DM Sans", fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>InvenPro</h1>
          <p style={{ color: "#475569", fontSize: "0.78rem", margin: 0 }}>Inventory Management System</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {[["signin", "Sign In"], ["create", "Create Account"]].map(([key, label]) => (
            <button key={key} onClick={() => { if (window.location.pathname === "/reset-password") window.history.replaceState({}, "", "/"); setTab(key); reset(); }}
              style={{ flex: 1, padding: "12px 0", border: "none", background: "transparent", fontFamily: "DM Sans", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", color: tab === key || (key === "signin" && ["forgot", "reset"].includes(tab)) ? "var(--primary)" : "var(--muted-foreground)", borderBottom: tab === key || (key === "signin" && ["forgot", "reset"].includes(tab)) ? "2px solid var(--primary)" : "2px solid transparent", transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: "24px 32px 28px" }}>
          {success && (
            <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "10px 13px", marginBottom: 16, color: "#15803d", fontSize: "0.8rem" }}>
              ✓ {success}
            </div>
          )}

          {/* SIGN IN */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Fld label="Email Address">
                <Inp type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="shiva123@gmail.com" required />
                <Hint>Must be a @gmail.com address starting with a letter</Hint>
              </Fld>
              <Fld label="Password">
                <PassInp value={password} onChange={e => setPassword(e.target.value)} show={showPass} toggle={() => setShowPass(s => !s)} placeholder="Your password" />
              </Fld>
              {error && <ErrBox>{error}</ErrBox>}
              <SubBtn loading={loading}>{loading ? "Signing in…" : "Sign In"}</SubBtn>
              <button type="button" onClick={() => { setTab("forgot"); setError(""); setSuccess(""); }} style={{ alignSelf: "flex-end", background: "none", border: "none", padding: 0, color: "var(--primary)", fontSize: "0.78rem", cursor: "pointer" }}>Forgot password?</button>
              <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--muted-foreground)", margin: 0 }}>
                No account?{" "}
                <button type="button" onClick={() => { setTab("create"); reset(); }} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 600, cursor: "pointer", padding: 0 }}>Create one →</button>
              </p>
            </form>
          )}

          {tab === "forgot" && (
            <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h2 style={{ fontSize: "1.1rem" }}>Reset password</h2>
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.8rem", margin: 0 }}>Enter your Gmail address to receive a reset link.</p>
              <Fld label="Email Address"><Inp type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" required /></Fld>
              {error && <ErrBox>{error}</ErrBox>}
              <SubBtn loading={loading}>{loading ? "Sending…" : "Send Reset Link"}</SubBtn>
              <button type="button" onClick={() => { setTab("signin"); setError(""); }} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}><ArrowLeft size={16} /> Back to sign in</button>
            </form>
          )}

          {tab === "reset" && (
            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h2 style={{ fontSize: "1.1rem" }}>Set new password</h2>
              <Fld label="New Password"><PassInp value={password} onChange={e => setPassword(e.target.value)} show={showPass} toggle={() => setShowPass(s => !s)} placeholder="Create a strong password" /><PasswordStrength password={password} /></Fld>
              <Fld label="Confirm Password"><PassInp value={confirmPass} onChange={e => setConfirmPass(e.target.value)} show={showConfirm} toggle={() => setShowConfirm(s => !s)} placeholder="Repeat password" /></Fld>
              {error && <ErrBox>{error}</ErrBox>}
              <SubBtn loading={loading}>{loading ? "Saving…" : "Save New Password"}</SubBtn>
              <button type="button" onClick={() => { window.history.replaceState({}, "", "/"); setTab("forgot"); setError(""); }} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}><Mail size={16} /> Request another link</button>
            </form>
          )}

          {/* CREATE ACCOUNT */}
          {tab === "create" && (
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <Fld label="Full Name">
                <Inp value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Shiva Hari" required />
              </Fld>
              <Fld label="Phone Number">
                <Inp type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9812345678" required />
                <Hint>10-digit number starting with 9 (e.g. 9812345678)</Hint>
              </Fld>
              <Fld label="Email Address">
                <Inp type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="shiva123@gmail.com" required />
                <Hint>Must start with a letter and end with @gmail.com</Hint>
              </Fld>
              <Fld label="Password">
                <PassInp value={password} onChange={e => setPassword(e.target.value)} show={showPass} toggle={() => setShowPass(s => !s)} placeholder="Create a strong password" />
                <PasswordStrength password={password} />
              </Fld>
              <Fld label="Confirm Password">
                <PassInp value={confirmPass} onChange={e => setConfirmPass(e.target.value)} show={showConfirm} toggle={() => setShowConfirm(s => !s)} placeholder="Repeat password" />
                {confirmPass.length > 0 && (
                  <div style={{ fontSize: "0.7rem", marginTop: 4, color: confirmPass === password ? "#16a34a" : "#ef4444", fontWeight: 600 }}>
                    {confirmPass === password ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </div>
                )}
              </Fld>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: "0.78rem", color: "var(--muted-foreground)" }}>
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: 2, accentColor: "var(--primary)", flexShrink: 0 }} />
                I agree to the Terms and Conditions
              </label>
              {error && <ErrBox>{error}</ErrBox>}
              <SubBtn loading={loading}>Create Account</SubBtn>
              <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--muted-foreground)", margin: 0 }}>
                Already registered?{" "}
                <button type="button" onClick={() => { setTab("signin"); reset(); }} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 600, cursor: "pointer", padding: 0 }}>Sign in →</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Fld({ label, children }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>{label}</label>{children}</div>;
}
function Hint({ children }) {
  return <span style={{ fontSize: "0.67rem", color: "#94a3b8" }}>{children}</span>;
}
function Inp(props) {
  return <input {...props} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, outline: "none", fontSize: "0.855rem", background: "var(--muted)", boxSizing: "border-box", transition: "border 0.15s" }}
    onFocus={e => e.currentTarget.style.borderColor = "var(--primary)"}
    onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />;
}
function PassInp({ value, onChange, show, toggle, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <input type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", padding: "9px 38px 9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, outline: "none", fontSize: "0.855rem", background: "var(--muted)", boxSizing: "border-box", transition: "border 0.15s" }}
        onFocus={e => e.currentTarget.style.borderColor = "var(--primary)"}
        onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
      />
      <button type="button" onClick={toggle} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "0.9rem", padding: 0 }}>
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
function ErrBox({ children }) {
  return <div role="alert" style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 12px", color: "#b91c1c", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} /> {children}</div>;
}
function SubBtn({ children, loading }) {
  return (
    <button type="submit" disabled={loading}
      style={{ padding: "11px", background: loading ? "#5eead4" : "var(--primary)", color: "#fff", border: "none", borderRadius: 9, fontSize: "0.9rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "DM Sans", transition: "background 0.15s", marginTop: 4 }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "var(--primary-dark)"; }}
      onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "var(--primary)"; }}
    >{children}</button>
  );
}
