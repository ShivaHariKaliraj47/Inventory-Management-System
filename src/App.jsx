import { useState } from "react";
import Login from "./Pages/Login";
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
import { initialCategories, initialProducts, initialSuppliers, initialPurchases, initialSales } from "./data";

const DEFAULT_ACCOUNTS = [
  { email: "admin@gmail.com", password: "Admin@123", fullName: "Admin User", phone: "9812345678" },
];

export default function App() {
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [sales, setSales] = useState(initialSales);

  const handleLogin = (acct) => { setCurrentUser(acct); setCurrentPage("dashboard"); };
  const handleCreateAccount = (a) => setAccounts(prev => [...prev, a]);
  const handleLogout = () => { setCurrentUser(null); setCurrentPage("dashboard"); };

  if (!currentUser) {
    return <Login onLogin={handleLogin} accounts={accounts} onCreateAccount={handleCreateAccount} />;
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
      default:           return <Dashboard {...shared} />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage} currentUser={currentUser} onLogout={handleLogout} shared={shared}>
      {renderPage()}
    </Layout>
  );
}
