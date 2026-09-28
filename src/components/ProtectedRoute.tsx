
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#f6f9fc] text-sm text-slate-500">Loading PetroSoft...</div>;
  }

  return token ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}
