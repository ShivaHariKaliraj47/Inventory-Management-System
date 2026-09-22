import { useState } from "react";

const EMPTY = { name: "", contact: "", email: "", address: "", products: "" };

export default function Suppliers({ suppliers, setSuppliers }) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [viewItem, setViewItem] = useState(null);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, contact: s.contact, email: s.email, address: s.address, products: s.products }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name) return;
    if (editing) {
      setSuppliers(suppliers.map(s => s.id === editing.id ? { ...editing, ...form } : s));
    } else {
      const id = "S" + String(suppliers.length + 1).padStart(3, "0");
      setSuppliers([...suppliers, { id, ...form }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this supplier?")) setSuppliers(suppliers.filter(s => s.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "DM Sans", fontSize: "1.4rem", fontWeight: 700 }}>Suppliers</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>{suppliers.length} suppliers registered</p>
        </div>
        <button onClick={openAdd} style={addBtn}>+ Add Supplier</button>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..." style={searchStyle} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>ID</th><th>Supplier Name</th><th>Contact</th><th>Email</th><th>Products Supplied</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td className="mono" style={{ color: "var(--muted-foreground)", fontSize: "0.8rem" }}>{s.id}</td>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td className="mono">{s.contact}</td>
                  <td style={{ color: "#4f46e5" }}>{s.email}</td>
                  <td style={{ color: "var(--muted-foreground)" }}>{s.products}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setViewItem(s)} style={ab("#3b82f6")}>View</button>
                      <button onClick={() => openEdit(s)} style={ab("#f59e0b")}>Edit</button>
                      <button onClick={() => handleDelete(s.id)} style={ab("#ef4444")}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={overlay}>
          <div style={mBox}>
            <div style={mHdr}>
              <strong style={{ fontFamily: "DM Sans" }}>{editing ? "Edit Supplier" : "Add Supplier"}</strong>
              <button onClick={() => setShowModal(false)} style={xBtn}>✕</button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Fld label="Supplier Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} /></Fld>
                <Fld label="Contact Number"><input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} style={inp} /></Fld>
                <Fld label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></Fld>
                <Fld label="Products Supplied"><input value={form.products} onChange={e => setForm({ ...form, products: e.target.value })} style={inp} /></Fld>
              </div>
              <Fld label="Address"><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} /></Fld>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setShowModal(false)} style={cancelBtn}>Cancel</button>
                <button onClick={handleSave} style={saveBtn}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewItem && (
        <div style={overlay}>
          <div style={mBox}>
            <div style={mHdr}>
              <strong style={{ fontFamily: "DM Sans" }}>Supplier Details</strong>
              <button onClick={() => setViewItem(null)} style={xBtn}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[["ID", viewItem.id], ["Name", viewItem.name], ["Contact", viewItem.contact], ["Email", viewItem.email], ["Address", viewItem.address], ["Products", viewItem.products]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 500, marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setViewItem(null)} style={{ ...cancelBtn, marginTop: 20 }}>Close</button>
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
const mBox = { background: "var(--card)", borderRadius: 14, width: "100%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" };
const mHdr = { padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" };
const xBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "var(--muted-foreground)" };
const inp = { width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 7, background: "var(--muted)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" };
const cancelBtn = { padding: "8px 18px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--muted)", cursor: "pointer" };
const saveBtn = { padding: "8px 18px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 };

function Fld({ label, children }) {
  return <div><label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#374151", marginBottom: 5 }}>{label}</label>{children}</div>;
}
