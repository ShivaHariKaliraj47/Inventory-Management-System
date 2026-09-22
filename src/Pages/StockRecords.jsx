import { getExpiryStatus } from "../data";

export default function StockRecords({ products, purchases, sales, categories }) {
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
        <h2 style={{ margin: 0, fontFamily: "DM Sans", fontSize: "1.4rem", fontWeight: 700 }}>Stock Records</h2>
        <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
          {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} below reorder level
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Total Products", value: products.length, color: "#4f46e5", icon: "📦" },
          { label: "In Stock",       value: records.filter(r => r.current > r.product.reorderLevel).length, color: "#22c55e", icon: "✅" },
          { label: "Low Stock",      value: lowStockCount, color: "#f59e0b", icon: "⚠️" },
          { label: "Out of Stock",   value: records.filter(r => r.current === 0).length, color: "#ef4444", icon: "❌" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: "1.5rem" }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color, fontFamily: "DM Sans" }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <strong style={{ fontFamily: "DM Sans", fontSize: "0.95rem" }}>Stock Movement Overview</strong>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ minWidth: 950 }}>
            <thead><tr>
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
            </tr></thead>
            <tbody>
              {records.map(r => {
                const status = r.current === 0 ? "Out of Stock" : r.current <= r.product.reorderLevel ? "Low Stock" : "In Stock";
                const statusStyle = r.current === 0
                  ? { bg: "#fee2e2", c: "#b91c1c" }
                  : r.current <= r.product.reorderLevel
                  ? { bg: "#fef9c3", c: "#a16207" }
                  : { bg: "#dcfce7", c: "#15803d" };
                const cat = categories?.find(c => c.id === r.product.categoryId);
                return (
                  <tr key={r.product.id}>
                    <td style={{ fontWeight: 500, fontSize: "0.84rem" }}>{r.product.name}</td>
                    <td style={{ fontSize: "0.78rem" }}>{cat ? `${cat.icon} ${cat.name}` : "—"}</td>
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
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.9rem", fontWeight: 700 }}>{r.current}</td>
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.82rem", color: "var(--muted-foreground)" }}>{r.product.reorderLevel}</td>
                    <td>
                      <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, background: statusStyle.bg, color: statusStyle.c }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{r.lastUpdated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 18px", fontSize: "0.82rem", color: "#0369a1" }}>
        <strong>Stock Formula:</strong> Current Stock = Opening Stock + Stock In (Purchases) − Stock Out (Sales)
      </div>
    </div>
  );
}

function ExpiryBadge({ info }) {
  const map = {
    expired: ["#fee2e2","#b91c1c"],
    today:   ["#ffedd5","#c2410c"],
    near:    ["#fef9c3","#a16207"],
    soon:    ["#ccfbf1","#0f766e"],
    active:  ["#dcfce7","#15803d"],
  };
  const [bg, c] = map[info.status] || ["#dcfce7","#15803d"];
  return (
    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: "0.68rem", fontWeight: 700, background: bg, color: c }}>
      {info.label}
    </span>
  );
}
