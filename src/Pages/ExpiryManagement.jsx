import { useState } from "react";
import { getExpiryStatus } from "../data";
import { AlertTriangle, CheckCircle2, Tag, X } from "lucide-react";

const TABS = [
  { key: "expired", label: "Expired",         color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
  { key: "today",   label: "Expiring Today",   color: "#c2410c", bg: "#ffedd5", border: "#fdba74" },
  { key: "near",    label: "Within 7 Days",    color: "#a16207", bg: "#fef9c3", border: "#fde047" },
  { key: "soon",    label: "Within 30 Days",   color: "#0f766e", bg: "#ccfbf1", border: "#5eead4" },
];

export default function ExpiryManagement({ products, setProducts, categories }) {
  const [activeTab, setActiveTab] = useState("expired");
  const [searchQ, setSearchQ] = useState("");

  const categorized = products
    .filter(p => p.expiryDate)
    .map(p => {
      const s = getExpiryStatus(p.expiryDate);
      const cat = categories.find(c => c.id === p.categoryId);
      return { ...p, expiryInfo: s, catName: cat?.name ?? "—" };
    })
    .filter(p => p.expiryInfo);

  const getCounts = () => ({
    expired: categorized.filter(p => p.expiryInfo.status === "expired").length,
    today:   categorized.filter(p => p.expiryInfo.status === "today").length,
    near:    categorized.filter(p => p.expiryInfo.status === "near").length,
    soon:    categorized.filter(p => p.expiryInfo.status === "soon").length,
  });
  const counts = getCounts();

  const filtered = categorized.filter(p => {
    if (p.expiryInfo.status !== activeTab) return false;
    if (searchQ && !p.name.toLowerCase().includes(searchQ.toLowerCase()) && !p.batchNo?.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  }).sort((a, b) => a.expiryInfo.days - b.expiryInfo.days);

  const markWriteOff = (id) => {
    if (!confirm("Mark this product as written off? Its quantity will be set to 0.")) return;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: 0, notes: "Written off — expired" } : p));
  };

  const activeTabCfg = TABS.find(t => t.key === activeTab);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Expiry Management</h2>
        <p style={{ margin: "3px 0 0", color: "var(--muted-foreground)", fontSize: "0.82rem" }}>Monitor batch expiry, take action on expired stock. Expired records are preserved.</p>
      </div>

      {/* Summary tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {TABS.map(t => (
          <div key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ background: activeTab === t.key ? t.bg : "#fff", border: `1.5px solid ${activeTab === t.key ? t.border : "var(--border)"}`, borderRadius: 11, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: t.color, fontFamily: "DM Sans" }}>{counts[t.key]}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: t.color, marginTop: 2 }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 11, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ flex: 1, padding: "11px 0", border: "none", background: activeTab === t.key ? t.bg : "transparent", fontWeight: activeTab === t.key ? 700 : 500, fontSize: "0.82rem", color: activeTab === t.key ? t.color : "var(--muted-foreground)", cursor: "pointer", borderBottom: activeTab === t.key ? `2.5px solid ${t.color}` : "2.5px solid transparent", transition: "all 0.15s" }}>
              {t.label} ({counts[t.key]})
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by product name or batch no…"
            style={{ padding: "7px 12px", border: "1px solid var(--border)", borderRadius: 7, fontSize: "0.84rem", outline: "none", width: 280 }} />
          {searchQ && (
            <button onClick={() => setSearchQ("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
              Clear <X size={13} />
            </button>
          )}
          <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Table */}
        {activeTab === "expired" && (
          <div style={{ padding: "10px 16px 12px", background: activeTabCfg.bg, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={15} color={activeTabCfg.color} style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: "0.78rem", color: activeTabCfg.color, fontWeight: 600 }}>
              Expired products are automatically blocked from new sales. Use "Write Off" to zero out stock and record the loss.
            </p>
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted-foreground)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <CheckCircle2 size={36} color="#16a34a" />
            </div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>No products in this category</p>
            <p style={{ fontSize: "0.8rem", margin: 0 }}>{activeTab === "expired" ? "Great — nothing expired!" : "Nothing in this expiry window."}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th style={{ width: 48, textAlign: "center" }}>S.N</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Batch No.</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Qty</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, index) => (
                  <tr key={p.id}>
                    <td style={{ textAlign: "center", color: "var(--muted-foreground)", fontWeight: 600, fontSize: "0.8rem", fontFamily: "JetBrains Mono" }}>
                      {index + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.name}</div>
                      <div style={{ fontSize: "0.69rem", color: "var(--muted-foreground)", fontFamily: "JetBrains Mono" }}>{p.id}</div>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem", fontWeight: 500, color: "#334155", background: "#f1f5f9", padding: "2px 8px", borderRadius: 6 }}>
                        <Tag size={12} style={{ color: "var(--primary)" }} /> {p.catName}
                      </span>
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.8rem", color: "#374151" }}>{p.batchNo || "—"}</td>
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem" }}>
                      <span style={{ color: p.expiryInfo.status === "expired" ? "#b91c1c" : "inherit", fontWeight: p.expiryInfo.status === "expired" ? 700 : 500 }}>
                        {p.expiryDate}
                      </span>
                    </td>
                    <td>
                      <ExpiryBadge info={p.expiryInfo} />
                    </td>
                    <td>
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem", fontWeight: 600, color: p.quantity === 0 ? "#94a3b8" : "inherit" }}>
                        {p.quantity}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {p.expiryInfo.status === "expired" && p.quantity > 0 && (
                        <button onClick={() => markWriteOff(p.id)}
                          style={{ padding: "5px 12px", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: 6, cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
                          Write Off
                        </button>
                      )}
                      {p.expiryInfo.status === "expired" && p.quantity === 0 && (
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontStyle: "italic" }}>Written off</span>
                      )}
                      {p.expiryInfo.status !== "expired" && (
                        <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>Monitor</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ExpiryBadge({ info }) {
  const styles = {
    expired: { bg: "#fee2e2", text: "#b91c1c" },
    today:   { bg: "#ffedd5", text: "#c2410c" },
    near:    { bg: "#fef9c3", text: "#a16207" },
    soon:    { bg: "#ccfbf1", text: "#0f766e" },
    active:  { bg: "#dcfce7", text: "#15803d" },
  };
  const s = styles[info.status] || styles.active;
  return (
    <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: s.bg, color: s.text }}>
      {info.label}
    </span>
  );
}
