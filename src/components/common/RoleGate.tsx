import type { ReactNode } from "react";
import type { Role } from "../../types";
import { useAuth } from "../../context/AuthContext";
export default function RoleGate({ roles, children, fallback = null }: { roles: Role[]; children: ReactNode; fallback?: ReactNode }) { const { hasRole } = useAuth(); return hasRole(...roles) ? children : fallback; }
