import { useState } from "react";
import { Mail, MessageCircle, Database, X, CheckCircle2, AlertCircle, KeyRound, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../Authentication/supabase";

export default function NotifySupplierModal({ product, supplier, onClose, onSent }) {
  const [reorderQty, setReorderQty] = useState(
    Math.max(10, (product.reorderLevel || 10) * 2)
  );
  const [supplierEmail, setSupplierEmail] = useState(supplier?.email || "");
  const [supplierPhone, setSupplierPhone] = useState(supplier?.contact || "");
  const [note, setNote] = useState("");
  const [resendKey, setResendKey] = useState(
    () => localStorage.getItem("resend_api_key") || import.meta.env.VITE_RESEND_API_KEY || ""
  );
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const composeMessage = () => {
    return (
      `Dear ${supplier?.name || "Supplier"},\n\n` +
      `This is a stock replenishment request for:\n` +
      `• Product: ${product.name} (ID: ${product.id})\n` +
      `• Current Stock: ${product.quantity} units (Reorder Level: ${product.reorderLevel})\n` +
      `• Requested Reorder Quantity: ${reorderQty} units\n` +
      (note ? `• Note: ${note}\n` : "") +
      `\nPlease confirm availability and dispatch replenishment.\n\n` +
      `Thank you,\nIMS Flow`
    );
  };

  const subject = `[Reorder Alert] Low Stock: ${product.name} (${product.id})`;

  // Option 1: WhatsApp
  const handleWhatsApp = () => {
    const cleanPhone = (supplierPhone || "").replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      setStatusMessage({ type: "error", text: "Supplier phone number is missing." });
      return;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(composeMessage())}`;
    window.open(url, "_blank");
    if (onSent) onSent(product.id);
    setStatusMessage({ type: "info", text: "Opened WhatsApp chat with prefilled message." });
  };

  // Option 2: Email (Direct API / Gmail)
  const handleEmail = async () => {
    if (!supplierEmail.trim()) {
      setStatusMessage({ type: "error", text: "Please provide a valid supplier email address." });
      return;
    }

    setSending(true);
    setStatusMessage(null);

    const key = resendKey.trim();

    // If Resend key is available, send directly via backend
    if (key) {
      localStorage.setItem("resend_api_key", key);
      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: key,
            from: "onboarding@resend.dev",
            to: supplierEmail.trim(),
            subject,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
                <h2 style="color: #0d9488; margin-top: 0;">Stock Replenishment Request</h2>
                <p>Dear <strong>${supplier?.name || "Supplier"}</strong>,</p>
                <p>The stock level for the following item is low and requires replenishment:</p>
                <table style="width: 100%; max-width: 480px; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <tr><td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Product Name</td><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">${product.name}</td></tr>
                  <tr><td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Product ID</td><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">${product.id}</td></tr>
                  <tr><td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Current Stock</td><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #b91c1c; font-weight: bold;">${product.quantity} units</td></tr>
                  <tr><td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Reorder Level</td><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">${product.reorderLevel} units</td></tr>
                  <tr><td style="padding: 10px 14px; font-weight: bold; color: #0d9488;">Requested Order</td><td style="padding: 10px 14px; font-weight: bold; color: #0d9488;">${reorderQty} units</td></tr>
                </table>
                ${note ? `<p style="padding: 10px 14px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;"><strong>Note:</strong> ${note}</p>` : ""}
                <p>Please confirm availability and dispatch replenishment.</p>
                <p style="margin-top: 24px; color: #64748b; font-size: 0.85rem;">Sent from IMS Flow Inventory Management System</p>
              </div>
            `,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || "Email delivery failed");

        // Record in Supabase logs
        if (supabase) {
          supabase.from("supplier_email_logs").insert([
            {
              product_id: product.id,
              product_name: product.name,
              supplier_name: supplier?.name || "Supplier",
              supplier_email: supplierEmail.trim(),
              quantity_left: product.quantity,
              reorder_level: product.reorderLevel,
            },
          ]).then(() => {});
        }

        setStatusMessage({
          type: "success",
          text: `✓ Email delivered directly to ${supplierEmail.trim()}! Please check your inbox.`,
        });
        if (onSent) onSent(product.id);
        setSending(false);
        return;
      } catch (err) {
        console.warn("Direct send error, opening Gmail:", err);
      }
    }

    // Fallback: Open Gmail compose with prefilled details
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(supplierEmail.trim())}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(composeMessage())}`;
    window.open(gmailUrl, "_blank");
    setStatusMessage({
      type: "success",
      text: `Opened Gmail compose to ${supplierEmail.trim()}. Click Send in Gmail to dispatch!`,
    });
    if (onSent) onSent(product.id);
    setSending(false);
  };

  // Option 3: Supabase
  const handleSupabase = async () => {
    if (!supplierEmail.trim()) {
      setStatusMessage({ type: "error", text: "Please provide a valid supplier email address." });
      return;
    }

    setSending(true);
    setStatusMessage(null);

    try {
      if (!supabase) throw new Error("Supabase is not configured.");

      const { data, error } = await supabase.rpc("send_low_stock_email", {
        p_product_id: product.id,
        p_product_name: product.name,
        p_supplier_name: supplier?.name || "Supplier",
        p_supplier_email: supplierEmail.trim(),
        p_quantity: product.quantity,
        p_reorder_level: product.reorderLevel,
      });

      if (error) {
        // Fallback: direct table insert
        const { error: insertErr } = await supabase.from("supplier_email_logs").insert([
          {
            product_id: product.id,
            product_name: product.name,
            supplier_name: supplier?.name || "Supplier",
            supplier_email: supplierEmail.trim(),
            quantity_left: product.quantity,
            reorder_level: product.reorderLevel,
          },
        ]);
        if (insertErr) throw insertErr;
      }

      setStatusMessage({
        type: "success",
        text: `✓ Successfully saved to Supabase (supplier_email_logs table)!`,
      });
      if (onSent) onSent(product.id);
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: `Supabase error: ${err.message || "Failed to save"}`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 540, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#b91c1c" }}>
              <Mail size={17} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Notify Supplier: Low Stock</h3>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Manual trigger — sent only when you click</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex", alignItems: "center", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Product & Stock Summary Box */}
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#991b1b", fontWeight: 600, textTransform: "uppercase" }}>Product</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1c1917" }}>{product.name}</div>
              <div style={{ fontSize: "0.75rem", color: "#78716c", fontFamily: "JetBrains Mono" }}>ID: {product.id}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#991b1b", fontWeight: 600, textTransform: "uppercase" }}>Stock Status</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 700, color: product.quantity === 0 ? "#b91c1c" : "#b45309" }}>
                {product.quantity} units left
              </div>
              <div style={{ fontSize: "0.75rem", color: "#78716c" }}>Min Level: {product.reorderLevel} units</div>
            </div>
          </div>

          {/* Form details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                Supplier Name
              </label>
              <input value={supplier?.name || "Unknown Supplier"} readOnly style={readOnlyInput} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                Supplier Email *
              </label>
              <input
                type="email"
                value={supplierEmail}
                onChange={e => setSupplierEmail(e.target.value)}
                placeholder="supplier@example.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                Supplier Phone (WhatsApp)
              </label>
              <input
                value={supplierPhone}
                onChange={e => setSupplierPhone(e.target.value)}
                placeholder="e.g. 9800000000"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                Reorder Qty to Request
              </label>
              <input
                type="number"
                min="1"
                value={reorderQty}
                onChange={e => setReorderQty(Math.max(1, Number(e.target.value)))}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 600, color: "#374151", marginBottom: 5 }}>
              Optional Note / Instructions
            </label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Please deliver by this Friday morning"
              style={inputStyle}
            />
          </div>

          {/* Resend API Key Config (Optional) */}
          <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px" }}>
            <div
              onClick={() => setShowKeyInput(v => !v)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.76rem", fontWeight: 600, color: "#475569" }}>
                <KeyRound size={13} color="#0d9488" />
                <span>Resend API Key {resendKey ? "(Saved ✓)" : "(Click to configure direct inbox send)"}</span>
              </div>
              <span style={{ color: "var(--muted-foreground)" }}>
                {showKeyInput ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </span>
            </div>

            {showKeyInput && (
              <div style={{ marginTop: 8 }}>
                <input
                  type="password"
                  value={resendKey}
                  onChange={e => {
                    setResendKey(e.target.value);
                    localStorage.setItem("resend_api_key", e.target.value.trim());
                  }}
                  placeholder="Paste key starting with re_..."
                  style={{ ...inputStyle, fontFamily: "JetBrains Mono", fontSize: "0.78rem", background: "#fff" }}
                />
                <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: "var(--muted-foreground)" }}>
                  Key is saved in your browser for direct email delivery.
                </p>
              </div>
            )}
          </div>

          {/* Message Preview */}
          <div>
            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 4 }}>
              Message Preview:
            </label>
            <pre style={{
              background: "#f8fafc",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: "0.75rem",
              lineHeight: 1.45,
              whiteSpace: "pre-wrap",
              color: "#334155",
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}>
              {composeMessage()}
            </pre>
          </div>

          {/* Status Alert */}
          {statusMessage && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: statusMessage.type === "success" ? "#dcfce7" : statusMessage.type === "error" ? "#fee2e2" : "#e0f2fe",
              color: statusMessage.type === "success" ? "#15803d" : statusMessage.type === "error" ? "#b91c1c" : "#0369a1",
              border: `1px solid ${statusMessage.type === "success" ? "#86efac" : statusMessage.type === "error" ? "#fca5a5" : "#bae6fd"}`,
            }}>
              {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* 3 Clear Action Buttons: WhatsApp, Email, Supabase */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 14px", border: "1px solid var(--border)", borderRadius: 8, background: "#f8fafc", cursor: "pointer", fontSize: "0.82rem", fontWeight: 500 }}
            >
              Cancel
            </button>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* Option 1: WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsApp}
                title="Send notification via WhatsApp"
                style={{
                  padding: "8px 16px",
                  border: "1px solid #86efac",
                  borderRadius: 8,
                  background: "#f0fdf4",
                  color: "#16a34a",
                  cursor: "pointer",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
              >
                <MessageCircle size={15} /> WhatsApp
              </button>

              {/* Option 2: Email */}
              <button
                type="button"
                onClick={handleEmail}
                disabled={sending}
                title="Send email to supplier"
                style={{
                  padding: "8px 16px",
                  border: "1px solid #bae6fd",
                  borderRadius: 8,
                  background: "#f0f9ff",
                  color: "#0284c7",
                  cursor: sending ? "wait" : "pointer",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
              >
                <Mail size={15} /> {sending ? "Sending…" : "Email"}
              </button>

              {/* Option 3: Supabase */}
              <button
                type="button"
                onClick={handleSupabase}
                disabled={sending}
                title="Log notification to Supabase database"
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 8,
                  background: "var(--primary)",
                  color: "#fff",
                  cursor: sending ? "wait" : "pointer",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 6px rgba(13,148,136,0.3)",
                  transition: "all 0.15s ease",
                }}
              >
                <Database size={15} /> Supabase
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 11px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: "0.84rem",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};

const readOnlyInput = {
  ...inputStyle,
  background: "#f1f5f9",
  color: "#475569",
  cursor: "not-allowed",
};
