import { useState, useMemo } from "react";
import { getExpiryStatus } from "../data";
import { AlertTriangle, Clock, Mail, CheckCircle2, ArrowRight } from "lucide-react";
import NotifySupplierModal from "../Components/NotifySupplierModal";

function Sparkline({ data = [], width = 120, height = 28, color = "#0f766e" }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const usableHeight = height - padding * 2;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - padding - ((val - min) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pointsStr = points.join(" ");
  const lastPoint = points[points.length - 1].split(",");

  return (
    <svg width={width} height={height} style={{ overflow: "visible", display: "inline-block", verticalAlign: "middle" }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pointsStr}
      />
      <circle
        cx={lastPoint[0]}
        cy={lastPoint[1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

export default function Dashboard({ products = [], categories = [], suppliers = [], purchases = [], sales = [] }) {
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [notifiedMap, setNotifiedMap] = useState({});

  // Operational metrics
  const totalRevenue = useMemo(() => sales.reduce((s, x) => s + (Number(x.total) || 0), 0), [sales]);
  const totalCost = useMemo(() => purchases.reduce((s, x) => s + (Number(x.total) || 0), 0), [purchases]);
  const grossProfit = totalRevenue - totalCost;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0.0";
  const avgOrderValue = sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0;

  // Inventory valuation
  const inventoryAssetValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (Number(p.quantity) || 0) * (Number(p.purchasePrice) || 0), 0);
  }, [products]);

  const totalUnitsInStock = useMemo(() => {
    return products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
  }, [products]);

  const lowStock = useMemo(() => {
    return products.filter(p => Number(p.quantity) <= Number(p.reorderLevel));
  }, [products]);

  // Expiry stats
  const expiryItems = useMemo(() => {
    return products.map(p => ({ p, s: getExpiryStatus(p.expiryDate) })).filter(x => x.s);
  }, [products]);

  const expiredCount = expiryItems.filter(x => x.s.status === "expired").length;
  const todayCount   = expiryItems.filter(x => x.s.status === "today").length;
  const nearCount    = expiryItems.filter(x => x.s.status === "near").length;
  const soonCount    = expiryItems.filter(x => x.s.status === "soon").length;

  // Daily revenue series for sparkline
  const sparklineData = useMemo(() => {
    if (!sales.length) return [0, 0];
    const grouped = {};
    sales.forEach(s => {
      const d = s.date || "2026-08-01";
      grouped[d] = (grouped[d] || 0) + Number(s.total || 0);
    });
    const sortedDates = Object.keys(grouped).sort();
    const values = sortedDates.map(d => grouped[d]);
    return values.length > 1 ? values : [values[0] * 0.9, values[0]];
  }, [sales]);

  // Best sellers
  const bestSellers = useMemo(() => {
    const map = {};
    for (const s of sales) {
      if (!map[s.productId]) map[s.productId] = { qty: 0, total: 0 };
      map[s.productId].qty += Number(s.quantity) || 0;
      map[s.productId].total += Number(s.total) || 0;
    }
    return Object.entries(map)
      .map(([pid, v]) => ({ product: products.find(p => p.id === pid), ...v }))
      .filter(x => x.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales, products]);

  // Recent transactions
  const recentSales = useMemo(() => {
    return [...sales].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 6);
  }, [sales]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tell 5 Fix: Executive Header with named accounting period & zero placeholder greeting */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            IMS · Operational Ledger
          </div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em", marginTop: 2 }}>
            Financial & Inventory Overview
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontSize: "0.72rem",
            color: "var(--muted-foreground)",
            fontVariantNumeric: "tabular-nums",
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f766e", display: "inline-block" }} />
            Period: Trailing 30 Days (Oct 2026)
          </span>
        </div>
      </div>

      {/* Tell 3 & Tell 2 Fix: Asymmetric hierarchy — One large hero card + 3 compact secondary metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 14 }}>
        {/* Primary Hero Metric: Big, dominant, eye lands here */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 16
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Gross Revenue · Trailing 30D
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.68rem", color: "var(--muted-foreground)" }}>Velocity</span>
                <Sparkline data={sparklineData} width={100} height={22} color="#0f766e" />
              </div>
            </div>

            {/* Tell 5 Fix: Tabular digits, prominent primary figure */}
            <div style={{
              fontSize: "2.35rem",
              fontWeight: 700,
              color: "var(--foreground)",
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.1,
              marginTop: 6
            }}>
              Rs. {totalRevenue.toLocaleString()}
            </div>
          </div>

          {/* Sub-breakdown: Profitability breakdown in crisp tabular alignment */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            paddingTop: 14,
            borderTop: "1px solid var(--border)"
          }}>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--muted-foreground)", fontWeight: 500 }}>Net Gross Profit</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: grossProfit >= 0 ? "var(--foreground)" : "#b91c1c", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                Rs. {grossProfit.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--muted-foreground)", fontWeight: 500 }}>Operating Margin</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f766e", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                {grossMargin}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--muted-foreground)", fontWeight: 500 }}>Average Order Value</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--foreground)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                Rs. {avgOrderValue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics: 3 compact structured rows (No pastel tiles, numbers are the heroes) */}
        <div style={{ display: "grid", gridTemplateRows: "repeat(3, 1fr)", gap: 10 }}>
          {/* Secondary 1: Asset Valuation */}
          <div style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Inventory Valuation (Cost Basis)
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 3 }}>
              <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
                Rs. {inventoryAssetValue.toLocaleString()}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                {totalUnitsInStock.toLocaleString()} units · {products.length} SKUs
              </span>
            </div>
          </div>

          {/* Secondary 2: Operational Risk */}
          <div style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Reorder & Expiry Exposure
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 3 }}>
              <span style={{ fontSize: "1.3rem", fontWeight: 700, color: lowStock.length > 0 || expiredCount > 0 ? "#b45309" : "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
                {lowStock.length + expiredCount} SKUs
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                {lowStock.length} low stock · {expiredCount} expired
              </span>
            </div>
          </div>

          {/* Secondary 3: Procurement Purchases */}
          <div style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Procurement Incurred
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 3 }}>
              <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
                Rs. {totalCost.toLocaleString()}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                {purchases.length} invoices · {suppliers.length} suppliers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tell 4 Fix: Expiry Alert Panel — Clean hairline border, zero drop shadow, no pastel tiles */}
      {(expiredCount + todayCount + nearCount + soonCount) > 0 && (
        <div style={{
          background: "var(--card)",
          border: (expiredCount + todayCount) > 0 ? "1px solid #fecaca" : "1px solid var(--border)",
          borderRadius: 6,
          padding: "12px 16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={15} color={expiredCount > 0 ? "#b91c1c" : "#b45309"} />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
                Batch Expiry Monitoring
              </span>
              {(expiredCount + todayCount) > 0 && (
                <span style={{
                  fontSize: "0.68rem",
                  padding: "1px 6px",
                  borderRadius: 3,
                  background: "#fef2f2",
                  color: "#b91c1c",
                  border: "1px solid #fecaca",
                  fontWeight: 600
                }}>
                  {expiredCount + todayCount} Action Required
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: "0.74rem", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: expiredCount > 0 ? "#b91c1c" : "var(--muted-foreground)", fontWeight: expiredCount > 0 ? 600 : 400 }}>
                Expired: <strong>{expiredCount}</strong>
              </span>
              <span style={{ color: "var(--border)" }}>|</span>
              <span style={{ color: todayCount > 0 ? "#c2410c" : "var(--muted-foreground)", fontWeight: todayCount > 0 ? 600 : 400 }}>
                Today: <strong>{todayCount}</strong>
              </span>
              <span style={{ color: "var(--border)" }}>|</span>
              <span style={{ color: nearCount > 0 ? "#b45309" : "var(--muted-foreground)", fontWeight: nearCount > 0 ? 600 : 400 }}>
                ≤7 Days: <strong>{nearCount}</strong>
              </span>
              <span style={{ color: "var(--border)" }}>|</span>
              <span style={{ color: "var(--muted-foreground)" }}>
                ≤30 Days: <strong>{soonCount}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tell 1 & Tell 4 Fix: Performance & Transactions Grid — Flat headers, hairline borders, zero gradients */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Best Selling Products */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          overflow: "hidden"
        }}>
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--foreground)" }}>Top Performing SKUs</div>
              <div style={{ fontSize: "0.68rem", color: "var(--muted-foreground)" }}>Ranked by units sold in recorded sales</div>
            </div>
            <span style={{ fontSize: "0.68rem", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
              Top {bestSellers.length} items
            </span>
          </div>

          <div>
            {bestSellers.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--muted-foreground)", fontSize: "0.8rem" }}>
                No sales recorded in current period.
              </div>
            ) : (
              bestSellers.map((b, i) => (
                <div
                  key={b.product.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 16px",
                    borderBottom: i < bestSellers.length - 1 ? "1px solid var(--border)" : "none"
                  }}
                >
                  <span style={{
                    width: 20,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: i === 0 ? "#0f766e" : "var(--muted-foreground)",
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.83rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {b.product.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                      {b.qty} units dispatched
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.83rem", color: "var(--foreground)" }}>
                      Rs. {b.total.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          overflow: "hidden"
        }}>
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--foreground)" }}>Recent Transactions</div>
              <div style={{ fontSize: "0.68rem", color: "var(--muted-foreground)" }}>Latest ledger entries</div>
            </div>
            <span style={{ fontSize: "0.68rem", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
              Last {recentSales.length} records
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "transparent" }}>
                <th style={{ textAlign: "left", padding: "8px 16px", fontSize: "0.68rem", fontWeight: 600, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>Invoice</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.68rem", fontWeight: 600, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>Product</th>
                <th style={{ textAlign: "right", padding: "8px 16px", fontSize: "0.68rem", fontWeight: 600, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map(s => {
                const p = products.find(pr => pr.id === s.productId);
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "9px 16px", fontFamily: "JetBrains Mono, monospace", fontSize: "0.74rem", color: "var(--muted-foreground)" }}>
                      {s.id}
                    </td>
                    <td style={{ padding: "9px 12px", fontSize: "0.8rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                      {p?.name ?? s.productId}
                    </td>
                    <td style={{ padding: "9px 16px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontWeight: 600, color: "var(--foreground)", fontSize: "0.8rem", fontVariantNumeric: "tabular-nums" }}>
                      Rs. {s.total.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tell 4 Fix: Stock Replenishment List — Flat hairline list, crisp actions */}
      {lowStock.length > 0 && (
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "14px 18px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <AlertTriangle size={15} color="#b45309" />
              <strong style={{ fontSize: "0.84rem", color: "var(--foreground)", letterSpacing: "-0.01em" }}>
                Replenishment Threshold Triggered
              </strong>
              <span style={{
                fontSize: "0.68rem",
                color: "#b45309",
                background: "#fef3c7",
                padding: "1px 6px",
                borderRadius: 3,
                fontWeight: 600,
                border: "1px solid #fde68a"
              }}>
                {lowStock.length} items
              </span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
              Inventory level ≤ Reorder safety limit
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
            {lowStock.map(p => {
              const sup = (suppliers || []).find(s => s.id === p.supplierId);
              const isNotified = !!notifiedMap[p.id];
              return (
                <div key={p.id} style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "9px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums", marginTop: 1 }}>
                      <strong style={{ color: "#b45309" }}>{p.quantity}</strong> on hand (min: {p.reorderLevel}) · {sup?.name || "Unassigned"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotifyTarget({ product: p, supplier: sup })}
                    style={{
                      padding: "5px 10px",
                      background: isNotified ? "transparent" : "#0f766e",
                      color: isNotified ? "#0f766e" : "#ffffff",
                      border: isNotified ? "1px solid #0f766e" : "1px solid transparent",
                      borderRadius: 4,
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                      flexShrink: 0
                    }}
                  >
                    {isNotified ? (
                      <>
                        <CheckCircle2 size={12} /> Notified
                      </>
                    ) : (
                      <>
                        <Mail size={12} /> Order
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Dialog: True overlay layer, appropriately uses drop shadow */}
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
