
import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Calculator, Loader2 } from "lucide-react";
import GenericPage from "./GenericPage";
import { getResource } from "../services/resourceService";

interface Closure { id: string; dailySalesId?: string; expectedCash?: string | number; actualCash?: string | number; excessShortage?: string | number; status?: string }

export default function CashClosure() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getResource<Closure[]>("/cash-closure")
      .then(setClosures)
      .catch((err) => setError(err?.response?.data?.message || "Unable to load cash closure data."))
      .finally(() => setLoading(false));
  }, []);

  const latest = closures[0];
  const expected = Number(latest?.expectedCash ?? 0);
  const actual = Number(latest?.actualCash ?? 0);
  const difference = latest?.excessShortage !== undefined ? Number(latest.excessShortage) : actual - expected;

  return <GenericPage title="Cash Closure" subtitle="Review expected cash, actual cash and close the business day." action="Close Day">
    {loading ? <div className="card grid min-h-40 place-items-center"><Loader2 className="animate-spin text-brand-600"/></div> : error ? <div className="card p-5 text-sm text-red-600">{error}</div> : <>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5"><p className="text-xs text-slate-500">Expected Cash</p><p className="mt-2 text-2xl font-extrabold">₹{expected.toLocaleString("en-IN")}</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 size={14}/> Calculated</span></div>
        <div className="card p-5"><p className="text-xs text-slate-500">Actual Cash</p><input className="input mt-2 text-xl font-bold" defaultValue={actual}/></div>
        <div className={`card p-5 ${difference === 0 ? "bg-emerald-50" : "bg-red-50"}`}><p className={`text-xs ${difference === 0 ? "text-emerald-600" : "text-red-600"}`}>Excess / Shortage</p><p className={`mt-2 text-2xl font-extrabold ${difference === 0 ? "text-emerald-600" : "text-red-600"}`}>₹{difference.toLocaleString("en-IN")}</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><Calculator size={14}/> {difference === 0 ? "Balanced" : "Review required"}</span></div>
      </div>
      <div className="card mt-5 overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-bold">Closure Records</h2><p className="mt-1 text-xs text-slate-400">Current records returned by the cash-closure API.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="bg-slate-50 text-xs text-slate-400"><tr><th className="px-5 py-3 text-left">ID</th><th>Expected</th><th>Actual</th><th>Difference</th><th>Status</th></tr></thead><tbody>{closures.map((row) => <tr className="border-t border-slate-100" key={row.id}><td className="px-5 py-4 font-medium">{row.id}</td><td>₹{Number(row.expectedCash ?? 0).toLocaleString("en-IN")}</td><td>₹{Number(row.actualCash ?? 0).toLocaleString("en-IN")}</td><td>₹{Number(row.excessShortage ?? 0).toLocaleString("en-IN")}</td><td><span className="badge bg-slate-100 text-slate-600">{row.status || "-"}</span></td></tr>)}{!closures.length && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No closure records found.</td></tr>}</tbody></table></div>
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700"><AlertTriangle size={16}/> Verify payment channels before closing the business day.</div>
    </>}
  </GenericPage>;
}
