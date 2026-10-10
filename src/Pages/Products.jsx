import { useState } from "react";
import { Plus, Search, Tag, Eye, Edit2, Trash2, X, Mail } from "lucide-react";
import { getExpiryStatus } from "../data";
import NotifySupplierModal from "../Components/NotifySupplierModal";

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <h3 style={{ margin: 0, fontFamily: "DM Sans", fontSize: "1rem", fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex", alignItems: "center", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

function Stepper({ value, min = 0, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 8, overflow: "hidden", width: "fit-content" }}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: 30, height: 34, border: "none", background: "#f1f5f9", cursor: "pointer", fontSize: "1.1rem", fontWeight: 700, color: "#374151" }}>−</button>
      <input type="number" value={value} min={min} onChange={e => onChange(Math.max(min, Number(e.target.value)))}
        style={{ width: 58, textAlign: "center", border: "none", outline: "none", fontSize: "0.875rem", fontWeight: 600, fontFamily: "JetBrains Mono", padding: "6px 0", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }} />
      <button type="button" onClick={() => onChange(value + 1)}
        style={{ width: 30, height: 34, border: "none", background: "#f1f5f9", cursor: "pointer", fontSize: "1.1rem", fontWeight: 700, color: "#374151" }}>+</button>
    </div>
  );
}

const EMPTY = { name: "", categoryId: "", supplierId: "", purchasePrice: 0, sellingPrice: 0, quantity: 0, reorderLevel: 10, description: "", batchNo: "", expiryDate: "" };

