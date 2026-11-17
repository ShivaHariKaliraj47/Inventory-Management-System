import { useState } from "react";
import { getExpiryStatus } from "../data";
import { Package, CheckCircle2, AlertTriangle, XCircle, Tag, Mail } from "lucide-react";
import NotifySupplierModal from "../Components/NotifySupplierModal";

export default function StockRecords({ products, purchases, sales, categories, suppliers }) {
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [notifiedMap, setNotifiedMap] = useState({});

  const records = products.map(p => {
    const totalIn = purchases.filter(pu => pu.productId === p.id).reduce((s, pu) => s + pu.quantity, 0);
    const totalOut = sales.filter(sa => sa.productId === p.id).reduce((s, sa) => s + sa.quantity, 0);
    const lastPurchase = [...purchases].filter(pu => pu.productId === p.id).sort((a, b) => b.date.localeCompare(a.date))[0];
    const lastSale = [...sales].filter(sa => sa.productId === p.id).sort((a, b) => b.date.localeCompare(a.date))[0];
    const lastUpdated = [lastPurchase?.date, lastSale?.date].filter(Boolean).sort().reverse()[0] ?? p.dateAdded;
    const opening = Math.max(0, p.quantity - totalIn + totalOut);
    const expiry = getExpiryStatus(p.expiryDate);
    return { product: p, stockIn: totalIn, stockOut: totalOut, current: p.quantity, lastUpdated, opening, expiry };
  });

  const lowStockCount = records.filter(r => r.current <= r.product.reorderLevel).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Stock Records</h2>
        <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
          {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} below reorder level
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Total Products", value: products.length, color: "#4f46e5", bg: "#eef2ff", Icon: Package },
          { label: "In Stock",       value: records.filter(r => r.current > r.product.reorderLevel).length, color: "#16a34a", bg: "#f0fdf4", Icon: CheckCircle2 },
          { label: "Low Stock",      value: lowStockCount, color: "#d97706", bg: "#fffbeb", Icon: AlertTriangle },
          { label: "Out of Stock",   value: records.filter(r => r.current === 0).length, color: "#dc2626", bg: "#fef2f2", Icon: XCircle },
        ].map(s => {
          const IconComponent = s.Icon;
          return (
            <div key={s.label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                <IconComponent size={20} />
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <strong style={{ fontSize: "0.95rem" }}>Stock Movement Overview</strong>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ minWidth: 980 }}>
            <thead><tr>
              <th style={{ width: 48, textAlign: "center" }}>S.N</th>
              <th>Product</th>
              <th>Category</th>
              <th>Batch No.</th>
              <th>Expiry</th>
              <th>Opening</th>
              <th style={{ color: "#22c55e" }}>In ▲</th>
              <th style={{ color: "#ef4444" }}>Out ▼</th>
              <th>Current</th>
              <th>Reorder</th>
              <th>Status</th>
              <th>Updated</th>
              <th style={{ textAlign: "center", width: 90 }}>Action</th>
            </tr></thead>
            <tbody>
              {records.map((r, index) => {
                const status = r.current === 0 ? "Out of Stock" : r.current <= r.product.reorderLevel ? "Low Stock" : "In Stock";
                const statusStyle = r.current === 0
                  ? { bg: "#fee2e2", c: "#b91c1c" }
                  : r.current <= r.product.reorderLevel
                  ? { bg: "#fef9c3", c: "#a16207" }
                  : { bg: "#dcfce7", c: "#15803d" };
                const cat = categories?.find(c => c.id === r.product.categoryId);
                const sup = (suppliers || []).find(s => s.id === r.product.supplierId);
                const isLowStock = r.current <= r.product.reorderLevel;
                const isNotified = !!notifiedMap[r.product.id];
                return (
                  <tr key={r.product.id}>
                    <td style={{ textAlign: "center", color: "var(--muted-foreground)", fontWeight: 600, fontSize: "0.8rem", fontFamily: "JetBrains Mono" }}>
                      {index + 1}
                    </td>
                    <td style={{ fontWeight: 500, fontSize: "0.84rem" }}>{r.product.name}</td>
                    <td>
                      {cat ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem", fontWeight: 500, color: "#334155", background: "#f1f5f9", padding: "2px 8px", borderRadius: 6 }}>
                          <Tag size={12} style={{ color: "var(--primary)" }} /> {cat.name}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.77rem", color: "#374151" }}>{r.product.batchNo || "—"}</td>
                    <td>
                      {r.expiry ? (
                        <ExpiryBadge info={r.expiry} />
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>—</span>
                      )}
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem" }}>{r.opening}</td>
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem", color: "#22c55e", fontWeight: 600 }}>+{r.stockIn}</td>
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem", color: "#ef4444", fontWeight: 600 }}>-{r.stockOut}</td>
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem", fontWeight: 700 }}>{r.current}</td>
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem", color: "var(--muted-foreground)" }}>{r.product.reorderLevel}</td>
                    <td>
                      <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: "0.68rem", fontWeight: 700, background: statusStyle.bg, color: statusStyle.c, display: "inline-block" }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontFamily: "JetBrains Mono" }}>{r.lastUpdated}</td>
                    <td style={{ textAlign: "center" }}>
                      {isLowStock ? (
                        <button
                          type="button"
                          onClick={() => setNotifyTarget({ product: r.product, supplier: sup })}
                          style={{
                            padding: "4px 10px",
                            background: isNotified ? "#dcfce7" : "#0d9488",
                            color: isNotified ? "#15803d" : "#ffffff",
                            border: isNotified ? "1px solid #86efac" : "none",
                            borderRadius: 6,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            boxShadow: isNotified ? "none" : "0 1px 3px rgba(13,148,136,0.25)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {isNotified ? (
                            <>
                              <CheckCircle2 size={12} /> Notified
                            </>
                          ) : (
                            <>
                              <Mail size={12} /> Notify
                            </>
                          )}
                        </button>
                      ) : (
                        <span style={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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

function ExpiryBadge({ info }) {
  const map = { expired: ["#fee2e2","#b91c1c"], today: ["#ffedd5","#c2410c"], near: ["#fef9c3","#a16207"], soon: ["#ccfbf1","#0f766e"] };
  const [bg, c] = map[info.status] || ["#dcfce7","#15803d"];
  return <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: "0.66rem", fontWeight: 700, background: bg, color: c, display: "inline-block" }}>{info.label}</span>;
}
