import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
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
import ManagerTrackSales from "./pages/ManagerTrackSales";
import LubricantSales from "./pages/LubricantSales";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Shared operational tabs: Salesforce has Customer + Daily Sales for both roles. */}
          <Route path="daily-sales" element={<DailySales />} />
          <Route path="customers" element={<Customers />} />
          <Route path="credit" element={<Customers />} />

          {/* Manager operational workspace */}
          <Route element={<RoleRoute role="MANAGER" />}>
            <Route path="track-sales" element={<ManagerTrackSales />} />
            <Route path="lubricant-sales" element={<LubricantSales />} />
            <Route path="cash-closure" element={<CashClosure />} />
          </Route>

          {/* Admin management workspace */}
          <Route element={<RoleRoute role="ADMIN" />}>
            <Route path="products" element={<SimpleTable title="Products & Stock" endpoint="/products" />} />
            <Route path="tanks" element={<Tanks />} />
            <Route path="expenses" element={<SimpleTable title="Expenses" endpoint="/expenses" />} />
            <Route path="reports" element={<Reports />} />
            <Route path="account" element={<Account />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
