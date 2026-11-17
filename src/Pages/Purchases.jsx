import { useState } from "react";
import { X } from "lucide-react";

const EMPTY = { supplierId: "", productId: "", quantity: 1, purchasePrice: 0, total: 0, date: new Date().toISOString().split("T")[0] };

function Stepper({ value, onChange, min = 1 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden", width: "fit-content" }}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        style={{ width: 34, height: 36, border: "none", background: value <= min ? "#f1f5f9" : "#fee2e2", color: value <= min ? "#cbd5e1" : "#ef4444", cursor: value <= min ? "not-allowed" : "pointer", fontSize: "1.1rem", fontWeight: 700 }}>−</button>
      <input type="number" value={value} onChange={e => onChange(Math.max(min, +e.target.value))}
        style={{ width: 64, height: 36, textAlign: "center", border: "none", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", outline: "none", fontSize: "0.9rem", fontWeight: 600 }} />
      <button type="button" onClick={() => onChange(value + 1)}
        style={{ width: 34, height: 36, border: "none", background: "#dcfce7", color: "#16a34a", cursor: "pointer", fontSize: "1.1rem", fontWeight: 700 }}>+</button>
    </div>
  );
}

export default function Purchases({ purchases, setPurchases, suppliers, products, setProducts }) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const filtered = purchases.filter(p =>
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    (suppliers.find(s => s.id === p.supplierId)?.name.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const calcTotal = (f) => ({ ...f, total: f.quantity * f.purchasePrice });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ supplierId: p.supplierId, productId: p.productId, quantity: p.quantity, purchasePrice: p.purchasePrice, total: p.total, date: p.date }); setShowModal(true); };

  const handleSave = () => {
    if (!form.supplierId || !form.productId) return;
    const final = calcTotal(form);
    if (editing) {
      const qtyDiff = Number(form.quantity) - Number(editing.quantity);
      setPurchases(purchases.map(p => p.id === editing.id ? { ...final, id: editing.id } : p));
      if (qtyDiff !== 0 && setProducts) {
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === form.productId
              ? { ...p, quantity: Math.max(0, (p.quantity || 0) + qtyDiff) }
              : p
          )
        );
      }
    } else {
      const id = "PUR" + String(purchases.length + 1).padStart(3, "0");
      setPurchases([...purchases, { ...final, id }]);
      if (setProducts) {
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === form.productId
              ? { ...p, quantity: (p.quantity || 0) + Number(form.quantity) }
              : p
          )
        );
      }
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    const purchaseToDelete = purchases.find(p => p.id === id);
    if (!purchaseToDelete) return;
    const prod = products.find(p => p.id === purchaseToDelete.productId);
    const prodName = prod?.name || purchaseToDelete.productId;
    if (confirm(`Delete purchase ${id}? This will deduct ${purchaseToDelete.quantity} unit(s) of "${prodName}" from product stock.`)) {
      setPurchases(purchases.filter(p => p.id !== id));
      if (setProducts) {
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === purchaseToDelete.productId
              ? { ...p, quantity: Math.max(0, (p.quantity || 0) - Number(purchaseToDelete.quantity)) }
              : p
          )
        );
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Purchases</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
            {purchases.length} purchases · Total: Rs. {purchases.reduce((s, p) => s + p.total, 0).toLocaleString()}
          </p>
        </div>
        <button onClick={openAdd} style={addBtn}>+ Add Purchase</button>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search purchases..." style={searchStyle} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th style={{ width: 48, textAlign: "center" }}>S.N</th><th>Purchase ID</th><th>Supplier</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((p, index) => {
                const sup = suppliers.find(s => s.id === p.supplierId);
                const prod = products.find(pr => pr.id === p.productId);
                return (
                  <tr key={p.id}>
                    <td style={{ textAlign: "center", color: "var(--muted-foreground)", fontWeight: 600, fontSize: "0.8rem", fontFamily: "JetBrains Mono" }}>{index + 1}</td>
                    <td className="mono" style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>{p.id}</td>
                    <td style={{ fontWeight: 500 }}>{sup?.name ?? p.supplierId}</td>
                    <td>{prod?.name ?? p.productId}</td>
                    <td className="mono">{p.quantity}</td>
                    <td className="mono">Rs. {p.purchasePrice}</td>
                    <td className="mono" style={{ fontWeight: 700, color: "#4f46e5" }}>Rs. {p.total.toLocaleString()}</td>
                    <td className="mono" style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>{p.date}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(p)} style={ab("#f59e0b")}>Edit</button>
                        <button onClick={() => handleDelete(p.id)} style={ab("#ef4444")}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={overlay}>
          <div style={mBox}>
            <div style={mHdr}>
              <strong>{editing ? "Edit Purchase" : "Add Purchase"}</strong>
              <button onClick={() => setShowModal(false)} style={xBtn}><X size={18} /></button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Fld label="Supplier">
                  <select
                    value={form.supplierId}
                    onChange={e => {
                      const supId = e.target.value;
                      // If current product doesn't belong to this supplier, reset product
                      const stillValid = products.some(p => p.id === form.productId && p.supplierId === supId);
                      setForm(f => ({ ...f, supplierId: supId, productId: stillValid ? f.productId : "" }));
                    }}
                    style={inp}
                  >
                    <option value="">Select supplier</option>
                    {(form.productId ? suppliers.filter(s => s.id === products.find(p => p.id === form.productId)?.supplierId) : suppliers).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </Fld>
                <Fld label="Product">
                  <select
                    value={form.productId}
                    onChange={e => {
                      const prodId = e.target.value;
                      const prod = products.find(p => p.id === prodId);
                      setForm(f => calcTotal({
                        ...f,
                        productId: prodId,
                        supplierId: prod?.supplierId || f.supplierId,
                        purchasePrice: prod?.purchasePrice ?? f.purchasePrice,
                      }));
                    }}
                    style={inp}
                  >
                    <option value="">Select product</option>
                    {(form.supplierId ? products.filter(p => p.supplierId === form.supplierId) : products).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </Fld>
                <Fld label="Quantity">
                  <Stepper value={form.quantity} onChange={v => setForm(f => calcTotal({ ...f, quantity: v }))} />
                </Fld>
                <Fld label="Purchase Price (Rs.)">
                  <input type="number" value={form.purchasePrice} onChange={e => setForm(f => calcTotal({ ...f, purchasePrice: +e.target.value }))} style={inp} />
                </Fld>
                <Fld label="Purchase Date">
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} />
                </Fld>
                <Fld label="Total Amount">
                  <div style={{ padding: "8px 12px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 7, fontWeight: 700, color: "#15803d", fontSize: "1.1rem" }}>
                    Rs. {(form.quantity * form.purchasePrice).toLocaleString()}
                  </div>
                </Fld>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setShowModal(false)} style={cancelBtn}>Cancel</button>
                <button onClick={handleSave} style={saveBtn}>Save Purchase</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const addBtn = { padding: "9px 18px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" };
const searchStyle = { width: "100%", maxWidth: 320, padding: "7px 12px", border: "1px solid var(--border)", borderRadius: 7, background: "var(--muted)", fontSize: "0.875rem", outline: "none" };
const ab = (c) => ({ padding: "4px 10px", border: `1px solid ${c}22`, borderRadius: 5, background: c + "14", color: c, cursor: "pointer", fontSize: "0.78rem", fontWeight: 500 });
const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const mBox = { background: "var(--card)", borderRadius: 14, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" };
const mHdr = { padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" };
const xBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "var(--muted-foreground)" };
const inp = { width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 7, background: "var(--muted)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" };
const cancelBtn = { padding: "8px 18px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--muted)", cursor: "pointer" };
const saveBtn = { padding: "8px 18px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 };

function Fld({ label, children }) {
  return <div><label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#374151", marginBottom: 5 }}>{label}</label>{children}</div>;
}
