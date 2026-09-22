export const initialCategories = [
  { id: "C001", name: "Beverages", description: "Cold drinks, juices, water, and liquid refreshments", icon: "🥤" },
  { id: "C002", name: "Snacks", description: "Chips, biscuits, namkeen and light food items", icon: "🍿" },
  { id: "C003", name: "Dairy", description: "Milk, butter, cheese and dairy-based products", icon: "🥛" },
  { id: "C004", name: "Grains", description: "Rice, wheat, pulses and cereal products", icon: "🌾" },
  { id: "C005", name: "Condiments", description: "Sauces, spices, oils and seasonings", icon: "🫙" },
  { id: "C006", name: "Personal Care", description: "Soaps, shampoos, skincare products", icon: "🧴" },
];

export const initialSuppliers = [
  { id: "S001", name: "ABC Traders", contact: "9876543210", email: "abc@gmail.com", address: "12 Market Road, Delhi", products: "Rice, Wheat" },
  { id: "S002", name: "Fresh Foods Co.", contact: "9123456780", email: "fresh@gmail.com", address: "45 MG Road, Mumbai", products: "Milk, Cheese, Butter" },
  { id: "S003", name: "Beverage World", contact: "9000012345", email: "bev@gmail.com", address: "7 Park Street, Kolkata", products: "Coke, Pepsi, Sprite" },
  { id: "S004", name: "Snack Hub", contact: "9871234560", email: "snack@gmail.com", address: "22 Brigade Road, Bangalore", products: "Chips, Biscuits, Namkeen" },
  { id: "S005", name: "CarePlus Ltd.", contact: "9811223344", email: "careplus@gmail.com", address: "88 Nehru Nagar, Pune", products: "Soaps, Shampoos" },
];

export const initialProducts = [
  { id: "P001", name: "Coca-Cola 600ml", categoryId: "C001", supplierId: "S003", purchasePrice: 35, sellingPrice: 55, quantity: 120, reorderLevel: 50, description: "Chilled carbonated soft drink", dateAdded: "2026-07-01", batchNo: "B2026-07A", expiryDate: "2026-12-31" },
  { id: "P002", name: "Pepsi 600ml", categoryId: "C001", supplierId: "S003", purchasePrice: 32, sellingPrice: 50, quantity: 100, reorderLevel: 50, description: "Carbonated cola beverage", dateAdded: "2026-07-02", batchNo: "B2026-07B", expiryDate: "2026-09-28" },
  { id: "P003", name: "Lays Classic Chips", categoryId: "C002", supplierId: "S004", purchasePrice: 18, sellingPrice: 30, quantity: 205, reorderLevel: 80, description: "Salted potato chips 50g", dateAdded: "2026-07-05", batchNo: "B2026-07C", expiryDate: "2026-10-15" },
  { id: "P004", name: "Britannia Biscuits", categoryId: "C002", supplierId: "S004", purchasePrice: 12, sellingPrice: 20, quantity: 200, reorderLevel: 60, description: "Cream biscuits 200g", dateAdded: "2026-07-06", batchNo: "B2026-07D", expiryDate: "2026-11-30" },
  { id: "P005", name: "Amul Full Cream Milk 1L", categoryId: "C003", supplierId: "S002", purchasePrice: 55, sellingPrice: 70, quantity: 0, reorderLevel: 30, description: "Pasteurized full cream milk", dateAdded: "2026-07-10", batchNo: "B2026-09A", expiryDate: "2026-09-21" },
  { id: "P006", name: "Basmati Rice 5kg", categoryId: "C004", supplierId: "S001", purchasePrice: 280, sellingPrice: 380, quantity: 110, reorderLevel: 20, description: "Premium long grain basmati rice", dateAdded: "2026-07-12", batchNo: "B2026-07E", expiryDate: "2027-06-30" },
  { id: "P007", name: "Amul Butter 500g", categoryId: "C003", supplierId: "S002", purchasePrice: 195, sellingPrice: 260, quantity: 32, reorderLevel: 15, description: "Salted table butter", dateAdded: "2026-07-15", batchNo: "B2026-08A", expiryDate: "2026-09-22" },
  { id: "P008", name: "Sprite 600ml", categoryId: "C001", supplierId: "S003", purchasePrice: 33, sellingPrice: 52, quantity: 132, reorderLevel: 50, description: "Lemon-lime carbonated drink", dateAdded: "2026-08-01", batchNo: "B2026-08B", expiryDate: "2026-09-27" },
  { id: "P009", name: "Kurkure Masala", categoryId: "C002", supplierId: "S004", purchasePrice: 15, sellingPrice: 25, quantity: 180, reorderLevel: 60, description: "Spicy puffed corn snack", dateAdded: "2026-08-05", batchNo: "B2026-08C", expiryDate: "2026-11-15" },
  { id: "P010", name: "Dove Soap 75g", categoryId: "C006", supplierId: "S005", purchasePrice: 35, sellingPrice: 55, quantity: 90, reorderLevel: 25, description: "Moisturizing beauty soap", dateAdded: "2026-08-10", batchNo: "B2026-08D", expiryDate: "2028-08-10" },
  { id: "P011", name: "Orange Juice 1L", categoryId: "C001", supplierId: "S003", purchasePrice: 65, sellingPrice: 90, quantity: 18, reorderLevel: 20, description: "Fresh squeezed orange juice", dateAdded: "2026-09-01", batchNo: "B2026-09B", expiryDate: "2026-09-25" },
  { id: "P012", name: "Yogurt 400g", categoryId: "C003", supplierId: "S002", purchasePrice: 45, sellingPrice: 65, quantity: 8, reorderLevel: 10, description: "Fresh plain yogurt", dateAdded: "2026-09-10", batchNo: "B2026-09C", expiryDate: "2026-09-22" },
];

