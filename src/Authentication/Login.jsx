import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  UserRound,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { supabase } from "./supabase";

const nameRegex = /^[A-Za-z]+$/;
const emailRegex = /^[A-Za-z][A-Za-z0-9._-]*@gmail\.com$/;
const phoneRegex = /^(98|97)\d{8}$/;
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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    // Catch errors returned by Supabase email verification in URL hash or search params
    const hash = window.location.hash ? window.location.hash.substring(1) : "";
    const search = window.location.search ? window.location.search.substring(1) : "";
    const params = new URLSearchParams(hash || search);
    const errorDesc = params.get("error_description");
    const errorMsg = params.get("error");
    const errorCode = params.get("error_code");

    if (errorDesc || errorMsg || errorCode) {
      const raw = decodeURIComponent(errorDesc || errorMsg || errorCode).replace(/\+/g, " ");
      if (errorCode === "otp_expired" || raw.toLowerCase().includes("expired") || raw.toLowerCase().includes("invalid")) {
        setError("This confirmation link has expired or was already used. If you clicked it, your account may already be confirmed—try logging in below!");
        setTab("signin");
      } else {
        setError(raw);
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const clearMessages = () => { setError(""); setSuccess(""); setFieldErrors({}); };
  const reset = () => {
    setEmail(""); setPhone(""); setPassword(""); setConfirmPass(""); setFirstName(""); setLastName("");
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

  const handleNameChange = (setter, key) => event => {
    // Only letters A-Z and a-z allowed (no numbers, dots, underscores, special characters)
    const cleaned = event.target.value.replace(/[^A-Za-z]/g, "");
    setter(cleaned);
    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (error) setError("");
  };

  const handlePhoneChange = event => {
    // Only digits, maximum 10
    const cleaned = event.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(cleaned);
    if (fieldErrors.phone) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }
    if (error) setError("");
  };

  const handleSignIn = async event => {
    event.preventDefault(); clearMessages();
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = "Please fill in your Gmail address.";
    } else if (!emailRegex.test(trimmedEmail)) {
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setError("Your email has not been verified yet. Check Gmail or click Resend link.");
          setTab("verify");
        } else {
          setError(signInError.message);
        }
      }
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async event => {
    event.preventDefault(); clearMessages();
    const errors = {};
    const missing = [];

    if (!firstName.trim()) {
      errors.firstName = "Please fill in your first name.";
      missing.push("First Name");
    } else if (!nameRegex.test(firstName.trim())) {
      errors.firstName = "Only letters are allowed. No numbers, dots, underscores, or special characters.";
    }

    if (!lastName.trim()) {
      errors.lastName = "Please fill in your last name.";
      missing.push("Last Name");
    } else if (!nameRegex.test(lastName.trim())) {
      errors.lastName = "Only letters are allowed. No numbers, dots, underscores, or special characters.";
    }

    if (!email.trim()) {
      errors.email = "Please fill in your Gmail address.";
      missing.push("Gmail");
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Enter a valid Gmail address, such as name@gmail.com.";
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!cleanPhone) {
      errors.phone = "Please fill in your phone number.";
      missing.push("Phone");
    } else if (!cleanPhone.startsWith("98") && !cleanPhone.startsWith("97")) {
      errors.phone = "Phone number must start with 98 or 97.";
    } else if (cleanPhone.length !== 10) {
      errors.phone = `Phone number must be exactly 10 digits (currently ${cleanPhone.length}).`;
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.phone = "Phone number must start with 98 or 97 and have 10 digits.";
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
      const formattedPhone = `+977${cleanPhone}`;
      const fullNameCombined = `${firstName.trim()} ${lastName.trim()}`.trim();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullNameCombined,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: formattedPhone,
          },
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
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your Gmail address to resend the verification link.");
      return;
    }
    if (resendCooldown > 0) return;
    clearMessages();
    setResending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        options: { emailRedirectTo: window.location.origin },
      });
      if (resendError) {
        const msg = resendError.message || "";
        if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("security") || resendError.status === 429) {
          setError("Rate limit reached. Please wait 60 seconds before requesting another email, or check your spam folder.");
          setResendCooldown(60);
        } else {
          setError(msg);
        }
      } else {
        setSuccess(`A fresh verification link has been sent to ${cleanEmail}. Check your inbox and spam folder.`);
        setResendCooldown(60);
      }
    } catch {
      setError("Could not resend verification email. Please check your network and try again.");
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
        <div className="auth-form-panel">
          {/* Brand Header */}
          <div className="auth-brand-badge" style={{ justifyContent: "center", marginBottom: 20 }}>
            <div className="auth-brand-badge-name">
              Inventory Management System
            </div>
          </div>

          <div className="auth-form-wrap">
            {success && <StatusBox type="success">{success}</StatusBox>}
            {error && <StatusBox type="error">{error}</StatusBox>}

            {tab === "signin" && (
              <>
                <FormHeading title="Welcome!" subtitle="Log in to manage your inventory" />
                <form className="auth-form" onSubmit={handleSignIn} noValidate>
                  <Field label="Gmail address" icon={Mail} error={fieldErrors.email}>
                    <AuthInput
                      type="email"
                      value={email}
                      onChange={handleInputChange(setEmail, "email")}
                      placeholder="name@gmail.com"
                      autoComplete="email"
                      isError={!!fieldErrors.email}
                    />
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

                <div className="auth-switch-row">
                  <span>Need a new store ledger?</span>
                  <button type="button" className="auth-text-link" onClick={() => changeTab("create")}>
                    Create account →
                  </button>
                </div>
              </>
            )}

            {tab === "create" && (
              <>
                <FormHeading title="Create Account" subtitle="Set up your inventory workspace" />
                <form className="auth-form auth-create-form" onSubmit={handleCreate} noValidate>
                  <div className="auth-field-grid">
                    <Field label="First name" icon={UserRound} error={fieldErrors.firstName}>
                      <AuthInput
                        value={firstName}
                        onChange={handleNameChange(setFirstName, "firstName")}
                        placeholder="First name"
                        autoComplete="given-name"
                        isError={!!fieldErrors.firstName}
                      />
                    </Field>
                    <Field label="Last name" icon={UserRound} error={fieldErrors.lastName}>
                      <AuthInput
                        value={lastName}
                        onChange={handleNameChange(setLastName, "lastName")}
                        placeholder="Last name"
                        autoComplete="family-name"
                        isError={!!fieldErrors.lastName}
                      />
                    </Field>
                  </div>
                  <Field label="Gmail address" icon={Mail} error={fieldErrors.email}>
                    <AuthInput type="email" value={email} onChange={handleInputChange(setEmail, "email")} placeholder="name@gmail.com" autoComplete="email" isError={!!fieldErrors.email} />
                  </Field>
                  <Field label="Phone number" icon={Phone} error={fieldErrors.phone}>
                    <div className={`auth-phone-group ${fieldErrors.phone ? "is-error" : ""}`}>
                      <span className="auth-phone-prefix">+977</span>
                      <input
                        type="tel"
                        className="auth-phone-input"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="98XXXXXXXX"
                        maxLength={10}
                        autoComplete="tel-national"
                      />
                    </div>
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

                <div className="auth-switch-row">
                  <span>Already registered?</span>
                  <button type="button" className="auth-text-link" onClick={() => changeTab("signin")}>
                    Sign in to workspace →
                  </button>
                </div>
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

                <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px", fontSize: "0.82rem", color: "#334155", lineHeight: 1.6 }}>
                  <strong style={{ color: "#0f172a", display: "block", marginBottom: 8, fontSize: "0.86rem" }}>Next steps to activate your account:</strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <div>1. Open your <strong>Gmail inbox</strong> on this computer ({email || "your email"}).</div>
                    <div>2. Look for the message with subject <em>"Confirm your signup"</em>.</div>
                    <div>3. Click the <strong>Confirm your email</strong> link in the message.</div>
                    <div>4. You will be automatically redirected to your dashboard!</div>
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
                    disabled={resending || resendCooldown > 0}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: "var(--radius)",
                      border: "1.5px solid var(--border)",
                      background: resendCooldown > 0 ? "var(--muted)" : "#fff",
                      fontSize: "0.84rem",
                      fontWeight: 600,
                      cursor: resending || resendCooldown > 0 ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      color: resendCooldown > 0 ? "var(--muted-foreground)" : "#334155",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <RefreshCw size={14} style={{ animation: resending ? "spin 1s linear infinite" : "none" }} />
                    {resending
                      ? "Sending fresh link…"
                      : resendCooldown > 0
                      ? `Resend link (in ${resendCooldown}s)`
                      : "Resend Verification Link"}
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
