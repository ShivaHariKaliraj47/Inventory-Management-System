import { useEffect, useState, useRef } from "react";
import {
  Mail,
  Save,
  UserRound,
  RefreshCw,
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../Authentication/supabase";
import {
  initialCategories,
  initialProducts,
  initialSuppliers,
  initialPurchases,
  initialSales,
} from "../data";

const emailRegex = /^[A-Za-z][A-Za-z0-9._-]*@gmail\.com$/;

export default function Settings({
  currentUser,
  categories = [],
  products = [],
  suppliers = [],
  purchases = [],
  sales = [],
  setCategories,
  setProducts,
  setSuppliers,
  setPurchases,
  setSales,
}) {
  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dataSyncMsg, setDataSyncMsg] = useState("");
  const [backupMsg, setBackupMsg] = useState("");
  const [backupError, setBackupError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFullName(currentUser?.fullName || "");
    setEmail(currentUser?.email || "");
  }, [currentUser?.fullName, currentUser?.email]);

  const save = async e => {
    e.preventDefault(); setError(""); setMessage("");
    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!emailRegex.test(email)) { setError("Enter a valid Gmail address."); return; }
    if (!supabase) { setError("Supabase is not configured."); return; }
    setSaving(true);
    try {
      const emailChanged = email !== currentUser?.email;
      const { error: updateError } = await supabase.auth.updateUser({
        ...(emailChanged ? { email } : {}),
        data: { full_name: fullName.trim() },
      });
      if (updateError) setError(updateError.message);
      else setMessage(emailChanged ? "Profile saved. Check your email to confirm the address change." : "Profile saved successfully.");
    } catch { setError("Unable to update your profile. Please try again."); }
    finally { setSaving(false); }
  };

  const handleSyncDataJs = () => {
    if (!confirm("Reload all data from src/data.js? This will update products, sales (customer names), suppliers, and categories to match data.js.")) return;
    if (setCategories) setCategories(initialCategories);
    if (setProducts) setProducts(initialProducts);
    if (setSuppliers) setSuppliers(initialSuppliers);
    if (setPurchases) setPurchases(initialPurchases);
    if (setSales) setSales(initialSales);
    setDataSyncMsg("All inventory & sales data successfully reloaded from src/data.js and saved to database!");
    setTimeout(() => setDataSyncMsg(""), 5000);
  };

  const handleExportBackup = () => {
    const backupData = {
      app: "Inventory Management System",
      version: "1.0",
      exportDate: new Date().toISOString(),
      categories,
      products,
      suppliers,
      purchases,
      sales,
    };
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchor = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    dlAnchor.setAttribute("href", jsonStr);
    dlAnchor.setAttribute("download", `ims-backup-${dateStr}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    setBackupMsg("Complete backup successfully downloaded as JSON file!");
    setTimeout(() => setBackupMsg(""), 5000);
  };

  const handleExportCSV = (type = "products") => {
    let rows = [];
    let filename = "";
    if (type === "products") {
      filename = `products-${new Date().toISOString().slice(0, 10)}.csv`;
      rows.push(["Product ID", "Product Name", "Category ID", "Supplier ID", "Quantity", "Purchase Price (Rs.)", "Selling Price (Rs.)", "Expiry Date", "Batch No"]);
      products.forEach(p => {
        rows.push([
          p.id || "",
          `"${(p.name || "").replace(/"/g, '""')}"`,
          p.categoryId || "",
          p.supplierId || "",
          p.quantity ?? 0,
          p.purchasePrice ?? 0,
          p.sellingPrice ?? 0,
          p.expiryDate || "",
          p.batchNo || "",
        ]);
      });
    } else if (type === "sales") {
      filename = `sales-${new Date().toISOString().slice(0, 10)}.csv`;
      rows.push(["Sale ID", "Date", "Customer", "Product ID", "Quantity", "Selling Price (Rs.)", "Total (Rs.)"]);
      sales.forEach(s => {
        rows.push([
          s.id || "",
          s.date || "",
          `"${(s.customer || "").replace(/"/g, '""')}"`,
          s.productId || "",
          s.quantity ?? 0,
          s.sellingPrice ?? 0,
          s.total ?? 0,
        ]);
      });
    }
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setBackupMsg(`Exported ${type} successfully to Excel/CSV file!`);
    setTimeout(() => setBackupMsg(""), 5000);
  };

  const handleImportBackup = (e) => {
    setBackupError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.products || !parsed.categories) {
          setBackupError("Invalid backup file: Must contain products and categories.");
          return;
        }
        if (!confirm(`Restore backup from ${parsed.exportDate?.slice(0, 10) || "file"}? This will replace your current data with the backup contents.`)) {
          return;
        }
        if (parsed.categories && setCategories) setCategories(parsed.categories);
        if (parsed.products && setProducts) setProducts(parsed.products);
        if (parsed.suppliers && setSuppliers) setSuppliers(parsed.suppliers);
        if (parsed.purchases && setPurchases) setPurchases(parsed.purchases);
        if (parsed.sales && setSales) setSales(parsed.sales);
        setBackupMsg("Backup successfully restored! All tables updated and synced.");
        setTimeout(() => setBackupMsg(""), 5000);
      } catch (err) {
        setBackupError("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 700 }}>Settings</h2>
        <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: "0.855rem" }}>Manage your account profile and data preferences</p>
      </div>

      <div className="card-shadow" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "18px 22px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Profile details</h3>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.78rem", margin: "4px 0 0" }}>Update the name and email associated with your account.</p>
        </div>
        <form onSubmit={save} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: "0.8rem", fontWeight: 600 }}>
            Full name
            <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <UserRound size={17} style={{ position: "absolute", left: 12, color: "var(--muted-foreground)" }} />
              <input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Your full name" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "11px 12px 11px 40px", background: "var(--muted)" }} />
            </span>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: "0.8rem", fontWeight: 600 }}>
            Email address
            <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Mail size={17} style={{ position: "absolute", left: 12, color: "var(--muted-foreground)" }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@gmail.com" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "11px 12px 11px 40px", background: "var(--muted)" }} />
            </span>
            <span style={{ fontWeight: 400, color: "var(--muted-foreground)", fontSize: "0.72rem" }}>Changing your email may require confirmation.</span>
          </label>
          {error && <div role="alert" className="badge-red" style={{ borderRadius: "var(--radius)", padding: 12, fontSize: "0.8rem" }}>{error}</div>}
          {message && <div role="status" className="badge-green" style={{ borderRadius: "var(--radius)", padding: 12, fontSize: "0.8rem" }}>{message}</div>}
          <button type="submit" disabled={saving} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "var(--primary-foreground)", border: 0, borderRadius: "var(--radius)", padding: "10px 18px", fontWeight: 600, cursor: saving ? "wait" : "pointer" }}><Save size={16} /> {saving ? "Saving…" : "Save Profile"}</button>
        </form>
      </div>

      {/* Data Management & Sync */}
      <div className="card-shadow" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={18} color="var(--primary)" />
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Data Sync (src/data.js)</h3>
          </div>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.78rem", margin: "4px 0 0" }}>
            Synchronize your database with custom entries or changes made directly in <code style={{ fontFamily: "JetBrains Mono, monospace" }}>src/data.js</code>.
          </p>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)", lineHeight: 1.5, margin: 0 }}>
            If you changed customer names, product names, or seed values in <code style={{ fontFamily: "JetBrains Mono, monospace" }}>src/data.js</code>, click below to force-refresh all active inventory tables and sync them to the database.
          </p>

          {dataSyncMsg && (
            <div role="status" className="badge-green" style={{ borderRadius: "var(--radius)", padding: 12, fontSize: "0.8rem" }}>
              {dataSyncMsg}
            </div>
          )}

          <button
            type="button"
            onClick={handleSyncDataJs}
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#ffffff",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "10px 16px",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} /> Reload Data from data.js
          </button>
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="card-shadow" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} color="var(--primary)" />
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Data Backup & Export</h3>
          </div>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.78rem", margin: "4px 0 0" }}>
            Safeguard your business records. Download a complete backup or export data to Excel spreadsheets.
          </p>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          {backupMsg && (
            <div role="status" className="badge-green" style={{ borderRadius: "var(--radius)", padding: 12, fontSize: "0.8rem" }}>
              {backupMsg}
            </div>
          )}
          {backupError && (
            <div role="alert" className="badge-red" style={{ borderRadius: "var(--radius)", padding: 12, fontSize: "0.8rem" }}>
              {backupError}
            </div>
          )}

          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: 8, color: "var(--foreground)" }}>
              Download Backups
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleExportBackup}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "var(--primary)", color: "#fff",
                  border: "none", borderRadius: "var(--radius)",
                  padding: "9px 15px", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
                }}
              >
                <Download size={15} /> Export Backup (JSON)
              </button>

              <button
                type="button"
                onClick={() => handleExportCSV("products")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#fff", color: "var(--foreground)",
                  border: "1px solid var(--border)", borderRadius: "var(--radius)",
                  padding: "9px 15px", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
                }}
              >
                <FileSpreadsheet size={15} color="#16a34a" /> Products CSV (Excel)
              </button>

              <button
                type="button"
                onClick={() => handleExportCSV("sales")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#fff", color: "var(--foreground)",
                  border: "1px solid var(--border)", borderRadius: "var(--radius)",
                  padding: "9px 15px", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
                }}
              >
                <FileSpreadsheet size={15} color="#2563eb" /> Sales CSV (Excel)
              </button>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: 4, color: "var(--foreground)" }}>
              Restore from Backup
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", margin: "0 0 10px 0" }}>
              Restore your inventory, products, sales, and categories from an earlier JSON backup file.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportBackup}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#fff", color: "var(--foreground)",
                border: "1px solid var(--border)", borderRadius: "var(--radius)",
                padding: "9px 15px", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
              }}
            >
              <Upload size={15} /> Choose JSON Backup File to Restore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