export default function Products({ products, setProducts, categories, suppliers }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [viewProduct, setViewProduct] = useState(null);
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [notifiedMap, setNotifiedMap] = useState({});

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setShowModal(true); };
  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const save = () => {
    if (!form.name.trim() || !form.categoryId || !form.supplierId) { alert("Name, category and supplier are required."); return; }
    if (editing) {
      setProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...form } : p));
    } else {
      const newId = "P" + String(products.length + 1).padStart(3, "0");
      setProducts(prev => [...prev, { ...form, id: newId, dateAdded: new Date().toISOString().slice(0, 10) }]);
    }
    setShowModal(false);
  };

  const del = (id) => {
    if (!confirm("Delete this product?")) return;
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.batchNo?.toLowerCase().includes(q);
    const matchCat = !catFilter || p.categoryId === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Products</h2>
          <p style={{ margin: "3px 0 0", color: "var(--muted-foreground)", fontSize: "0.82rem" }}>{products.length} products across {categories.length} categories</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={15} style={{ position: "absolute", left: 10, color: "var(--muted-foreground)", pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
              style={{ padding: "8px 12px 8px 32px", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.84rem", outline: "none", width: 200, background: "#fff" }} />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.84rem", outline: "none", background: "#fff" }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={openAdd} style={{ padding: "8px 16px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th style={{ width: 48, textAlign: "center" }}>S.N</th>
                <th>Product</th>
                <th>Category</th>
                <th>Batch / Expiry</th>
                <th>Purchase ₹</th>
                <th>Sell ₹</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, index) => {
                const cat = categories.find(c => c.id === p.categoryId);
                const expiry = getExpiryStatus(p.expiryDate);
                const stockLow = p.quantity > 0 && p.quantity <= p.reorderLevel;
                return (
                  <tr key={p.id}>
                    <td style={{ textAlign: "center", color: "var(--muted-foreground)", fontWeight: 600, fontSize: "0.8rem", fontFamily: "JetBrains Mono" }}>
                      {index + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.name}</div>
                      <div style={{ fontSize: "0.69rem", color: "var(--muted-foreground)", fontFamily: "JetBrains Mono" }}>{p.id}</div>
                    </td>
                    <td>
                      {cat ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem", fontWeight: 500, color: "#334155", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>
                          <Tag size={12} style={{ color: "var(--primary)" }} /> {cat.name}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.75rem", fontFamily: "JetBrains Mono", color: "#374151" }}>{p.batchNo || "—"}</div>
                      {p.expiryDate && <div style={{ fontSize: "0.69rem", color: expiry?.status === "expired" ? "#b91c1c" : "var(--muted-foreground)", marginTop: 1 }}>{p.expiryDate}</div>}
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem" }}>₹{p.purchasePrice}</td>
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem", fontWeight: 600, color: "#0d9488" }}>₹{p.sellingPrice}</td>
                    <td>
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem", fontWeight: 700, color: p.quantity === 0 ? "#ef4444" : stockLow ? "#f59e0b" : "#16a34a" }}>
                        {p.quantity}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {p.quantity === 0 && <Bdg bg="#fee2e2" c="#b91c1c">Out of Stock</Bdg>}
                        {stockLow && <Bdg bg="#fef9c3" c="#a16207">Low Stock</Bdg>}
                        {expiry && expiry.status !== "active" && <ExpiryBadge info={expiry} />}
                        {!expiry && p.quantity > 0 && !stockLow && <Bdg bg="#dcfce7" c="#15803d">Active</Bdg>}
                        {expiry?.status === "active" && p.quantity > 0 && !stockLow && <Bdg bg="#dcfce7" c="#15803d">Active</Bdg>}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {(stockLow || p.quantity === 0) && (
                          <button
                            type="button"
                            onClick={() => {
                              const sup = suppliers.find(s => s.id === p.supplierId);
                              setNotifyTarget({ product: p, supplier: sup });
                            }}
                            style={{
                              padding: "5px 9px",
                              border: notifiedMap[p.id] ? "1px solid #86efac" : "1px solid #fed7aa",
                              borderRadius: 6,
                              background: notifiedMap[p.id] ? "#dcfce7" : "#fff7ed",
                              color: notifiedMap[p.id] ? "#15803d" : "#c2410c",
                              cursor: "pointer",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title="Manual replenishment notification to supplier"
                          >
                            <Mail size={12} /> {notifiedMap[p.id] ? "Notified" : "Notify"}
                          </button>
                        )}
                        <button onClick={() => setViewProduct(p)} style={{ padding: "5px 9px", border: "1px solid var(--border)", borderRadius: 6, background: "#f8fafc", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Eye size={12} /> View
                        </button>
                        <button onClick={() => openEdit(p)} style={{ padding: "5px 9px", border: "1px solid #bae6fd", borderRadius: 6, background: "#e0f2fe", color: "#0369a1", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => del(p.id)} style={{ padding: "5px 9px", border: "1px solid #fca5a5", borderRadius: 6, background: "#fee2e2", color: "#b91c1c", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Trash2 size={12} /> Del
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--muted-foreground)" }}>No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? `Edit: ${editing.name}` : "Add New Product"} onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <Fld label="Product Name *">
                  <input value={form.name} onChange={e => f("name", e.target.value)} placeholder="e.g. Coca-Cola 600ml" style={inp} />
                </Fld>
              </div>
              <Fld label="Category *">
                <select value={form.categoryId} onChange={e => f("categoryId", e.target.value)} style={inp}>
                  <option value="">Select category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Fld>
              <Fld label="Supplier *">
                <select value={form.supplierId} onChange={e => f("supplierId", e.target.value)} style={inp}>
                  <option value="">Select supplier…</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Fld>
              <Fld label="Purchase Price (₹)">
                <input type="number" min="0" value={form.purchasePrice} onChange={e => f("purchasePrice", Number(e.target.value))} style={inp} />
              </Fld>
              <Fld label="Selling Price (₹)">
                <input type="number" min="0" value={form.sellingPrice} onChange={e => f("sellingPrice", Number(e.target.value))} style={inp} />
              </Fld>
              <Fld label="Quantity">
                <Stepper value={form.quantity} onChange={v => f("quantity", v)} />
              </Fld>
              <Fld label="Reorder Level">
                <Stepper value={form.reorderLevel} onChange={v => f("reorderLevel", v)} />
              </Fld>
              <Fld label="Batch Number">
                <input value={form.batchNo} onChange={e => f("batchNo", e.target.value)} placeholder="e.g. B2026-09A" style={inp} />
              </Fld>
              <Fld label="Expiry Date">
                <input type="date" value={form.expiryDate} onChange={e => f("expiryDate", e.target.value)} style={inp} />
              </Fld>
              <div style={{ gridColumn: "1/-1" }}>
                <Fld label="Description">
                  <textarea value={form.description} onChange={e => f("description", e.target.value)} rows={2} placeholder="Short description…" style={{ ...inp, resize: "vertical" }} />
                </Fld>
              </div>
            </div>
            {form.expiryDate && (() => {
              const s = getExpiryStatus(form.expiryDate);
              const map = { expired: ["#fee2e2","#b91c1c"], today: ["#ffedd5","#c2410c"], near: ["#fef9c3","#a16207"], soon: ["#ccfbf1","#0f766e"], active: ["#dcfce7","#15803d"] };
              const [bg, color] = map[s?.status] || ["#dcfce7","#15803d"];
              return <div style={{ padding: "8px 12px", borderRadius: 8, background: bg, color, fontSize: "0.78rem", fontWeight: 600 }}>{s?.label ?? "Active"}</div>;
            })()}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "9px 18px", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", background: "#f8fafc", fontSize: "0.875rem" }}>Cancel</button>
              <button onClick={save} style={{ padding: "9px 18px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
                {editing ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {viewProduct && (
        <Modal title={viewProduct.name} onClose={() => setViewProduct(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["ID", viewProduct.id],
              ["Category", categories.find(c => c.id === viewProduct.categoryId)?.name ?? "—"],
              ["Supplier", suppliers.find(s => s.id === viewProduct.supplierId)?.name ?? "—"],
              ["Purchase Price", `₹${viewProduct.purchasePrice}`],
              ["Selling Price", `₹${viewProduct.sellingPrice}`],
              ["Quantity", viewProduct.quantity],
              ["Reorder Level", viewProduct.reorderLevel],
              ["Batch No.", viewProduct.batchNo || "—"],
              ["Expiry Date", viewProduct.expiryDate || "—"],
              ["Date Added", viewProduct.dateAdded],
              ["Description", viewProduct.description],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", borderBottom: "1px solid var(--border)", paddingBottom: 7 }}>
                <span style={{ fontWeight: 600, color: "#374151" }}>{label}</span>
                <span style={{ color: "#0f172a", textAlign: "right", maxWidth: "60%" }}>{val}</span>
              </div>
            ))}
            {viewProduct.expiryDate && (() => {
              const s = getExpiryStatus(viewProduct.expiryDate);
              const map = { expired: ["#fee2e2","#b91c1c"], today: ["#ffedd5","#c2410c"], near: ["#fef9c3","#a16207"], soon: ["#ccfbf1","#0f766e"], active: ["#dcfce7","#15803d"] };
              const [bg, color] = map[s?.status] || ["#dcfce7","#15803d"];
              return <div style={{ padding: "8px 12px", borderRadius: 8, background: bg, color, fontSize: "0.8rem", fontWeight: 600 }}>Expiry: {s?.label}</div>;
            })()}
          </div>
        </Modal>
      )}

      {/* Manual Notify Supplier Modal */}
      {notifyTarget && (
        <NotifySupplierModal
          product={notifyTarget.product}
          supplier={notifyTarget.supplier}
          onClose={() => setNotifyTarget(null)}
          onSent={(pid) => setNotifiedMap(m => ({ ...m, [pid]: true }))}
        />
      )}
    </div>
  );
}

const inp = { padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.875rem", outline: "none", background: "#fff", width: "100%", boxSizing: "border-box" };

function Fld({ label, children }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#374151" }}>{label}</label>{children}</div>;
}
function Bdg({ bg, c, children }) {
  return <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: "0.66rem", fontWeight: 700, background: bg, color: c, display: "inline-block" }}>{children}</span>;
}
function ExpiryBadge({ info }) {
  const map = { expired: ["#fee2e2","#b91c1c"], today: ["#ffedd5","#c2410c"], near: ["#fef9c3","#a16207"], soon: ["#ccfbf1","#0f766e"] };
  const [bg, c] = map[info.status] || ["#dcfce7","#15803d"];
  return <Bdg bg={bg} c={c}>{info.label}</Bdg>;
}
