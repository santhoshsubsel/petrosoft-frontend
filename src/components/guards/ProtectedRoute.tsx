import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Role } from "../../types";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
