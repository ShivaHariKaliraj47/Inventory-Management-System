import { useState } from "react";
import { getExpiryStatus } from "../data";
import { AlertTriangle, Clock, X, Check, Printer } from "lucide-react";

const EMPTY = { productId: "", quantity: 1, sellingPrice: 0, total: 0, date: new Date().toISOString().split("T")[0], customer: "" };

function Stepper({ value, onChange, min = 1 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden", width: "fit-content" }}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        style={{ width: 34, height: 36, border: "none", background: value <= min ? "#f5f0e8" : "#fde8e8", color: value <= min ? "#c9b99a" : "#e05252", cursor: value <= min ? "not-allowed" : "pointer", fontSize: "1.1rem", fontWeight: 700 }}>−</button>
      <input type="number" value={value} onChange={e => onChange(Math.max(min, +e.target.value))}
        style={{ width: 60, height: 36, textAlign: "center", border: "none", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", outline: "none", fontSize: "0.9rem", fontWeight: 600, background: "#fff" }} />
      <button type="button" onClick={() => onChange(value + 1)}
        style={{ width: 34, height: 36, border: "none", background: "#d1f5e4", color: "#1a6b44", cursor: "pointer", fontSize: "1.1rem", fontWeight: 700 }}>+</button>
    </div>
  );
}

export default function Sales({ sales, setSales, products, setProducts }) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [invoice, setInvoice] = useState(null);

  const filtered = sales.filter(s =>
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    (s.customer && s.customer.toLowerCase().includes(search.toLowerCase())) ||
    (products.find(p => p.id === s.productId)?.name.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const calcTotal = (f) => ({ ...f, total: f.quantity * f.sellingPrice });

  const handleSave = () => {
    if (!form.productId) return;
    const final = calcTotal(form);
    const prod = products.find(p => p.id === form.productId);
    if (prod && prod.quantity < form.quantity) {
      alert(`Insufficient stock! Only ${prod.quantity} units available.`);
      return;
    }
    const id = "SAL" + String(sales.length + 1).padStart(3, "0");
    const newSale = { ...final, id };
    setSales([...sales, newSale]);
    setProducts(products.map(p => p.id === form.productId ? { ...p, quantity: p.quantity - form.quantity } : p));
    setInvoice(newSale);
    setShowModal(false);
    setForm(EMPTY);
  };

  const handleDelete = (id) => {
    const saleToDelete = sales.find(s => s.id === id);
    if (!saleToDelete) return;
    const prod = products.find(p => p.id === saleToDelete.productId);
    const prodName = prod?.name || saleToDelete.productId;
    if (confirm(`Delete sale ${id}? This will restore ${saleToDelete.quantity} unit(s) of "${prodName}" back to product stock.`)) {
      setSales(sales.filter(s => s.id !== id));
      if (setProducts) {
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === saleToDelete.productId
              ? { ...p, quantity: (p.quantity || 0) + Number(saleToDelete.quantity) }
              : p
          )
        );
      }
    }
  };

  const handlePrint = (inv) => {
    if (!inv) return;
    const prod = products.find(p => p.id === inv.productId);
    const prodName = prod?.name ?? inv.productId;
    const customerName = inv.customer && inv.customer.trim() ? inv.customer : "Walk-in Customer";

    const printWin = window.open("", "_blank", "width=420,height=600");
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${inv.id}</title>
          <meta charset="utf-8">
          <style>
            @page { size: auto; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 16px; color: #1c1916; font-size: 13px; }
            .receipt { max-width: 340px; margin: 0 auto; border: 1px dashed #bbb; padding: 18px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 14px; }
            .store-title { font-size: 18px; font-weight: 700; }
            .store-sub { font-size: 11px; color: #666; margin-top: 2px; }
            .divider { border: none; border-top: 1px dashed #ccc; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 7px; font-size: 12.5px; }
            .label { color: #555; }
            .val { font-weight: 600; text-align: right; }
            .total-row { display: flex; justify-content: space-between; border-top: 2px solid #222; padding-top: 10px; margin-top: 10px; font-size: 15px; font-weight: 700; }
            .footer { text-align: center; margin-top: 16px; padding: 8px; background: #dcfce7; border-radius: 6px; color: #15803d; font-size: 11.5px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="store-title">IMS Store</div>
              <div class="store-sub">Inventory Management System • Nepal</div>
            </div>
            <hr class="divider" />
            <div class="row"><span class="label">Invoice No:</span><span class="val">${inv.id}</span></div>
            <div class="row"><span class="label">Date:</span><span class="val">${inv.date}</span></div>
            <div class="row"><span class="label">Customer:</span><span class="val">${customerName}</span></div>
            <div class="row"><span class="label">Product:</span><span class="val">${prodName}</span></div>
            <div class="row"><span class="label">Quantity:</span><span class="val">${inv.quantity}</span></div>
            <div class="row"><span class="label">Unit Price:</span><span class="val">Rs. ${inv.sellingPrice}</span></div>
            <div class="total-row"><span>Total Amount:</span><span style="color: #15803d;">Rs. ${inv.total.toLocaleString()}</span></div>
            <div class="footer">✓ Thank you for your purchase!</div>
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const totalRev = sales.reduce((s, x) => s + x.total, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Sales</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
            {sales.length} sales · Revenue: Rs. {totalRev.toLocaleString()}
          </p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowModal(true); }} style={addBtn}>+ Create Sale</button>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(28,25,22,0.05)" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sales…" style={searchStyle} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48, textAlign: "center" }}>S.N</th><th>Sale ID</th><th>Product</th><th>Customer</th>
                <th>Qty</th><th>Unit Price</th><th>Total</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, index) => {
                const prod = products.find(p => p.id === s.productId);
                const hasCustomer = s.customer && s.customer.trim() !== "";
                return (
                  <tr key={s.id}>
                    <td style={{ textAlign: "center", color: "var(--muted-foreground)", fontWeight: 600, fontSize: "0.8rem", fontFamily: "JetBrains Mono" }}>{index + 1}</td>
                    <td className="mono" style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{s.id}</td>
                    <td style={{ fontWeight: 500 }}>{prod?.name ?? s.productId}</td>
                    <td>
                      {hasCustomer
                        ? <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#fdf0e0", color: "#92600a", fontSize: "0.65rem", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {s.customer.trim()[0].toUpperCase()}
                            </span>
                            {s.customer}
                          </span>
                        : <span style={{ color: "var(--muted-foreground)", fontSize: "0.78rem", fontStyle: "italic" }}>—</span>
                      }
                    </td>
                    <td className="mono">{s.quantity}</td>
                    <td className="mono">Rs. {s.sellingPrice}</td>
                    <td className="mono" style={{ fontWeight: 700, color: "#3a9e6e" }}>Rs. {s.total.toLocaleString()}</td>
                    <td className="mono" style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{s.date}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => setInvoice(s)} style={ab("#3a7fc1")}>Invoice</button>
                        <button onClick={() => handleDelete(s.id)} style={ab("#e05252")}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sale Modal */}
      {showModal && (
        <div style={overlay}>
          <div style={mBox}>
            <div style={mHdr}>
              <strong style={{ fontSize: "1rem" }}>Create New Sale</strong>
              <button onClick={() => setShowModal(false)} style={xBtn}><X size={18} /></button>
            </div>
            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Fld label="Product">
                  <select value={form.productId} onChange={e => {
                    const prod = products.find(p => p.id === e.target.value);
                    setForm(f => calcTotal({ ...f, productId: e.target.value, sellingPrice: prod?.sellingPrice ?? 0 }));
                  }} style={inp}>
                    <option value="">Select product</option>
                    {products.filter(p => {
                      if (p.quantity <= 0) return false;
                      const exp = getExpiryStatus(p.expiryDate);
                      return exp?.status !== "expired" && exp?.status !== "today";
                    }).map(p => {
                      const exp = getExpiryStatus(p.expiryDate);
                      const warn = exp?.status === "near" ? " (Near Expiry)" : exp?.status === "soon" ? " (Exp Soon)" : "";
                      return <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity}){warn}</option>;
                    })}
                  </select>
                </Fld>
                <Fld label="Customer Name (optional)">
                  <input
                    value={form.customer}
                    onChange={e => setForm({ ...form, customer: e.target.value })}
                    placeholder="e.g. Ravi Kumar"
                    style={inp}
                  />
                </Fld>
                {form.productId && (() => {
                  const exp = getExpiryStatus(products.find(p => p.id === form.productId)?.expiryDate);
                  if (exp?.status === "near") return <div style={{ gridColumn: "1/-1", padding: "8px 12px", background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, fontSize: "0.78rem", color: "#a16207", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} color="#a16207" /> This product {exp.label} — sell quickly.</div>;
                  if (exp?.status === "soon") return <div style={{ gridColumn: "1/-1", padding: "8px 12px", background: "#ccfbf1", border: "1px solid #5eead4", borderRadius: 8, fontSize: "0.78rem", color: "#0f766e", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} color="#0f766e" /> {exp.label} — consider selling soon.</div>;
                  return null;
                })()}
                <Fld label="Quantity">
                  <Stepper value={form.quantity} onChange={v => setForm(f => calcTotal({ ...f, quantity: v }))} />
                </Fld>
                <Fld label="Selling Price (Rs.)">
                  <input type="number" value={form.sellingPrice} onChange={e => setForm(f => calcTotal({ ...f, sellingPrice: +e.target.value }))} style={inp} />
                </Fld>
                <Fld label="Sale Date">
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} />
                </Fld>
                <Fld label="Total Amount">
                  <div style={{ padding: "9px 12px", background: "#d1f5e4", border: "1px solid #86efac", borderRadius: 8, fontWeight: 700, color: "#1a6b44", fontSize: "1.1rem", fontFamily: "JetBrains Mono" }}>
                    Rs. {(form.quantity * form.sellingPrice).toLocaleString()}
                  </div>
                </Fld>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setShowModal(false)} style={cancelBtn}>Cancel</button>
                <button onClick={handleSave} style={saveBtn}>Save &amp; Generate Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice */}
      {invoice && (
        <div style={overlay}>
          <div id="printable-invoice" style={{ ...mBox, maxWidth: 420 }}>
            <div style={mHdr} className="no-print">
              <strong>Sales Receipt / Tax Invoice</strong>
              <button onClick={() => setInvoice(null)} style={xBtn}><X size={18} /></button>
            </div>
            <div style={{ padding: 26 }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div className="no-print" style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: "var(--primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 10px",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                </div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1c1916" }}>IMS Store</div>
                <div style={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}>Inventory Management System • Nepal</div>
              </div>

              <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["Invoice No.", invoice.id],
                  ["Date", invoice.date],
                  ...(invoice.customer && invoice.customer.trim() ? [["Customer", invoice.customer]] : [["Customer", "Walk-in Customer"]]),
                  ["Product", products.find(p => p.id === invoice.productId)?.name ?? invoice.productId],
                  ["Quantity", invoice.quantity],
                  ["Unit Price", `Rs. ${invoice.sellingPrice}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.855rem" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: "2px solid var(--border)", paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: "1rem" }}>Total Amount</span>
                  <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "#3a9e6e", fontFamily: "JetBrains Mono" }}>Rs. {invoice.total.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: 18, padding: "10px", background: "#d1f5e4", borderRadius: 9, color: "#1a6b44", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Check size={16} /> Thank you for your purchase!
              </div>

              <div className="no-print" style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => handlePrint(invoice)}
                  style={{ ...saveBtn, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <Printer size={16} /> Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setInvoice(null)}
                  style={{ ...cancelBtn, flex: 1 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const addBtn = { padding: "9px 18px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 9, fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" };
const searchStyle = { width: "100%", maxWidth: 320, padding: "7px 12px", border: "1.5px solid var(--border)", borderRadius: 8, background: "var(--muted)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" };
const ab = (c) => ({ padding: "4px 10px", border: `1px solid ${c}22`, borderRadius: 5, background: c + "18", color: c, cursor: "pointer", fontSize: "0.75rem", fontWeight: 500 });
const overlay = { position: "fixed", inset: 0, background: "rgba(28,25,22,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const mBox = { background: "#fff", borderRadius: 14, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(28,25,22,0.2)" };
const mHdr = { padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" };
const xBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--muted-foreground)", padding: 2 };
const inp = { width: "100%", padding: "9px 11px", border: "1.5px solid var(--border)", borderRadius: 8, background: "var(--muted)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" };
const cancelBtn = { padding: "9px 18px", border: "1.5px solid var(--border)", borderRadius: 9, background: "var(--muted)", cursor: "pointer" };
const saveBtn = { padding: "9px 18px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600 };

function Fld({ label, children }) {
  return <div><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4a3f2f", marginBottom: 5 }}>{label}</label>{children}</div>;
}
