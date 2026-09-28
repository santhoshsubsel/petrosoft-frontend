import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import DailySales from "./pages/DailySales";
import CashClosure from "./pages/CashClosure";
import Tanks from "./pages/Tanks";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Account from "./pages/Account";
import SimpleTable from "./pages/SimpleTable";
import Users from "./pages/Users";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="daily-sales" element={<DailySales />} />
          <Route path="credit" element={<Customers />} />
          <Route path="products" element={<SimpleTable title="Products & Stock" endpoint="/products" />} />
          <Route path="tanks" element={<Tanks />} />
          <Route path="stock-in" element={<SimpleTable title="Add Stock" endpoint="/inventory" />} />
          <Route path="expenses" element={<SimpleTable title="Expenses" endpoint="/expenses" />} />
          <Route path="reports" element={<Reports />} />
          <Route path="customers" element={<Customers />} />
          <Route path="account" element={<Account />} />
          <Route path="users" element={<Users />} />
          <Route path="cash-closure" element={<CashClosure />} />
        </Route>
      </Route>
    </Routes>
  );
}
