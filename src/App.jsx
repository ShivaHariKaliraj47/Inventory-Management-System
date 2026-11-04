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
import { loadInventory, saveInventory } from "./api/inventory";
import { initialCategories, initialProducts, initialSuppliers, initialPurchases, initialSales } from "./data";

const profile = user => user && ({ id: user.id, email: user.email, fullName: user.user_metadata?.full_name || "", phone: user.user_metadata?.phone || "" });

function mergeListWithInitial(dbList = [], initList = [], key = "id", updateFn) {
  if (!dbList || dbList.length === 0) return initList;
  const initMap = new Map(initList.map(item => [item[key], item]));
  return dbList.map(item => {
    const init = initMap.get(item[key]);
    if (!init) return item;
    return updateFn ? updateFn(item, init) : { ...item, ...init };
  });
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(!!supabase);
  const [inventoryReady, setInventoryReady] = useState(false);
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
      if (session?.user) {
        setCurrentUser(profile(session.user));
      }
      setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) {
        if (session?.user) setCurrentUser(profile(session.user));
        setAuthLoading(false);
      }
    }).catch(() => { if (active) setAuthLoading(false); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;
    if (!currentUser) { setInventoryReady(false); return; }
    setInventoryReady(false);
    loadInventory()
      .then(state => {
        if (!active) return;
        if (state) {
          const mergedCategories = mergeListWithInitial(state.categories, initialCategories, "id", (db, init) => ({ ...db, name: init.name, description: init.description }));
          const mergedProducts = mergeListWithInitial(state.products, initialProducts, "id", (db, init) => ({ ...init, ...db, name: init.name, description: init.description, batchNo: init.batchNo, expiryDate: init.expiryDate, categoryId: init.categoryId || db.categoryId, supplierId: init.supplierId || db.supplierId }));
          const mergedSuppliers = mergeListWithInitial(state.suppliers, initialSuppliers, "id", (db, init) => ({ ...db, name: init.name, contact: init.contact, email: init.email, address: init.address, products: init.products }));
          const mergedPurchases = mergeListWithInitial(state.purchases, initialPurchases, "id", (db, init) => ({ ...db, productId: init.productId || db.productId }));
          const mergedSales = mergeListWithInitial(state.sales, initialSales, "id", (db, init) => ({
            ...db,
            customer: init.customer !== undefined ? init.customer : db.customer,
            productId: init.productId || db.productId,
          }));

          setCategories(mergedCategories);
          setProducts(mergedProducts);
          setSuppliers(mergedSuppliers);
          setPurchases(mergedPurchases);
          setSales(mergedSales);
        }
        setInventoryReady(true);
      })
      .catch(error => {
        console.error("Inventory backend unavailable:", error);
        if (active) setInventoryReady(true);
      });
    return () => { active = false; };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser || !inventoryReady) return;
    const timer = window.setTimeout(() => {
      saveInventory({ categories, products, suppliers, purchases, sales })
        .catch(error => console.error("Unable to save inventory:", error));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [currentUser, inventoryReady, categories, products, suppliers, purchases, sales]);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut().catch(() => {});
    setCurrentUser(null);
    setCurrentPage("dashboard");
  };

  if (authLoading || (currentUser && !inventoryReady)) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--muted-foreground)" }}>Loading inventory…</div>;

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
      case "settings":   return <Settings currentUser={currentUser} {...shared} />;
      default:           return <Dashboard {...shared} />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage} currentUser={currentUser} onLogout={handleLogout} shared={shared}>
      {renderPage()}
    </Layout>
  );
}
