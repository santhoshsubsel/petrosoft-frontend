
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface UIContextValue {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const value = useMemo(() => ({
    sidebarOpen,
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false),
    toggleSidebar: () => setSidebarOpen((value) => !value),
  }), [sidebarOpen]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const value = useContext(UIContext);
  if (!value) throw new Error("useUI must be used inside UIProvider");
  return value;
}
