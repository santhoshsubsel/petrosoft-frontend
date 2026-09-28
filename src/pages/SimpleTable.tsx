
import { useEffect, useMemo, useState } from "react";
import GenericPage from "./GenericPage";
import { getResource } from "../services/resourceService";
import { Loader2 } from "lucide-react";

interface Props {
  title: string;
  endpoint: string;
}

const text = (value: unknown): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    return String(item.name ?? item.code ?? item.id ?? "-");
  }
  return String(value);
};

export default function SimpleTable({ title, endpoint }: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getResource<unknown[]>(endpoint)
      .then((data) => {
        if (!active) return;
        setRows(Array.isArray(data) ? data.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || `Unable to load ${title.toLowerCase()}.`);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [endpoint, title]);

  const columns = useMemo(() => {
    if (!rows.length) return [];
    const preferred = ["name", "code", "productType", "currentPrice", "unit", "active", "amount", "quantity", "transactionType", "createdAt"];
    return preferred.filter((key) => rows.some((row) => key in row)).slice(0, 5);
  }, [rows]);

  return (
    <GenericPage title={title} action="Add New">
      <div className="card overflow-hidden">
        {loading ? (
          <div className="grid min-h-40 place-items-center text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /></div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-400">
                <tr>{columns.map((column) => <th key={column} className="px-5 py-3 text-left">{column.replace(/[A-Z]/g, (m) => ` ${m}`).toUpperCase()}</th>)}<th className="px-5 py-3 text-center">Action</th></tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((row, index) => (
                  <tr key={String(row.id ?? index)} className="border-t border-slate-100">
                    {columns.map((column) => (
                      <td key={column} className="px-5 py-4 font-medium">
                        {column === "active" ? (
                          <span className={`badge ${row[column] ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{row[column] ? "Active" : "Inactive"}</span>
                        ) : text(row[column])}
                      </td>
                    ))}
                    <td className="px-5 py-4 text-center"><button className="text-xs font-bold text-brand-600">View</button></td>
                  </tr>
                )) : (
                  <tr><td colSpan={columns.length + 1} className="px-5 py-10 text-center text-sm text-slate-400">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </GenericPage>
  );
}
