import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Warehouse,
  BarChart3,
  Settings,
  ShieldCheck,
  X,
  Fuel,
  ShoppingCart,
  UserRound,
  WalletCards,
} from "lucide-react";
import Logo from "./Logo";
import { useUI } from "../context/UIContext";
import { useAuth } from "../context/AuthContext";
import type { LucideIcon } from "lucide-react";

type NavItem = { to: string; label: string; icon: LucideIcon };

const managerItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/track-sales", label: "Track Petrol Sales", icon: Fuel },
  { to: "/lubricant-sales", label: "Lubricant Oil Sales", icon: ShoppingCart },
  { to: "/cash-closure", label: "Cash Closure", icon: WalletCards },
  { to: "/customers", label: "Customer", icon: UserRound },
  { to: "/daily-sales", label: "Daily Sales", icon: ClipboardList },
];

const adminItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/daily-sales", label: "Daily Sales", icon: ClipboardList },
  { to: "/customers", label: "Customer", icon: UserRound },
  { to: "/products", label: "Product & Stock", icon: Package },
  { to: "/tanks", label: "Tank Management", icon: Warehouse },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/account", label: "Account Setup", icon: Settings },
];

export default function Sidebar() {
  const { sidebarOpen, closeSidebar } = useUI();
  const { isAdmin } = useAuth();
  const items = isAdmin ? adminItems : managerItems;

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={closeSidebar}
        className={`fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[1px] lg:hidden ${sidebarOpen ? "block" : "hidden"}`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(84vw,260px)] -translate-x-full flex-col bg-[#092442] px-3 py-4 text-white shadow-2xl transition-transform duration-200 lg:w-[250px] lg:translate-x-0 lg:shadow-none ${sidebarOpen ? "translate-x-0" : ""}`}
      >
        <div className="mb-5 flex shrink-0 items-center justify-between px-2">
          <Logo dark />
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Workspace</div>
          <div className="mt-1 flex items-center gap-2 text-xs font-bold">
            {isAdmin ? <ShieldCheck size={14} className="text-blue-300" /> : <Fuel size={14} className="text-emerald-300" />}
            {isAdmin ? "Administrator" : "Station Manager"}
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  isActive
                    ? "bg-brand-600 text-white shadow-lg shadow-blue-950/20"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={16} />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/users"
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <ShieldCheck size={16} />
              <span>User Management</span>
            </NavLink>
          )}
        </nav>

        <div className="mt-4 shrink-0 border-t border-white/10 pt-4">
          <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Business Unit</div>
          <div className="mt-1 px-2 text-xs font-semibold">Subsel</div>
          <div className="mt-1 px-2 text-[10px] text-slate-500">PetroSoft v1.0.0</div>
        </div>
      </aside>
    </>
  );
}
