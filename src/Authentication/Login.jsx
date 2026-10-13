import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Send,
  ShieldCheck,
  UserRound,
  ExternalLink,
  RefreshCw,
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const clearMessages = () => { setError(""); setSuccess(""); setFieldErrors({}); };
  const reset = () => {
    setEmail(""); setPassword(""); setConfirmPass(""); setFullName(""); setPhone("");
    setAgree(false); setRemember(false); clearMessages();
  };
  const changeTab = next => {
    if (window.location.pathname === "/reset-password") window.history.replaceState({}, "", "/");
    reset();
    setTab(next);
  };

  const handleInputChange = (setter, key) => event => {
    setter(event.target.value);
    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (error) setError("");
  };

  const handleSignIn = async event => {
    event.preventDefault(); clearMessages();
    const errors = {};
    if (!email.trim()) {
      errors.email = "Please fill in your Gmail address.";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Enter a valid Gmail address, such as name@gmail.com.";
    }
    if (!password) {
      errors.password = "Please fill in your password.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.email && errors.password) {
        setError("Please fill in both your Gmail address and Password.");
      } else {
        setError(errors.email || errors.password);
      }
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setError("Your email has not been verified yet. Check Gmail or click Resend link.");
          setTab("verify");
        } else {
          setError(signInError.message);
        }
      }
    } catch { setError("Unable to sign in. Please try again."); }
    finally { setLoading(false); }
  };

  const handleCreate = async event => {
    event.preventDefault(); clearMessages();
    const errors = {};
    const missing = [];

    if (!fullName.trim()) {
      errors.fullName = "Please fill in your full name.";
      missing.push("Full Name");
    }

    if (!phone.trim()) {
      errors.phone = "Please fill in your phone number.";
      missing.push("Phone");
    } else if (!phoneRegex.test(phone.trim())) {
      errors.phone = "Enter a 10-digit phone number starting with 96, 97, or 98.";
    }

    if (!email.trim()) {
      errors.email = "Please fill in your Gmail address.";
      missing.push("Gmail");
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Enter a valid Gmail address, such as name@gmail.com.";
    }

    if (!password) {
      errors.password = "Please fill in your password.";
      missing.push("Password");
    } else if (!pwdRules.every(rule => rule.test(password))) {
      errors.password = "Password does not meet all requirements.";
    }

    if (!confirmPass) {
      errors.confirmPass = "Please confirm your password.";
      missing.push("Confirm Password");
    } else if (password && confirmPass && password !== confirmPass) {
      errors.confirmPass = "Passwords do not match.";
    }

    if (!agree) {
      errors.agree = "Please agree to the Terms and Conditions.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (missing.length > 1) {
        setError(`Please fill in the required options: ${missing.join(", ")}.`);
      } else {
        const firstKey = Object.keys(errors)[0];
        setError(errors[firstKey]);
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName.trim(), phone: phone.trim() },
        },
      });
      if (signUpError) { setError(signUpError.message); return; }
      if (!data.session) {
        setTab("verify");
        setPassword("");
        setConfirmPass("");
        setSuccess(`Verification link sent! Please check your Gmail (${email}).`);
      }
    } catch { setError("Unable to create your account. Please try again."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email to resend.");
      return;
    }
    clearMessages();
    setResending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (resendError) {
        setError(resendError.message);
      } else {
        setSuccess(`A fresh verification link has been sent to ${email}. Check your Gmail inbox and spam folder.`);
      }
    } catch {
      setError("Could not resend verification email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleForgot = async event => {
    event.preventDefault(); clearMessages();
    const errors = {};
    if (!email.trim()) {
      errors.email = "Please fill in your Gmail address.";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Enter a valid Gmail address, such as name@gmail.com.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(errors.email);
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) setError(resetError.message);
      else setSuccess("If this account exists, a reset link will arrive in Gmail shortly.");
    } catch { setError("Unable to send the reset link. Please try again."); }
    finally { setLoading(false); }
  };

  const handleReset = async event => {
    event.preventDefault(); clearMessages();
    const errors = {};
    if (!password) {
      errors.password = "Please fill in your new password.";
    } else if (!pwdRules.every(rule => rule.test(password))) {
      errors.password = "Password does not meet all requirements.";
    }
    if (!confirmPass) {
      errors.confirmPass = "Please confirm your password.";
    } else if (password && confirmPass && password !== confirmPass) {
      errors.confirmPass = "Passwords do not match.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(errors.password || errors.confirmPass);
      return;
    }
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
      <section className={`auth-shell ${createMode ? "auth-shell-create" : ""}`}>
        <PromoPanel createMode={createMode} onAction={() => changeTab(createMode ? "signin" : "create")} />

        <div className="auth-form-panel">
          <div className="auth-form-wrap">
            {success && <StatusBox type="success">{success}</StatusBox>}
            {error && <StatusBox type="error">{error}</StatusBox>}

            {tab === "signin" && (
              <>
                <FormHeading title="Sign in" subtitle="Log in to manage your inventory" />
                <form className="auth-form" onSubmit={handleSignIn} noValidate>
                  <Field label="Gmail address" icon={Mail} error={fieldErrors.email}>
                    <AuthInput type="email" value={email} onChange={handleInputChange(setEmail, "email")} placeholder="name@gmail.com" autoComplete="email" isError={!!fieldErrors.email} />
                  </Field>
                  <Field label="Password" icon={LockKeyhole} error={fieldErrors.password}>
                    <PasswordInput value={password} onChange={handleInputChange(setPassword, "password")} show={showPass} onToggle={() => setShowPass(value => !value)} autoComplete="current-password" isError={!!fieldErrors.password} />
                  </Field>
                  <div className="auth-form-options">
                    <label className="auth-check"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> Remember me</label>
                    <button className="auth-text-button" type="button" onClick={() => { clearMessages(); setTab("forgot"); }}>Forgot password?</button>
                  </div>
                  <SubmitButton loading={loading}>{loading ? "Signing in…" : "Login Now"}</SubmitButton>
                </form>
              </>
            )}

            {tab === "create" && (
              <>
                <FormHeading title="Create Account" subtitle="Set up your inventory workspace" />
                <form className="auth-form auth-create-form" onSubmit={handleCreate} noValidate>
                  <div className="auth-field-grid">
                    <Field label="Full name" icon={UserRound} error={fieldErrors.fullName}>
                      <AuthInput value={fullName} onChange={handleInputChange(setFullName, "fullName")} placeholder="Your name" autoComplete="name" isError={!!fieldErrors.fullName} />
                    </Field>
                    <Field label="Phone number" error={fieldErrors.phone}>
                      <AuthInput type="tel" value={phone} onChange={handleInputChange(setPhone, "phone")} placeholder="98XXXXXXXX" autoComplete="tel" isError={!!fieldErrors.phone} />
                    </Field>
                  </div>
                  <Field label="Gmail address" icon={Mail} error={fieldErrors.email}>
                    <AuthInput type="email" value={email} onChange={handleInputChange(setEmail, "email")} placeholder="name@gmail.com" autoComplete="email" isError={!!fieldErrors.email} />
                  </Field>
                  <Field label="Password" icon={LockKeyhole} error={fieldErrors.password}>
                    <PasswordInput value={password} onChange={handleInputChange(setPassword, "password")} show={showPass} onToggle={() => setShowPass(value => !value)} autoComplete="new-password" isError={!!fieldErrors.password} />
                    <PasswordStrength password={password} />
                  </Field>
                  <Field label="Confirm password" icon={ShieldCheck} error={fieldErrors.confirmPass}>
                    <PasswordInput value={confirmPass} onChange={handleInputChange(setConfirmPass, "confirmPass")} show={showConfirm} onToggle={() => setShowConfirm(value => !value)} autoComplete="new-password" isError={!!fieldErrors.confirmPass} />
                  </Field>
                  <label className={`auth-check auth-terms ${fieldErrors.agree ? "auth-check-error" : ""}`}>
                    <input type="checkbox" checked={agree} onChange={event => { setAgree(event.target.checked); if (fieldErrors.agree) setFieldErrors(prev => { const n = { ...prev }; delete n.agree; return n; }); }} />
                    <span>I agree to the Terms and Conditions</span>
                  </label>
                  {fieldErrors.agree && <span className="auth-field-error" style={{ marginTop: -4, marginBottom: 4 }}>{fieldErrors.agree}</span>}
                  <SubmitButton loading={loading}>{loading ? "Creating account…" : "Create Account"}</SubmitButton>
                </form>
              </>
            )}

            {tab === "verify" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ textAlign: "center", paddingTop: 8 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#ccfbf1", color: "#0d9488", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <Mail size={26} />
                  </div>
                  <FormHeading title="Verify your Gmail" subtitle={`Verification link sent to ${email}`} />
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", fontSize: "0.82rem", color: "#334155", lineHeight: 1.55 }}>
                  <strong style={{ color: "#0f172a", display: "block", marginBottom: 6 }}>How to verify your permission:</strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div>1. Open your <strong>Gmail inbox</strong> ({email}).</div>
                    <div>2. Click the <strong>Confirm your email</strong> link in the message.</div>
                    <div>3. You will be verified and redirected straight into your dashboard!</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="auth-submit"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 16px" }}
                  >
                    <ExternalLink size={16} /> Open Gmail
                  </a>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: "var(--radius)",
                      border: "1.5px solid var(--border)",
                      background: "#fff",
                      fontSize: "0.84rem",
                      fontWeight: 600,
                      cursor: resending ? "wait" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      color: "#334155",
                    }}
                  >
                    <RefreshCw size={14} />
                    {resending ? "Sending fresh link…" : "Resend Verification Link"}
                  </button>

                  <p style={{ margin: "4px 0 0", textAlign: "center", fontSize: "0.74rem", color: "var(--muted-foreground)" }}>
                    Don't see it? Please check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
                  </p>

                  <div style={{ textAlign: "center", paddingTop: 4 }}>
                    <BackButton onClick={() => changeTab("signin")}>Back to sign in</BackButton>
                  </div>
                </div>
              </div>
            )}

            {tab === "forgot" && (
              <>
                <FormHeading title="Reset Password" subtitle="We will send a secure link to your Gmail" />
                <form className="auth-form" onSubmit={handleForgot} noValidate>
                  <Field label="Gmail address" icon={Mail} error={fieldErrors.email}>
                    <AuthInput type="email" value={email} onChange={handleInputChange(setEmail, "email")} placeholder="name@gmail.com" autoComplete="email" isError={!!fieldErrors.email} />
                  </Field>
                  <SubmitButton loading={loading} icon={Send}>{loading ? "Sending…" : "Send Reset Link"}</SubmitButton>
                  <BackButton onClick={() => changeTab("signin")}>Back to sign in</BackButton>
                </form>
              </>
            )}

            {tab === "reset" && (
              <>
                <FormHeading title="Set New Password" subtitle="Choose a strong password for your account" />
                <form className="auth-form" onSubmit={handleReset} noValidate>
                  <Field label="New password" icon={LockKeyhole} error={fieldErrors.password}>
                    <PasswordInput value={password} onChange={handleInputChange(setPassword, "password")} show={showPass} onToggle={() => setShowPass(value => !value)} autoComplete="new-password" isError={!!fieldErrors.password} />
                    <PasswordStrength password={password} />
                  </Field>
                  <Field label="Confirm password" icon={ShieldCheck} error={fieldErrors.confirmPass}>
                    <PasswordInput value={confirmPass} onChange={handleInputChange(setConfirmPass, "confirmPass")} show={showConfirm} onToggle={() => setShowConfirm(value => !value)} autoComplete="new-password" isError={!!fieldErrors.confirmPass} />
                  </Field>
                  <SubmitButton loading={loading}>{loading ? "Saving…" : "Save New Password"}</SubmitButton>
                  <BackButton onClick={() => { window.history.replaceState({}, "", "/"); setTab("forgot"); clearMessages(); }}>Request another link</BackButton>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function PromoPanel({ createMode, onAction }) {
  return (
    <aside className="auth-promo">
      <div className="auth-promo-content">
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

function Field({ label, icon: Icon, error, children }) {
  return (
    <label className="auth-field">
      <span>{Icon && <Icon size={14} />} {label}</span>
      {children}
      {error && <span className="auth-field-error">{error}</span>}
    </label>
  );
}

function AuthInput({ isError, className = "", ...props }) {
  return <input className={`auth-input ${isError ? "is-error" : ""} ${className}`.trim()} {...props} />;
}

function PasswordInput({ show, onToggle, isError, className = "", ...props }) {
  return (
    <span className={`auth-password ${isError ? "has-error" : ""}`}>
      <input className={`auth-input ${isError ? "is-error" : ""} ${className}`.trim()} type={show ? "text" : "password"} placeholder="••••••••" {...props} />
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
