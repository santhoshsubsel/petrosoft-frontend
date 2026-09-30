import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toggleSidebar } = useUI();

  const userName = user?.name || "User";
  const userRole = user?.role || "MANAGER";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={toggleSidebar} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Menu size={21} /></button>
        <div className="hidden w-72 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 md:flex">
          <Search size={16} className="text-slate-400" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Search anything..." />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
          <Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{userName.slice(0, 2).toUpperCase()}</div>
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-slate-800">{userName}</p>
            <p className="text-[10px] text-slate-400">{userRole === "ADMIN" ? "Administrator" : "Station Manager"}</p>
          </div>
          <ChevronDown size={14} className="hidden text-slate-400 lg:block" />
          <button type="button" onClick={handleLogout} className="ml-1 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" title="Logout">
            <LogOut size={15} /><span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
