export default function Reports({ products, categories, suppliers, purchases, sales }) {
  const totalRevenue = sales.reduce((s, x) => s + x.total, 0);
  const totalCost = purchases.reduce((s, x) => s + x.total, 0);
  const grossProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0";

  const salesByProduct = {};
  for (const s of sales) {
    if (!salesByProduct[s.productId]) salesByProduct[s.productId] = { qty: 0, total: 0 };
    salesByProduct[s.productId].qty += s.quantity;
    salesByProduct[s.productId].total += s.total;
  }

  const productReport = products.map(p => ({
    product: p,
    salesQty: salesByProduct[p.id]?.qty ?? 0,
    salesRevenue: salesByProduct[p.id]?.total ?? 0,
    purchaseCost: purchases.filter(pu => pu.productId === p.id).reduce((s, pu) => s + pu.total, 0),
    category: categories.find(c => c.id === p.categoryId)?.name ?? "",
  })).sort((a, b) => b.salesRevenue - a.salesRevenue);

  const catReport = categories.map(c => {
    const catProds = products.filter(p => p.categoryId === c.id);
    const revenue = catProds.reduce((s, p) => s + (salesByProduct[p.id]?.total ?? 0), 0);
    const qty = catProds.reduce((s, p) => s + (salesByProduct[p.id]?.qty ?? 0), 0);
    return { category: c, revenue, qty };
  }).sort((a, b) => b.revenue - a.revenue);

  const supReport = suppliers.map(s => {
    const purs = purchases.filter(p => p.supplierId === s.id);
    return { supplier: s, orders: purs.length, total: purs.reduce((acc, p) => acc + p.total, 0) };
  }).sort((a, b) => b.total - a.total);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontFamily: "DM Sans", fontSize: "1.4rem", fontWeight: 700 }}>Reports</h2>
        <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Financial and inventory summary</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, color: "#22c55e", icon: "💰" },
          { label: "Total Cost", value: `₹${totalCost.toLocaleString()}`, color: "#ef4444", icon: "🛒" },
          { label: "Gross Profit", value: `₹${grossProfit.toLocaleString()}`, color: grossProfit >= 0 ? "#4f46e5" : "#ef4444", icon: "📈" },
          { label: "Profit Margin", value: `${margin}%`, color: "#f59e0b", icon: "📊" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 18px" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color, fontFamily: "DM Sans" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <strong style={{ fontFamily: "DM Sans" }}>Product Sales Report</strong>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>#</th><th>Product</th><th>Category</th><th>Qty Sold</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Margin</th></tr></thead>
            <tbody>
              {productReport.map((r, i) => {
                const profit = r.salesRevenue - r.purchaseCost;
                const marg = r.salesRevenue > 0 ? ((profit / r.salesRevenue) * 100).toFixed(1) : "0";
                return (
                  <tr key={r.product.id}>
                    <td style={{ color: "var(--muted-foreground)", fontSize: "0.8rem" }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{r.product.name}</td>
                    <td><span className="badge badge-blue">{r.category}</span></td>
                    <td className="mono">{r.salesQty}</td>
                    <td className="mono" style={{ color: "#22c55e", fontWeight: 600 }}>₹{r.salesRevenue.toLocaleString()}</td>
                    <td className="mono" style={{ color: "#ef4444" }}>₹{r.purchaseCost.toLocaleString()}</td>
                    <td className="mono" style={{ fontWeight: 700, color: profit >= 0 ? "#4f46e5" : "#ef4444" }}>₹{profit.toLocaleString()}</td>
                    <td><span className={`badge ${parseFloat(marg) >= 30 ? "badge-green" : parseFloat(marg) >= 10 ? "badge-yellow" : "badge-red"}`}>{marg}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <strong style={{ fontFamily: "DM Sans" }}>Sales by Category</strong>
          </div>
          <table>
            <thead><tr><th>Category</th><th>Units Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {catReport.map(r => (
                <tr key={r.category.id}>
                  <td style={{ fontWeight: 500 }}>{r.category.name}</td>
                  <td className="mono">{r.qty}</td>
                  <td className="mono" style={{ fontWeight: 700, color: "#22c55e" }}>₹{r.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <strong style={{ fontFamily: "DM Sans" }}>Supplier Purchase Report</strong>
          </div>
          <table>
            <thead><tr><th>Supplier</th><th>Orders</th><th>Total Spent</th></tr></thead>
            <tbody>
              {supReport.map(r => (
                <tr key={r.supplier.id}>
                  <td style={{ fontWeight: 500 }}>{r.supplier.name}</td>
                  <td className="mono">{r.orders}</td>
                  <td className="mono" style={{ fontWeight: 700, color: "#4f46e5" }}>₹{r.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
