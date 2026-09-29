
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export default function RoleGate({ role, children }: { role: "ADMIN" | "MANAGER"; children: ReactNode }) {
  const { isAdmin, role: currentRole } = useAuth();
  if (role === "ADMIN" && !isAdmin) return null;
  if (currentRole !== role && role !== "ADMIN") return null;
  return <>{children}</>;
}
