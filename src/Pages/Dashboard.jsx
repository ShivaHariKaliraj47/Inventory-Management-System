import { useState } from "react";
import { getExpiryStatus } from "../data";
import { IconBox, IconDollar, IconCart, IconBarChart, IconTruck, IconTrending, IconTag } from "../Components/Icons";
import { Clock, AlertTriangle, Mail, CheckCircle2 } from "lucide-react";
import NotifySupplierModal from "../Components/NotifySupplierModal";

function StatCard({ Icon, iconColor, iconBg, label, value, sub, onClick }) {
  return (
    <div onClick={onClick} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, cursor: onClick ? "pointer" : "default", transition: "box-shadow 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"}
    >
      <div style={{ width: 46, height: 46, borderRadius: 11, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor, flexShrink: 0 }}>
        <Icon />
      </div>
      <div>
        <div style={{ fontSize: "0.68rem", color: "var(--muted-foreground)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", fontFamily: "DM Sans", lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard({ products, categories, suppliers, purchases, sales }) {
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [notifiedMap, setNotifiedMap] = useState({});

  const totalRevenue = sales.reduce((s, x) => s + x.total, 0);
  const totalCost = purchases.reduce((s, x) => s + x.total, 0);
  const lowStock = products.filter(p => p.quantity <= p.reorderLevel);

  // Expiry stats
  const expiryItems = products.map(p => ({ p, s: getExpiryStatus(p.expiryDate) })).filter(x => x.s);
  const expiredCount   = expiryItems.filter(x => x.s.status === "expired").length;
  const todayCount     = expiryItems.filter(x => x.s.status === "today").length;
  const nearCount      = expiryItems.filter(x => x.s.status === "near").length;
  const soonCount      = expiryItems.filter(x => x.s.status === "soon").length;

  // Best sellers
  const salesByProduct = {};
  for (const s of sales) {
    if (!salesByProduct[s.productId]) salesByProduct[s.productId] = { qty: 0, total: 0 };
    salesByProduct[s.productId].qty += s.quantity;
    salesByProduct[s.productId].total += s.total;
  }
  const bestSellers = Object.entries(salesByProduct)
    .map(([pid, v]) => ({ product: products.find(p => p.id === pid), ...v }))
    .filter(x => x.product)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const recentSales = [...sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 700 }}>Dashboard Overview</h2>
        <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: "0.855rem" }}>
          Welcome back! Here's what's happening today — {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat cards row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard Icon={IconDollar}   iconColor="#0d9488" iconBg="#ccfbf1" label="Total Revenue"  value={`₹${totalRevenue.toLocaleString()}`}       sub={`${sales.length} orders`} />
        <StatCard Icon={IconCart}     iconColor="#3b82f6" iconBg="#dbeafe" label="Total Cost"     value={`₹${totalCost.toLocaleString()}`}          sub={`${purchases.length} purchases`} />
        <StatCard Icon={IconBox}      iconColor="#8b5cf6" iconBg="#ede9fe" label="Total Products" value={products.length}                           sub={`${categories.length} categories`} />
        <StatCard Icon={IconBarChart} iconColor="#f59e0b" iconBg="#fef3c7" label="Low Stock Items" value={lowStock.length}                         sub="Needs reorder" />
      </div>

      {/* Stat cards row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <StatCard Icon={IconTruck}    iconColor="#7c3aed" iconBg="#ede9fe" label="Suppliers"    value={suppliers.length}                            sub="Active" />
        <StatCard Icon={IconTrending} iconColor="#16a34a" iconBg="#dcfce7" label="Gross Profit" value={`₹${(totalRevenue - totalCost).toLocaleString()}`} sub="Revenue − Cost" />
        <StatCard Icon={IconTag}      iconColor="#0d9488" iconBg="#ccfbf1" label="Categories"   value={categories.length}                           sub="Product groups" />
      </div>

      {/* Expiry Alerts banner */}
      {(expiredCount + todayCount + nearCount + soonCount) > 0 && (
        <div style={{ background: "#fff", border: "1.5px solid #fca5a5", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Clock size={18} color="#b91c1c" />
            <strong style={{ fontFamily: "DM Sans", fontSize: "0.95rem", color: "#0f172a" }}>Expiry Alerts</strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { count: expiredCount,  label: "Expired",            bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" },
              { count: todayCount,    label: "Expiring Today",      bg: "#ffedd5", text: "#c2410c", border: "#fdba74" },
              { count: nearCount,     label: "Within 7 Days",       bg: "#fef9c3", text: "#a16207", border: "#fde047" },
              { count: soonCount,     label: "Within 30 Days",      bg: "#dcfce7", text: "#15803d", border: "#86efac" },
            ].map(x => (
              <div key={x.label} style={{ background: x.bg, border: `1px solid ${x.border}`, borderRadius: 9, padding: "10px 14px" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 700, color: x.text, fontFamily: "DM Sans" }}>{x.count}</div>
                <div style={{ fontSize: "0.72rem", color: x.text, fontWeight: 600, marginTop: 2 }}>{x.label}</div>
              </div>
            ))}
          </div>
          {(expiredCount + todayCount) > 0 && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#fee2e2", borderRadius: 8, fontSize: "0.79rem", color: "#b91c1c", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={15} color="#b91c1c" style={{ flexShrink: 0 }} />
              <span><strong>{expiredCount + todayCount}</strong> product batch{expiredCount + todayCount !== 1 ? "es" : ""} expired or expiring today — <strong>blocked from sales</strong>. Go to Expiry Management to take action.</span>
            </div>
          )}
        </div>
      )}

      {/* Best Sellers + Recent Sales */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Best Sellers */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg, #1a2332 0%, #243044 100%)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(13,148,136,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#14b8a6" }}>
              <IconTrending />
            </div>
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.9rem", fontFamily: "DM Sans" }}>Best Selling Goods</div>
              <div style={{ color: "#475569", fontSize: "0.68rem" }}>Top products by quantity sold</div>
            </div>
          </div>
          <div>
            {bestSellers.map((b, i) => (
              <div key={b.product.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: i < bestSellers.length - 1 ? "1px solid var(--border)" : "none" }}>
                <span style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: i === 0 ? "#fef08a" : i === 1 ? "#e2e8f0" : i === 2 ? "#fed7aa" : "#f1f5f9",
                  color: i === 0 ? "#854d0e" : i === 1 ? "#475569" : i === 2 ? "#9a3412" : "#64748b",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: i < 3 ? "1px solid rgba(0,0,0,0.08)" : "none",
                  flexShrink: 0
                }}>
                  #{i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.84rem" }}>{b.product.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", marginTop: 1 }}>{b.qty} units sold</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.84rem", color: "#16a34a" }}>₹{b.total.toLocaleString()}</div>
                  {i === 0 && <span className="badge badge-teal" style={{ fontSize: "0.62rem", marginTop: 2 }}>Best Seller</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: "DM Sans" }}>Recent Sales</div>
            <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Last {recentSales.length} transactions</span>
          </div>
          <table style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 16px", fontSize: "0.7rem" }}>Invoice</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.7rem" }}>Product</th>
                <th style={{ textAlign: "right", padding: "8px 16px", fontSize: "0.7rem" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map(s => {
                const p = products.find(pr => pr.id === s.productId);
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 16px", fontFamily: "JetBrains Mono", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{s.id}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 500, fontSize: "0.82rem" }}>{p?.name ?? s.productId}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 700, color: "#16a34a", fontSize: "0.82rem" }}>₹{s.total.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert with Manual Supplier Notification */}
      {lowStock.length > 0 && (
        <div style={{ background: "#fff", border: "1.5px solid #fde047", borderRadius: 12, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={18} color="#a16207" />
              <strong style={{ fontFamily: "DM Sans", fontSize: "0.95rem", color: "#a16207" }}>
                Low Stock Alert — {lowStock.length} item{lowStock.length !== 1 ? "s" : ""} need replenishment
              </strong>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
              Manual alert: click to review and send reorder request
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 10 }}>
            {lowStock.map(p => {
              const sup = (suppliers || []).find(s => s.id === p.supplierId);
              const isNotified = !!notifiedMap[p.id];
              return (
                <div key={p.id} style={{
                  background: "#fffbeb",
                  border: "1px solid #fef08a",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.86rem", color: "#1c1917", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#a16207", marginTop: 2 }}>
                      <strong>{p.quantity}</strong> left (min: {p.reorderLevel}) · {sup?.name || "No supplier"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotifyTarget({ product: p, supplier: sup })}
                    style={{
                      padding: "6px 12px",
                      background: isNotified ? "#dcfce7" : "#0d9488",
                      color: isNotified ? "#15803d" : "#ffffff",
                      border: isNotified ? "1px solid #86efac" : "none",
                      borderRadius: 7,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                      boxShadow: isNotified ? "none" : "0 2px 4px rgba(13,148,136,0.25)",
                    }}
                  >
                    {isNotified ? (
                      <>
                        <CheckCircle2 size={13} /> Notified
                      </>
                    ) : (
                      <>
                        <Mail size={13} /> Notify
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
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
