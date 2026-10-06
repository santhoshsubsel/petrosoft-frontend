import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f9fc]">
      <Sidebar />
      <div className="min-w-0 lg:pl-[250px]">
        <Topbar />
        <main className="min-w-0 p-3 pt-10 sm:p-5 sm:pt-12 lg:p-6 lg:pt-12 xl:p-7 xl:pt-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
