import { useEffect, useState } from "react";
import Login from "./Authentication/Login";
import Layout from "./Components/Layout";
import Dashboard from "./Pages/Dashboard";
import Products from "./Pages/Products";
import Categories from "./Pages/Categories";
import Suppliers from "./Pages/Suppliers";
import Purchases from "./Pages/Purchases";
import Sales from "./Pages/Sales";
import StockRecords from "./Pages/StockRecords";
import Reports from "./Pages/Reports";
import ExpiryManagement from "./Pages/ExpiryManagement";
import Settings from "./Pages/Settings";
import { supabase } from "./Authentication/supabase";
import { initialCategories, initialProducts, initialSuppliers, initialPurchases, initialSales } from "./data";

const profile = user => user && ({ email: user.email, fullName: user.user_metadata?.full_name || "", phone: user.user_metadata?.phone || "" });

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(!!supabase);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [sales, setSales] = useState(initialSales);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setCurrentUser(profile(session?.user));
      setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) { setCurrentUser(profile(session?.user)); setAuthLoading(false); }
    }).catch(() => { if (active) setAuthLoading(false); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentPage("dashboard");
  };

  if (authLoading) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--muted-foreground)" }}>Loading account…</div>;

  if (!currentUser || window.location.pathname === "/reset-password") {
    return <Login />;
  }

  const shared = { categories, products, suppliers, purchases, sales, setCategories, setProducts, setSuppliers, setPurchases, setSales };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":  return <Dashboard {...shared} />;
      case "products":   return <Products {...shared} />;
      case "categories": return <Categories {...shared} />;
      case "suppliers":  return <Suppliers {...shared} />;
      case "purchases":  return <Purchases {...shared} />;
      case "sales":      return <Sales {...shared} />;
      case "stock":      return <StockRecords {...shared} />;
      case "reports":    return <Reports {...shared} />;
      case "expiry":     return <ExpiryManagement {...shared} />;
      case "settings":   return <Settings currentUser={currentUser} />;
      default:           return <Dashboard {...shared} />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage} currentUser={currentUser} onLogout={handleLogout} shared={shared}>
      {renderPage()}
    </Layout>
  );
}