export const initialPurchases = [
  { id: "PUR001", supplierId: "S001", productId: "P006", quantity: 50, purchasePrice: 280, total: 14000, date: "2026-08-01" },
  { id: "PUR002", supplierId: "S003", productId: "P001", quantity: 100, purchasePrice: 35, total: 3500, date: "2026-08-05" },
  { id: "PUR003", supplierId: "S003", productId: "P002", quantity: 80, purchasePrice: 32, total: 2560, date: "2026-08-05" },
  { id: "PUR004", supplierId: "S004", productId: "P003", quantity: 150, purchasePrice: 18, total: 2700, date: "2026-08-10" },
  { id: "PUR005", supplierId: "S002", productId: "P005", quantity: 50, purchasePrice: 55, total: 2750, date: "2026-08-15" },
  { id: "PUR006", supplierId: "S003", productId: "P008", quantity: 80, purchasePrice: 33, total: 2640, date: "2026-08-20" },
  { id: "PUR007", supplierId: "S004", productId: "P004", quantity: 120, purchasePrice: 12, total: 1440, date: "2026-08-22" },
  { id: "PUR008", supplierId: "S002", productId: "P007", quantity: 20, purchasePrice: 195, total: 3900, date: "2026-08-25" },
  { id: "PUR009", supplierId: "S003", productId: "P011", quantity: 30, purchasePrice: 65, total: 1950, date: "2026-09-01" },
  { id: "PUR010", supplierId: "S005", productId: "P010", quantity: 50, purchasePrice: 35, total: 1750, date: "2026-09-05" },
];

// "Walk-in" removed — customer is blank when not entered
export const initialSales = [
  { id: "SAL001", productId: "P001", quantity: 45, sellingPrice: 55, total: 2475, date: "2026-08-10", customer: "Ravi Kumar" },
  { id: "SAL002", productId: "P003", quantity: 60, sellingPrice: 30, total: 1800, date: "2026-08-12", customer: "Priya Sharma" },
  { id: "SAL003", productId: "P001", quantity: 30, sellingPrice: 55, total: 1650, date: "2026-08-15", customer: "Ankit Patel" },
  { id: "SAL004", productId: "P006", quantity: 10, sellingPrice: 380, total: 3800, date: "2026-08-16", customer: "Sunita Devi" },
  { id: "SAL005", productId: "P002", quantity: 40, sellingPrice: 50, total: 2000, date: "2026-08-18", customer: "Mohan Rao" },
  { id: "SAL006", productId: "P004", quantity: 50, sellingPrice: 20, total: 1000, date: "2026-08-19", customer: "Kavita Nair" },
  { id: "SAL007", productId: "P005", quantity: 20, sellingPrice: 70, total: 1400, date: "2026-08-20", customer: "" },
  { id: "SAL008", productId: "P001", quantity: 25, sellingPrice: 55, total: 1375, date: "2026-08-22", customer: "Deepak Singh" },
  { id: "SAL009", productId: "P003", quantity: 35, sellingPrice: 30, total: 1050, date: "2026-08-24", customer: "Rekha Joshi" },
  { id: "SAL010", productId: "P008", quantity: 28, sellingPrice: 52, total: 1456, date: "2026-08-26", customer: "" },
  { id: "SAL011", productId: "P007", quantity: 8, sellingPrice: 260, total: 2080, date: "2026-08-28", customer: "Ananya Iyer" },
  { id: "SAL012", productId: "P001", quantity: 20, sellingPrice: 55, total: 1100, date: "2026-08-30", customer: "Raj Malhotra" },
];

/* ── Expiry helper ── */
export function getExpiryStatus(expiryDate) {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((exp - today) / 86400000);
  if (diffDays < 0)  return { status: "expired",  label: "Expired",        badge: "badge-red",    days: diffDays };
  if (diffDays === 0) return { status: "today",   label: "Expiring Today",  badge: "badge-orange", days: 0 };
  if (diffDays <= 7)  return { status: "near",    label: `Expires in ${diffDays}d`, badge: "badge-yellow", days: diffDays };
  if (diffDays <= 30) return { status: "soon",    label: `Expires in ${diffDays}d`, badge: "badge-teal",   days: diffDays };
  return { status: "active", label: "Active", badge: "badge-green", days: diffDays };
}
