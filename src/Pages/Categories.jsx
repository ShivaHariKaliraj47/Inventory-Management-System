import { useState } from "react";
import { Plus, Search, Tag, Package, Coffee, Cookie, Milk, Wheat, Sparkles, ShoppingBag, X } from "lucide-react";

export function getCategoryIcon(name, size = 20, color = "currentColor") {
  const n = (name || "").toLowerCase();
  if (n.includes("beverage") || n.includes("drink")) return <Coffee size={size} color={color} />;
  if (n.includes("snack") || n.includes("biscuit") || n.includes("chip")) return <Cookie size={size} color={color} />;
  if (n.includes("dairy") || n.includes("milk") || n.includes("butter") || n.includes("cheese")) return <Milk size={size} color={color} />;
  if (n.includes("grain") || n.includes("rice") || n.includes("wheat") || n.includes("cereal")) return <Wheat size={size} color={color} />;
  if (n.includes("care") || n.includes("soap") || n.includes("shampoo")) return <Sparkles size={size} color={color} />;
  if (n.includes("condiment") || n.includes("oil") || n.includes("sauce") || n.includes("spice")) return <ShoppingBag size={size} color={color} />;
  return <Tag size={size} color={color} />;
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex", alignItems: "center" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

export default function Categories({ categories, setCategories, products }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [search, setSearch] = useState("");

  const openAdd = () => { setEditing(null); setForm({ name: "", description: "" }); setShowModal(true); };
  const openEdit = (cat, e) => { e.stopPropagation(); setEditing(cat); setForm({ name: cat.name, description: cat.description }); setShowModal(true); };

  const save = () => {
    if (!form.name.trim()) return;
    if (editing) {
      setCategories(prev => prev.map(c => c.id === editing.id ? { ...c, ...form } : c));
    } else {
      const newId = "C" + String(categories.length + 1).padStart(3, "0");
      setCategories(prev => [...prev, { id: newId, ...form }]);
    }
    setShowModal(false);
  };

  const del = (id, e) => {
    e.stopPropagation();
    if (products.some(p => p.categoryId === id)) { alert("Cannot delete — category has products assigned."); return; }
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const catProducts = selectedCat ? products.filter(p => p.categoryId === selectedCat.id) : [];

  if (selectedCat) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSelectedCat(null)} style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>
            ← Back
          </button>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            {getCategoryIcon(selectedCat.name, 20, "#fff")}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>{selectedCat.name}</h2>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{selectedCat.description}</p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span style={{ background: "#ccfbf1", color: "#0f766e", padding: "4px 12px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700 }}>{catProducts.length} products</span>
          </div>
        </div>

        {catProducts.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "48px", textAlign: "center", color: "var(--muted-foreground)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              {getCategoryIcon(selectedCat.name, 36, "var(--muted-foreground)")}
            </div>
            <p style={{ fontWeight: 600 }}>No products in {selectedCat.name} yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {catProducts.map(p => {
              const stockStatus = p.quantity === 0 ? "Out of Stock" : p.quantity <= p.reorderLevel ? "Low Stock" : "In Stock";
              const stockColor = p.quantity === 0 ? "#ef4444" : p.quantity <= p.reorderLevel ? "#f59e0b" : "#16a34a";
              const stockBg   = p.quantity === 0 ? "#fee2e2" : p.quantity <= p.reorderLevel ? "#fef9c3" : "#dcfce7";
              return (
                <div key={p.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "box-shadow 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0fdfa", border: "1px solid #ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                      {getCategoryIcon(selectedCat.name, 18, "var(--primary)")}
                    </div>
                    <span style={{ background: stockBg, color: stockColor, padding: "3px 9px", borderRadius: 20, fontSize: "0.66rem", fontWeight: 700 }}>{stockStatus}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", marginBottom: 10, lineHeight: 1.4 }}>{p.description}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                    <div>
                      <div style={{ fontSize: "0.62rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sell Price</div>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0d9488" }}>Rs. {p.sellingPrice}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.62rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Stock</div>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: stockColor }}>{p.quantity}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Categories</h2>
          <p style={{ margin: "3px 0 0", color: "var(--muted-foreground)", fontSize: "0.82rem" }}>Organize products into logical groups</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={15} style={{ position: "absolute", left: 10, color: "var(--muted-foreground)", pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories…"
              style={{ padding: "8px 12px 8px 32px", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.84rem", outline: "none", width: 200, background: "#fff" }} />
          </div>
          <button onClick={openAdd} style={{ padding: "8px 16px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {filtered.map(cat => {
          const count = products.filter(p => p.categoryId === cat.id).length;
          return (
            <div key={cat.id} onClick={() => setSelectedCat(cat)}
              style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: 13, padding: "18px", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(13,148,136,0.15)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f0fdfa", border: "1px solid #ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                  {getCategoryIcon(cat.name, 22, "var(--primary)")}
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={e => openEdit(cat, e)} style={{ padding: "5px 10px", fontSize: "0.72rem", border: "1px solid var(--border)", borderRadius: 6, background: "#f8fafc", cursor: "pointer", fontWeight: 600 }}>Edit</button>
                  <button onClick={e => del(cat.id, e)} style={{ padding: "5px 10px", fontSize: "0.72rem", border: "1px solid #fca5a5", borderRadius: 6, background: "#fee2e2", color: "#b91c1c", cursor: "pointer", fontWeight: 600 }}>Del</button>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>{cat.name}</div>
              <div style={{ fontSize: "0.77rem", color: "var(--muted-foreground)", marginBottom: 12, lineHeight: 1.4 }}>{cat.description}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.77rem", color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Package size={14} style={{ color: "var(--muted-foreground)" }} /> {count} product{count !== 1 ? "s" : ""}
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 600 }}>View products →</span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: "var(--muted-foreground)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <Search size={32} style={{ color: "var(--muted-foreground)" }} />
            </div>
            <p>No categories match "{search}"</p>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Category" : "Add Category"} onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>Category Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Beverages"
                style={{ padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.875rem", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Short description…"
                style={{ padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: "0.875rem", outline: "none", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "9px 18px", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", background: "#f8fafc", fontSize: "0.875rem" }}>Cancel</button>
              <button onClick={save} style={{ padding: "9px 18px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
                {editing ? "Save" : "Add Category"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
