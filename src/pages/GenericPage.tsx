
import { useRef, useState, type ReactNode } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
} from "lucide-react";

interface GenericPageProps {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  children?: ReactNode;

  // Optional custom filter section
  filterContent?: ReactNode;

  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onExport?: () => void;
  exportData?: { headers: string[]; rows: (string | number)[][] };

  // Show default Search / Filter / Export section
  showDefaultFilters?: boolean;
}

export default function GenericPage({
  title,
  subtitle,
  action = "Add New",
  onAction,
  children,
  filterContent,
  searchValue = "",
  onSearchChange,
  onExport,
  exportData,
  showDefaultFilters = true,
}: GenericPageProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const exportTable = () => {
    if (onExport) {
      onExport();
      return;
    }

    const table = contentRef.current?.querySelector("table");
    const records = exportData
      ? [exportData.headers, ...exportData.rows]
      : table
        ? Array.from(table.querySelectorAll("tr")).map((row) =>
            Array.from(row.querySelectorAll("th, td")).map((cell) => cell.textContent ?? "")
          )
        : [];
    if (!records.length) return;

    const csv = records
      .map((row) => row.map((cell) => `"${String(cell).trim().replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "export"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pt-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {title}
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle ||
              "Manage PetroSoft business operations from one place."}
          </p>
        </div>

        {action && (
          <button
            type="button"
            onClick={onAction}
            className="btn-primary"
          >
            <Plus size={16} />
            {action}
          </button>
        )}
      </div>

      {/* Custom Filter Content */}
      {/* Default Search / Filter / Export */}
      {showDefaultFilters && (
        <div className="card p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3">
              <Search
                size={16}
                className="text-slate-400"
              />

              <input
                className="w-full bg-transparent py-2.5 text-sm outline-none"
                placeholder="Search..."
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                disabled={!onSearchChange}
                aria-label={`Search ${title}`}
              />
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setFiltersOpen((open) => !open)}
              disabled={!filterContent}
              aria-expanded={filtersOpen}
            >
              <Filter size={15} />
              {filtersOpen ? "Hide Filters" : "Filter"}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={exportTable}
            >
              <Download size={15} />
              Export
            </button>
          </div>
          {filterContent && filtersOpen && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              {filterContent}
            </div>
          )}
        </div>
      )}

      {/* Page Content */}
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

