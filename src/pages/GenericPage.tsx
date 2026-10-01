
import type { ReactNode } from "react";
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
  showDefaultFilters = true,
}: GenericPageProps) {
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
      {filterContent && (
        <div className="card p-4">
          {filterContent}
        </div>
      )}

      {/* Default Search / Filter / Export */}
      {showDefaultFilters && !filterContent && (
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
              />
            </div>

            <button
              type="button"
              className="btn-secondary"
            >
              <Filter size={15} />
              Filter
            </button>

            <button
              type="button"
              className="btn-secondary"
            >
              <Download size={15} />
              Export
            </button>
          </div>
        </div>
      )}

      {/* Page Content */}
      {children}
    </div>
  );
}

