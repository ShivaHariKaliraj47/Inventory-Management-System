import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  PackageCheck,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { supabase } from "./supabase";

const emailRegex = /^[A-Za-z][A-Za-z0-9._-]*@gmail\.com$/;
const phoneRegex = /^9[678]\d{8}$/;
const pwdRules = [
  { id: "len", label: "8–64 characters", test: value => value.length >= 8 && value.length <= 64 },
  { id: "upper", label: "Uppercase", test: value => /[A-Z]/.test(value) },
  { id: "lower", label: "Lowercase", test: value => /[a-z]/.test(value) },
  { id: "num", label: "Number", test: value => /[0-9]/.test(value) },
  { id: "spec", label: "Special character", test: value => /[^A-Za-z0-9]/.test(value) },
  { id: "nospace", label: "No spaces", test: value => !/\s/.test(value) },
];

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
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => { setError(""); setSuccess(""); };
  const reset = () => {
    setEmail(""); setPassword(""); setConfirmPass(""); setFullName(""); setPhone("");
    setAgree(false); setRemember(false); clearMessages();
  };
  const changeTab = next => {
    if (window.location.pathname === "/reset-password") window.history.replaceState({}, "", "/");
    reset();
    setTab(next);
  };

  const handleSignIn = async event => {
    event.preventDefault(); clearMessages();
    if (!emailRegex.test(email)) { setError("Enter a valid Gmail address, such as name@gmail.com."); return; }
    if (!password) { setError("Password is required."); return; }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
    } catch { setError("Unable to sign in. Please try again."); }
    finally { setLoading(false); }
  };

  const handleCreate = async event => {
    event.preventDefault(); clearMessages();
    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!phoneRegex.test(phone)) { setError("Enter a 10-digit phone number starting with 96, 97, or 98."); return; }
    if (!emailRegex.test(email)) { setError("Enter a valid Gmail address, such as name@gmail.com."); return; }
    if (!pwdRules.every(rule => rule.test(password))) { setError("Password does not meet all requirements."); return; }
    if (password !== confirmPass) { setError("Passwords do not match."); return; }
    if (!agree) { setError("You must agree to the Terms and Conditions."); return; }
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName.trim(), phone },
        },
      });
      if (signUpError) { setError(signUpError.message); return; }
      if (!data.session) {
        setTab("signin");
        setPassword(""); setConfirmPass("");
        setSuccess("Account created. Check Gmail for your verification link.");
      }
    } catch { setError("Unable to create your account. Please try again."); }
    finally { setLoading(false); }
  };

  const handleForgot = async event => {
    event.preventDefault(); clearMessages();
    if (!emailRegex.test(email)) { setError("Enter a valid Gmail address."); return; }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) setError(resetError.message);
      else setSuccess("If this account exists, a reset link will arrive in Gmail shortly.");
    } catch { setError("Unable to send the reset link. Please try again."); }
    finally { setLoading(false); }
  };

  const handleReset = async event => {
    event.preventDefault(); clearMessages();
    if (!pwdRules.every(rule => rule.test(password))) { setError("Password does not meet all requirements."); return; }
    if (password !== confirmPass) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("This reset link is invalid or has expired."); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(updateError.message); return; }
      await supabase.auth.signOut();
      window.history.replaceState({}, "", "/");
      setTab("signin"); setPassword(""); setConfirmPass("");
      setSuccess("Password updated. Sign in with your new password.");
    } catch { setError("Unable to update your password. Please try again."); }
    finally { setLoading(false); }
  };

  const createMode = tab === "create";

  return (
    <main className="auth-page">
      <div className="auth-brand">
        <span className="auth-brand-mark"><PackageCheck size={23} /></span>
        <span>InvenPro</span>
      </div>

      <section className={`auth-shell ${createMode ? "auth-shell-create" : ""}`}>
        <PromoPanel createMode={createMode} onAction={() => changeTab(createMode ? "signin" : "create")} />

        <div className="auth-form-panel">
          <div className="auth-form-wrap">
            {success && <StatusBox type="success">{success}</StatusBox>}

            {tab === "signin" && (
              <>
                <FormHeading title="Sign in" subtitle="Log in to manage your inventory" />
                <form className="auth-form" onSubmit={handleSignIn}>
                  <Field label="Gmail address" icon={Mail}>
                    <AuthInput type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@gmail.com" autoComplete="email" required />
                  </Field>
                  <Field label="Password" icon={LockKeyhole}>
                    <PasswordInput value={password} onChange={event => setPassword(event.target.value)} show={showPass} onToggle={() => setShowPass(value => !value)} autoComplete="current-password" />
                  </Field>
                  <div className="auth-form-options">
                    <label className="auth-check"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> Remember me</label>
                    <button className="auth-text-button" type="button" onClick={() => { clearMessages(); setTab("forgot"); }}>Forgot password?</button>
                  </div>
                  {error && <StatusBox type="error">{error}</StatusBox>}
                  <SubmitButton loading={loading}>{loading ? "Signing in…" : "Login Now"}</SubmitButton>
                </form>
                <TrustRow />
              </>
            )}

            {tab === "create" && (
              <>
                <FormHeading title="Create Account" subtitle="Set up your inventory workspace" />
                <form className="auth-form auth-create-form" onSubmit={handleCreate}>
                  <div className="auth-field-grid">
                    <Field label="Full name" icon={UserRound}>
                      <AuthInput value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Your name" autoComplete="name" required />
                    </Field>
                    <Field label="Phone number">
                      <AuthInput type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="98XXXXXXXX" autoComplete="tel" required />
                    </Field>
                  </div>
                  <Field label="Gmail address" icon={Mail}>
                    <AuthInput type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@gmail.com" autoComplete="email" required />
                  </Field>
                  <Field label="Password" icon={LockKeyhole}>
                    <PasswordInput value={password} onChange={event => setPassword(event.target.value)} show={showPass} onToggle={() => setShowPass(value => !value)} autoComplete="new-password" />
                    <PasswordStrength password={password} />
                  </Field>
                  <Field label="Confirm password" icon={ShieldCheck}>
                    <PasswordInput value={confirmPass} onChange={event => setConfirmPass(event.target.value)} show={showConfirm} onToggle={() => setShowConfirm(value => !value)} autoComplete="new-password" />
                  </Field>
                  <label className="auth-check auth-terms"><input type="checkbox" checked={agree} onChange={event => setAgree(event.target.checked)} /> I agree to the Terms and Conditions</label>
                  {error && <StatusBox type="error">{error}</StatusBox>}
                  <SubmitButton loading={loading}>{loading ? "Creating account…" : "Create Account"}</SubmitButton>
                </form>
                <TrustRow />
              </>
            )}

            {tab === "forgot" && (
              <>
                <FormHeading title="Reset Password" subtitle="We will send a secure link to your Gmail" />
                <form className="auth-form" onSubmit={handleForgot}>
                  <Field label="Gmail address" icon={Mail}>
                    <AuthInput type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@gmail.com" autoComplete="email" required />
                  </Field>
                  {error && <StatusBox type="error">{error}</StatusBox>}
                  <SubmitButton loading={loading} icon={Send}>{loading ? "Sending…" : "Send Reset Link"}</SubmitButton>
                  <BackButton onClick={() => changeTab("signin")}>Back to sign in</BackButton>
                </form>
              </>
            )}

            {tab === "reset" && (
              <>
                <FormHeading title="Set New Password" subtitle="Choose a strong password for your account" />
                <form className="auth-form" onSubmit={handleReset}>
                  <Field label="New password" icon={LockKeyhole}>
                    <PasswordInput value={password} onChange={event => setPassword(event.target.value)} show={showPass} onToggle={() => setShowPass(value => !value)} autoComplete="new-password" />
                    <PasswordStrength password={password} />
                  </Field>
                  <Field label="Confirm password" icon={ShieldCheck}>
                    <PasswordInput value={confirmPass} onChange={event => setConfirmPass(event.target.value)} show={showConfirm} onToggle={() => setShowConfirm(value => !value)} autoComplete="new-password" />
                  </Field>
                  {error && <StatusBox type="error">{error}</StatusBox>}
                  <SubmitButton loading={loading}>{loading ? "Saving…" : "Save New Password"}</SubmitButton>
                  <BackButton onClick={() => { window.history.replaceState({}, "", "/"); setTab("forgot"); clearMessages(); }}>Request another link</BackButton>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <p className="auth-footer">Secure inventory access powered by Supabase</p>
    </main>
  );
}

function PromoPanel({ createMode, onAction }) {
  return (
    <aside className="auth-promo">
      <div className="auth-promo-glow auth-promo-glow-one" />
      <div className="auth-promo-glow auth-promo-glow-two" />
      <div className="auth-promo-content">
        <span className="auth-promo-icon"><Sparkles size={18} /></span>
        <p className="auth-eyebrow">{createMode ? "Welcome back" : "New here?"}</p>
        <h2>{createMode ? "Hello, Friend!" : "Already have an account?"}</h2>
        <p>{createMode ? "Enter your details and start organizing stock, suppliers, sales, and expiry dates." : "Sign in to continue with the inventory workspace you already created."}</p>
        <button type="button" className="auth-outline-button" onClick={onAction}>{createMode ? "Sign In" : "Create Account"}</button>
      </div>
    </aside>
  );
}

function FormHeading({ title, subtitle }) {
  return <header className="auth-heading"><h1>{title}</h1><p>{subtitle}</p></header>;
}

function Field({ label, icon: Icon, children }) {
  return <label className="auth-field"><span>{Icon && <Icon size={14} />} {label}</span>{children}</label>;
}

function AuthInput(props) {
  return <input className="auth-input" {...props} />;
}

function PasswordInput({ show, onToggle, ...props }) {
  return (
    <span className="auth-password">
      <input className="auth-input" type={show ? "text" : "password"} placeholder="••••••••" required {...props} />
      <button type="button" onClick={onToggle} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
    </span>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const passed = pwdRules.filter(rule => rule.test(password)).length;
  return (
    <div className="auth-strength">
      <div className="auth-strength-bar"><span style={{ width: `${(passed / pwdRules.length) * 100}%` }} /></div>
      <div className="auth-rules">
        {pwdRules.map(rule => <span className={rule.test(password) ? "is-valid" : ""} key={rule.id}><Check size={10} /> {rule.label}</span>)}
      </div>
    </div>
  );
}

function SubmitButton({ children, loading, icon: Icon }) {
  return <button className="auth-submit" type="submit" disabled={loading}>{Icon && <Icon size={16} />}{children}</button>;
}

function BackButton({ children, onClick }) {
  return <button className="auth-back" type="button" onClick={onClick}><ArrowLeft size={15} /> {children}</button>;
}

function StatusBox({ children, type }) {
  return <div className={`auth-status auth-status-${type}`} role={type === "error" ? "alert" : "status"}>{type === "error" ? <AlertTriangle size={17} /> : <Check size={17} />}{children}</div>;
}

function TrustRow() {
  return (
    <div className="auth-trust" aria-label="Secure authentication">
      <span><ShieldCheck size={14} /> Protected</span>
      <i />
      <span><LockKeyhole size={14} /> Encrypted</span>
      <i />
      <span><PackageCheck size={14} /> InvenPro</span>
    </div>
  );
}
