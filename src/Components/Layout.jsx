import { useState, useRef, useEffect } from "react";
import { getExpiryStatus } from "../data";
import {
  IconHome, IconBox, IconTag, IconTruck, IconCart,
  IconDollar, IconBarChart, IconClipboard,
  IconBell, IconSearch, IconLogout, IconChevron,
} from "./Icon";

const NAV_ITEMS = [
  { key: "dashboard",  label: "Dashboard",        Icon: IconHome },
  { key: "products",   label: "Products",         Icon: IconBox },
  { key: "categories", label: "Categories",       Icon: IconTag },
  { key: "suppliers",  label: "Suppliers",        Icon: IconTruck },
  { key: "purchases",  label: "Purchases",        Icon: IconCart },
  { key: "sales",      label: "Sales",            Icon: IconDollar },
  { key: "stock",      label: "Stock Records",    Icon: IconBarChart },
  { key: "reports",    label: "Reports",          Icon: IconClipboard },
  { key: "expiry",     label: "Expiry Mgmt",      Icon: ExpiryIcon },
];

function ExpiryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

export default function Layout({ currentPage, setCurrentPage, currentUser, onLogout, children, shared }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  const { products, categories, suppliers, sales } = shared || {};

  // Build expiry notifications from products
  const expiryAlerts = (products || [])
    .map(p => ({ p, s: getExpiryStatus(p.expiryDate) }))
    .filter(x => x.s && ["expired", "today", "near"].includes(x.s.status));

  const notifications = [
    ...expiryAlerts.slice(0, 3).map((x, i) => ({
      id: "exp-" + i,
      text: x.s.status === "expired"
        ? `${x.p.name} has EXPIRED (Batch ${x.p.batchNo})`
        : x.s.status === "today"
        ? `${x.p.name} expires TODAY — remove from sale`
        : `${x.p.name} expires in ${x.s.days} days`,
      type: x.s.status === "expired" ? "danger" : x.s.status === "today" ? "warning" : "info",
      time: "Auto-detected",
    })),
    { id: "n1", text: "New purchase PUR010 recorded", type: "success", time: "2 hrs ago" },
    { id: "n2", text: "Low stock: Yogurt 400g (8 units)", type: "warning", time: "3 hrs ago" },
  ];

  // Global search
  const q = searchQ.toLowerCase().trim();
  const searchResults = q.length > 1 ? [
    ...(products || []).filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      .slice(0, 4).map(p => ({ type: "product", label: p.name, sub: `Product · ₹${p.sellingPrice} · Qty: ${p.quantity}`, page: "products" })),
    ...(categories || []).filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 3).map(c => ({ type: "category", label: c.name, sub: `Category`, page: "categories" })),
    ...(suppliers || []).filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      .slice(0, 3).map(s => ({ type: "supplier", label: s.name, sub: `Supplier · ${s.email}`, page: "suppliers" })),
    ...(sales || []).filter(s => s.id.toLowerCase().includes(q) || (s.customer && s.customer.toLowerCase().includes(q)))
      .slice(0, 3).map(s => {
        const prod = (products || []).find(p => p.id === s.productId);
        return { type: "sale", label: s.id + (s.customer ? ` — ${s.customer}` : ""), sub: `Sale · ${prod?.name} · ₹${s.total}`, page: "sales" };
      }),
  ] : [];

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (currentUser.fullName || currentUser.email).split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const displayName = currentUser.fullName || currentUser.email.split("@")[0];

  const typeColors = { product: "#0d9488", category: "#3b82f6", supplier: "#8b5cf6", sale: "#22c55e" };
  const typeIcons  = { product: "📦", category: "🏷️", supplier: "🚚", sale: "💰" };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? 230 : 58,
        background: "var(--sidebar)",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden", flexShrink: 0, zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding: sidebarOpen ? "18px 16px" : "18px 11px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)", minHeight: 64 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ color: "#f1f5f9", fontFamily: "DM Sans", fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2 }}>InvenPro</div>
              <div style={{ color: "#475569", fontSize: "0.62rem", fontWeight: 500 }}>Inventory System</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 7px", overflowY: "auto" }}>
          {NAV_ITEMS.map(({ key, label, Icon }) => {
            const active = currentPage === key;
            const isExpiry = key === "expiry";
            return (
              <button key={key} onClick={() => setCurrentPage(key)} title={!sidebarOpen ? label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  width: "100%", padding: sidebarOpen ? "9px 10px" : "9px 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  borderRadius: 7, border: "none", cursor: "pointer", marginBottom: 1,
                  background: active ? "var(--sidebar-active-bg)" : "transparent",
                  color: active ? "#fff" : isExpiry && !active ? "#fb923c" : "var(--sidebar-foreground)",
                  fontFamily: "Inter", fontSize: "0.84rem", fontWeight: active ? 600 : 400,
                  textAlign: "left", transition: "all 0.15s", whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--sidebar-hover)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ flexShrink: 0, opacity: active ? 1 : 0.8 }}><Icon /></span>
                {sidebarOpen && (
                  <span style={{ flex: 1 }}>{label}</span>
                )}
                {sidebarOpen && isExpiry && expiryAlerts.length > 0 && (
                  <span style={{ background: "#ef4444", color: "#fff", fontSize: "0.62rem", fontWeight: 700, padding: "1px 6px", borderRadius: 99, minWidth: 18, textAlign: "center" }}>
                    {expiryAlerts.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User at bottom */}
        {sidebarOpen && (
          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>{initials}</div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ color: "#e2e8f0", fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
                <div style={{ color: "#475569", fontSize: "0.63rem" }}>Administrator</div>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => setSidebarOpen(o => !o)}
          style={{ margin: "0 7px 9px", padding: "7px", borderRadius: 7, border: "none", background: "rgba(255,255,255,0.05)", color: "#475569", cursor: "pointer", fontSize: "0.72rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {sidebarOpen ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
          </svg>
          {sidebarOpen && "Collapse"}
        </button>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Header */}
        <header style={{ height: 56, background: "#fff", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, zIndex: 10 }}>
          {/* Global Search */}
          <div ref={searchRef} style={{ flex: 1, maxWidth: 420, position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }}>
              <IconSearch />
            </span>
            <input
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              placeholder="Search products, sales, suppliers, categories…"
              style={{ width: "100%", padding: "7px 12px 7px 34px", border: "1.5px solid var(--border)", borderRadius: 8, background: "var(--muted)", outline: "none", fontSize: "0.8rem", boxSizing: "border-box", transition: "border 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
              onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = "var(--border)"; }}
            />
            {showSearch && searchResults.length > 0 && (
              <div style={{ position: "absolute", top: 38, left: 0, right: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 300, overflow: "hidden", maxHeight: 340, overflowY: "auto" }}>
                {searchResults.map((r, i) => (
                  <button key={i} onClick={() => { setCurrentPage(r.page); setShowSearch(false); setSearchQ(""); }}
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", padding: "9px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", borderBottom: i < searchResults.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: "1rem", marginTop: 1 }}>{typeIcons[r.type]}</span>
                    <div>
                      <div style={{ fontSize: "0.84rem", fontWeight: 500 }}>{r.label}</div>
                      <div style={{ fontSize: "0.7rem", color: typeColors[r.type], marginTop: 1 }}>{r.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showSearch && q.length > 1 && searchResults.length === 0 && (
              <div style={{ position: "absolute", top: 38, left: 0, right: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 300, padding: "14px", textAlign: "center", color: "var(--muted-foreground)", fontSize: "0.8rem" }}>
                No results found for "{searchQ}"
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Bell */}
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowNotifs(n => !n); setShowUserMenu(false); }}
              style={{ ...iconBtnStyle, position: "relative" }}>
              <IconBell />
              {notifications.length > 0 && (
                <span style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: "#ef4444", border: "1.5px solid #fff" }} />
              )}
            </button>
            {showNotifs && (
              <DropMenu width={320} onClose={() => setShowNotifs(false)}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", fontFamily: "DM Sans" }}>Notifications</span>
                  <span className="badge badge-red">{notifications.length}</span>
                </div>
                {notifications.map(n => (
                  <div key={n.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10 }}>
                    <span style={{ fontSize: "0.9rem", marginTop: 1 }}>
                      {n.type === "danger" ? "🔴" : n.type === "warning" ? "🟡" : n.type === "success" ? "🟢" : "🔵"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.79rem", lineHeight: 1.45 }}>{n.text}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--muted-foreground)", marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </DropMenu>
            )}
          </div>

          {/* Admin */}
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowUserMenu(m => !m); setShowNotifs(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px 5px 5px", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--muted)", cursor: "pointer", transition: "border 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.72rem", fontWeight: 700 }}>{initials}</div>
              <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap" }}>{displayName}</div>
                <div style={{ fontSize: "0.63rem", color: "var(--muted-foreground)" }}>Admin</div>
              </div>
              <span style={{ color: "var(--muted-foreground)" }}><IconChevron /></span>
            </button>
            {showUserMenu && (
              <DropMenu width={190} onClose={() => setShowUserMenu(false)}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>{displayName}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--muted-foreground)", marginTop: 2 }}>{currentUser.email}</div>
                </div>
                <button onClick={onLogout}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", border: "none", background: "transparent", color: "var(--danger)", fontSize: "0.84rem", fontWeight: 500, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <IconLogout /> Logout
                </button>
              </DropMenu>
            )}
          </div>
        </header>

        <main style={{ flex: 1, overflow: "auto", padding: "22px 26px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

const iconBtnStyle = { width: 34, height: 34, borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", transition: "border 0.15s" };

function DropMenu({ children, width, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
      <div style={{ position: "absolute", right: 0, top: 42, width, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 100, overflow: "hidden" }}>
        {children}
      </div>
    </>
  );
}
