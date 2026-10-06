import {
  CalendarDays,
  LogOut,
  Menu,
  Search,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

export default function Topbar() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, logout } = useAuth();
  const { toggleSidebar } = useUI();

  const userName = user?.name || "User";
  const userRole = user?.role || "MANAGER";

  /* =====================================================
     DATE
  ====================================================== */

  const getToday = () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const selectedDate =
    searchParams.get("date") || getToday();

  const handleDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const date = event.target.value;

    if (!date) return;

    const params = new URLSearchParams(searchParams);

    params.set("date", date);

    setSearchParams(params);
  };

  /* =====================================================
     LOGOUT
  ====================================================== */

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  /* =====================================================
     INITIALS
  ====================================================== */

  const initials = userName
    .trim()
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className="
        fixed
        left-0
        right-0
        top-0
        z-50
        flex
        h-16
        items-center
        justify-between
        border-b
        border-slate-200
        bg-white/95
        px-4
        shadow-sm
        backdrop-blur
        sm:px-6
        lg:left-[250px]
      "
    >
      {/* =================================================
          LEFT SECTION
      ================================================== */}

      <div className="flex min-w-0 items-center gap-3">

        {/* Mobile Menu */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="
            rounded-lg
            p-2
            text-slate-500
            transition
            hover:bg-slate-100
            hover:text-slate-700
            lg:hidden
          "
          aria-label="Open menu"
        >
          <Menu size={21} />
        </button>

        {/* Search */}
        <div
          className="
            hidden
            h-10
            w-72
            items-center
            gap-2
            rounded-xl
            bg-slate-50
            px-3
            transition
            focus-within:bg-white
            focus-within:ring-2
            focus-within:ring-blue-500/10
            lg:flex
          "
        >
          <Search
            size={16}
            className="shrink-0 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search anything..."
            className="
              w-full
              bg-transparent
              text-sm
              text-slate-700
              outline-none
              placeholder:text-slate-400
            "
          />
        </div>
      </div>

      {/* =================================================
          RIGHT SECTION
      ================================================== */}

      <div className="flex items-center gap-2 sm:gap-3">

        {/* =================================================
            DATE PICKER
        ================================================== */}

        <div
          className="
            flex
            h-10
            items-center
            gap-2
            rounded-xl
            border
            border-slate-200
            bg-white
            px-3
            shadow-sm
            transition
            hover:border-blue-200
            focus-within:border-blue-500
            focus-within:ring-2
            focus-within:ring-blue-500/10
          "
          title="Select dashboard date"
        >
          <CalendarDays
            size={17}
            className="shrink-0 text-blue-600"
          />

          <div className="hidden flex-col sm:flex">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              Revenue Date
            </span>

            <input
              type="date"
              value={selectedDate}
              max={getToday()}
              onChange={handleDateChange}
              className="
                w-[125px]
                bg-transparent
                text-xs
                font-bold
                text-slate-700
                outline-none
              "
            />
          </div>

          {/* Mobile date input */}
          <input
            type="date"
            value={selectedDate}
            max={getToday()}
            onChange={handleDateChange}
            className="
              w-[120px]
              bg-transparent
              text-xs
              font-bold
              text-slate-700
              outline-none
              sm:hidden
            "
          />
        </div>

        {/* Divider */}
        <div className="hidden h-7 w-px bg-slate-200 sm:block" />

        {/* =================================================
            USER
        ================================================== */}

        <div className="flex items-center gap-2">

          {/* Avatar */}
          <div
            className="
              grid
              h-9
              w-9
              shrink-0
              place-items-center
              rounded-full
              bg-blue-100
              text-xs
              font-bold
              text-blue-700
            "
          >
            {initials || "U"}
          </div>

          {/* User Information */}
          <div className="hidden min-w-0 text-right sm:block">

            <p className="max-w-[150px] truncate text-xs font-bold text-slate-800">
              {userName}
            </p>

            <p className="text-[10px] font-medium text-slate-400">
              {userRole === "ADMIN"
                ? "Administrator"
                : "Station Manager"}
            </p>

          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="
              ml-1
              flex
              h-9
              items-center
              gap-2
              rounded-lg
              border
              border-slate-200
              px-3
              text-xs
              font-semibold
              text-slate-600
              transition
              hover:border-red-200
              hover:bg-red-50
              hover:text-red-600
              active:scale-[0.98]
            "
            title="Logout"
          >
            <LogOut size={15} />

            <span className="hidden sm:inline">
              Logout
            </span>
          </button>

        </div>
      </div>
    </header>
  );
}