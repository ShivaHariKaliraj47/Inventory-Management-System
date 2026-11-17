import { useState, useRef, useEffect } from "react";
import {
  Home,
  Package,
  Tag,
  Truck,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  ClipboardList,
  Clock,
  Settings as SettingsIcon,
  Calculator as CalculatorIcon,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  DollarSign,
} from "lucide-react";
import Calculator from "./Calculator";
import { getExpiryStatus } from "../data";

const NAV_ITEMS = [
  { key: "dashboard",  label: "Dashboard",        Icon: Home },
  { key: "products",   label: "Products",         Icon: Package },
  { key: "categories", label: "Categories",       Icon: Tag },
  { key: "suppliers",  label: "Suppliers",        Icon: Truck },
  { key: "purchases",  label: "Purchases",        Icon: ShoppingCart },
  { key: "sales",      label: "Sales",            Icon: TrendingUp },
  { key: "stock",      label: "Stock Records",    Icon: BarChart3 },
  { key: "reports",    label: "Reports",          Icon: ClipboardList },
  { key: "expiry",     label: "Expiry Mgmt",      Icon: Clock },
  { key: "settings",   label: "Settings",         Icon: SettingsIcon },
];

export default function Layout({ currentPage, setCurrentPage, currentUser, onLogout, children, shared, saveStatus = "saved", onRetrySync }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
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
      .slice(0, 4).map(p => ({ type: "product", label: p.name, sub: `Product · Rs. ${p.sellingPrice} · Qty: ${p.quantity}`, page: "products" })),
    ...(categories || []).filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 3).map(c => ({ type: "category", label: c.name, sub: `Category`, page: "categories" })),
    ...(suppliers || []).filter(s => s.name.toLowerCase().includes(q))
      .slice(0, 3).map(s => ({ type: "supplier", label: s.name, sub: `Supplier · ${s.contact}`, page: "suppliers" })),
    ...(sales || []).filter(s => s.id.toLowerCase().includes(q) || s.customer?.toLowerCase().includes(q))
      .slice(0, 3).map(s => ({ type: "sale", label: `${s.id} — ${s.customer || "Walk-in"}`, sub: `Sale · Rs. ${s.total}`, page: "sales" })),
  ] : [];

  // Close search on outside click
  useEffect(() => {
    const handler = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Global keyboard shortcuts (Decision 4: every action shows its shortcut)
  useEffect(() => {
    const handleKeyDown = e => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || tag === "select";

      // Command/Ctrl + K: Focus global search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = searchRef.current?.querySelector("input");
        input?.focus();
        setShowSearch(true);
      }

      // 'c' or 'C': Toggle calculator when not inside an input
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setShowCalculator(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const initials = (currentUser.fullName || currentUser.email).split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const displayName = currentUser.fullName || currentUser.email.split("@")[0];

  const typeColors = { product: "#0d9488", category: "#3b82f6", supplier: "#8b5cf6", sale: "#22c55e" };
  const typeIcons  = {
    product: <Package size={15} color="#0d9488" />,
    category: <Tag size={15} color="#3b82f6" />,
    supplier: <Truck size={15} color="#8b5cf6" />,
    sale: <DollarSign size={15} color="#22c55e" />,
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? 230 : 62,
        background: "var(--sidebar)",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden", flexShrink: 0, zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding: sidebarOpen ? "18px 16px" : "18px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)", minHeight: 64 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(13,148,136,0.4)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ color: "#f1f5f9", fontFamily: "DM Sans", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "0.02em", lineHeight: 1.2 }}>IMS</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 7px", overflowY: "auto" }}>
          {NAV_ITEMS.map(({ key, label, Icon }) => {
            const active = currentPage === key;
            const isExpiry = key === "expiry";
            return (
              <button key={key} onClick={() => setCurrentPage(key)} title={!sidebarOpen ? label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: sidebarOpen ? "7px 10px" : "7px 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  borderRadius: 9, border: "none", cursor: "pointer", marginBottom: 3,
                  background: active ? "rgba(13, 148, 136, 0.18)" : "transparent",
                  color: active ? "#ffffff" : isExpiry && !active ? "#fdba74" : "var(--sidebar-foreground)",
                  fontFamily: "Inter", fontSize: "0.84rem", fontWeight: active ? 600 : 500,
                  textAlign: "left", transition: "all 0.15s ease", whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--sidebar-hover)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Circular Icon Disc matching the reference image */}
                <span style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: active ? "var(--primary)" : "#374151",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0,
                  boxShadow: active
                    ? "0 2px 8px rgba(13, 148, 136, 0.55)"
                    : "0 1px 3px rgba(0, 0, 0, 0.35)",
                  transition: "all 0.18s ease",
                }}>
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                {sidebarOpen && (
                  <span style={{ flex: 1, letterSpacing: "-0.01em" }}>{label}</span>
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
          style={{ margin: "0 7px 9px", padding: "7px", borderRadius: 7, border: "none", background: "rgba(255,255,255,0.05)", color: "#94a3b8", cursor: "pointer", fontSize: "0.72rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "background 0.15s" }}
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
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", display: "flex", alignItems: "center" }}>
              <Search size={14} />
            </span>
            <input
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              placeholder="Search products, suppliers, sales…"
              style={{
                width: "100%", padding: "6px 12px 6px 30px",
                border: "1px solid var(--border)", borderRadius: 4,
                background: "var(--surface-subtle)", fontSize: "12.5px",
                outline: "none", boxSizing: "border-box", transition: "border-color 80ms ease",
              }}
              onFocusCapture={e => e.target.style.borderColor = "var(--primary)"}
              onBlurCapture={e => e.target.style.borderColor = "var(--border)"}
            />
            {/* Search Dropdown */}
            {showSearch && searchResults.length > 0 && (
              <div style={{ position: "absolute", top: 36, left: 0, right: 0, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 300, overflow: "hidden", maxHeight: 340, overflowY: "auto" }}>
                {searchResults.map((r, i) => (
                  <button key={i} onClick={() => { setCurrentPage(r.page); setShowSearch(false); setSearchQ(""); }}
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", borderBottom: i < searchResults.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface-subtle)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ marginTop: 2 }}>{typeIcons[r.type]}</span>
                    <div>
                      <div style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--foreground)" }}>{r.label}</div>
                      <div style={{ fontSize: "11px", color: typeColors[r.type], marginTop: 1 }}>{r.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showSearch && q.length > 1 && searchResults.length === 0 && (
              <div style={{ position: "absolute", top: 36, left: 0, right: 0, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 300, padding: "12px", textAlign: "center", color: "var(--muted-foreground)", fontSize: "12px" }}>
                No results found for "{searchQ}"
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Network & Save Status Indicator */}
          <div style={{ display: "flex", alignItems: "center", marginRight: 8 }}>
            {saveStatus === "saving" && (
              <div title="Saving changes to database…" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "#b45309", background: "#fef3c7", border: "1px solid #fde68a", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                Saving…
              </div>
            )}
            {saveStatus === "saved" && (
              <div title="All changes saved to database" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                Saved
              </div>
            )}
            {saveStatus === "offline" && (
              <button
                type="button"
                onClick={onRetrySync}
                title="Backend server unreachable. Click to retry saving."
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", padding: "3px 10px", borderRadius: 20, fontWeight: 600, cursor: "pointer" }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                Offline (Retry ↻)
              </button>
            )}
          </div>

          {/* Quick calculator */}
          <div style={{ position: "relative" }}>
            <button type="button" aria-label="Open calculator (C)" aria-expanded={showCalculator} title="Calculator (Shortcut: C)"
              onClick={() => { setShowCalculator(open => !open); setShowNotifs(false); setShowUserMenu(false); }}
              style={{ ...iconBtnStyle, color: showCalculator ? "var(--primary)" : "var(--muted-foreground)" }}>
              <CalculatorIcon size={16} strokeWidth={2} />
            </button>
            {showCalculator && (
              <DropMenu width={290} onClose={() => setShowCalculator(false)}>
                <Calculator onClose={() => setShowCalculator(false)} />
              </DropMenu>
            )}
          </div>

          {/* Bell */}
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowNotifs(n => !n); setShowUserMenu(false); setShowCalculator(false); }}
              style={{ ...iconBtnStyle, position: "relative" }}>
              <Bell size={17} strokeWidth={1.9} />
              {notifications.length > 0 && (
                <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: "#ef4444", border: "1.5px solid #fff" }} />
              )}
            </button>
            {showNotifs && (
              <DropMenu width={320} onClose={() => setShowNotifs(false)}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", fontFamily: "DM Sans" }}>Notifications</span>
                  <span className="badge badge-red">{notifications.length}</span>
                </div>
                {notifications.map(n => {
                  const NotifIcon = n.type === "danger" ? AlertCircle : n.type === "warning" ? AlertTriangle : n.type === "success" ? CheckCircle2 : Info;
                  const notifColor = n.type === "danger" ? "#b91c1c" : n.type === "warning" ? "#d97706" : n.type === "success" ? "#16a34a" : "#2563eb";
                  return (
                    <div key={n.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <NotifIcon size={16} color={notifColor} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.79rem", lineHeight: 1.45 }}>{n.text}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--muted-foreground)", marginTop: 2 }}>{n.time}</div>
                      </div>
                    </div>
                  );
                })}
              </DropMenu>
            )}
          </div>

          {/* Admin */}
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowUserMenu(m => !m); setShowNotifs(false); setShowCalculator(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px 5px 5px", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--muted)", cursor: "pointer", transition: "border 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.72rem", fontWeight: 700 }}>{initials}</div>
              <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap" }}>{displayName}</div>
                <div style={{ fontSize: "0.63rem", color: "var(--muted-foreground)" }}>Admin</div>
              </div>
              <span style={{ color: "var(--muted-foreground)", display: "flex", alignItems: "center" }}><ChevronDown size={14} /></span>
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
                  <LogOut size={15} /> Logout
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

const iconBtnStyle = { width: 30, height: 30, borderRadius: 4, border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", transition: "background 80ms ease, border-color 80ms ease" };

function DropMenu({ children, width, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
      <div style={{ position: "absolute", right: 0, top: 38, width, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 6px 24px rgba(0,0,0,0.12)", zIndex: 100, overflow: "hidden" }}>
        {children}
      </div>
    </>
  );
}
