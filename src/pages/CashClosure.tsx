import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calculator, CheckCircle2, Eye, Loader2, LockKeyhole, X } from "lucide-react";
import { api } from "../services/api";

interface Closure {
  id: string;
  dailySalesId: string;
  startingCashBalance: string | number;
  cashSales: string | number;
  creditPaymentsReceived: string | number;
  paytmAmount: string | number;
  ccmsHpPayAmount: string | number;
  supplierBankAmount: string | number;
  otherPayments: string | number;
  expenses: string | number;
  expectedCash: string | number;
  actualCashEntered: string | number;
  difference: string | number;
  status: string;
  comments?: string | null;
  closedAt?: string | null;
  dailySales?: { name?: string; businessDate?: string; status?: string };
  closedByUser?: { name?: string } | null;
}
interface Daily { id: string; name?: string; businessDate: string; status: string; }
const money = (v: number | string | undefined) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CashClosure() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [dailySales, setDailySales] = useState<Daily[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selected, setSelected] = useState<Closure | null>(null);
  const [starting, setStarting] = useState("0");
  const [supplier, setSupplier] = useState("0");
  const [other, setOther] = useState("0");
  const [actual, setActual] = useState("");
  const [preview, setPreview] = useState<any>(null);

  const activeDay = useMemo(() => dailySales.find(d => d.status === "ACTIVE") ?? null, [dailySales]);
  const activeClosure = useMemo(() => activeDay ? closures.find(c => c.dailySalesId === activeDay.id) ?? null : null, [activeDay, closures]);

  async function load() {
    try {
      setError("");
      const [c, d] = await Promise.all([api.get("/cash-closure"), api.get("/daily-sales")]);
      setClosures(c.data.data ?? c.data ?? []);
      setDailySales(d.data.data ?? d.data ?? []);
    } catch (e: any) { setError(e?.response?.data?.message || "Unable to load cash closure."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function calculate() {
    if (!activeDay) return setError("No active business day. Open Daily Sales first.");
    try {
      const response = await api.get(`/cash-closure/preview/${activeDay.id}`, { params: { startingCashBalance: Number(starting || 0), supplierBankAmount: Number(supplier || 0), otherPayments: Number(other || 0) } });
      setPreview(response.data.data ?? response.data);
      if (!actual && response.data.data?.actualCashEntered) setActual(String(response.data.data.actualCashEntered));
    } catch (e: any) { setError(e?.response?.data?.message || "Unable to calculate cash closure."); }
  }
  useEffect(() => { if (activeDay) calculate(); }, [activeDay?.id]);
  useEffect(() => {
    if (!activeClosure) return;
    setStarting(String(activeClosure.startingCashBalance ?? 0));
    setSupplier(String(activeClosure.supplierBankAmount ?? 0));
    setOther(String(activeClosure.otherPayments ?? 0));
    setActual(String(activeClosure.actualCashEntered ?? ""));
  }, [activeClosure?.id]);

  function openRecord(row: Closure) { setSelected(row); setHistoryOpen(true); }

  async function ensureClosure() {
    if (!activeDay) throw new Error("Open an active business day first.");
    if (activeClosure) return activeClosure;
    const response = await api.post("/cash-closure", { dailySalesId: activeDay.id, startingCashBalance: Number(starting || 0), supplierBankAmount: Number(supplier || 0), otherPayments: Number(other || 0), actualCashEntered: Number(actual || 0), comments: "" });
    const created = response.data.data ?? response.data;
    setClosures((rows) => [created, ...rows]);
    return created as Closure;
  }

  async function closeDay() {
    setError("");
    if (!actual) return setError("Enter actual cash before closing the day.");
    setSaving(true);
    try {
      const closure = await ensureClosure();
      const response = await api.post(`/cash-closure/${closure.id}/close`, { actualCashEntered: Number(actual), comments: "" });
      const updated = response.data.data ?? response.data;
      setClosures(rows => rows.map(row => row.id === closure.id ? { ...row, ...updated } : row));
      await load();
      setSelected(updated);
      setHistoryOpen(true);
    } catch (e: any) { setError(e?.response?.data?.message || e?.message || "Unable to close the business day."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="grid min-h-72 place-items-center"><Loader2 className="animate-spin text-brand-600"/></div>;

  const expected = Number(activeClosure?.expectedCash ?? preview?.expectedCash ?? 0);
  const difference = actual === "" ? 0 : Number(actual) - expected;

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><span className="badge bg-amber-50 text-amber-700">MANAGER · CASH CLOSURE</span><h1 className="mt-2 text-2xl font-extrabold">Cash Closure</h1><p className="mt-1 text-sm text-slate-400">Reconcile the active business day and close it safely.</p></div><button className="btn-secondary" onClick={() => setHistoryOpen(true)}><Eye size={15}/> Closure Records</button></div>
    {error && <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"><span>{error}</span><button onClick={() => setError("")}><X size={16}/></button></div>}

    {!activeDay ? <div className="card p-8 text-center"><AlertTriangle className="mx-auto text-amber-500"/><h2 className="mt-3 font-bold">No active business day</h2><p className="mt-1 text-sm text-slate-400">Open a Daily Sales business day before starting cash closure.</p></div> : <>
      <div className="card p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs text-slate-400">Active Business Day</p><h2 className="mt-1 font-extrabold">{activeDay.name || "Daily Sales"}</h2></div><span className="badge bg-emerald-50 text-emerald-600">{new Date(activeDay.businessDate).toLocaleDateString("en-IN")}</span></div></div>
      <div className="grid gap-4 md:grid-cols-3"><div className="card p-5"><p className="text-xs text-slate-500">Cash Sales</p><p className="mt-2 text-2xl font-extrabold">{money(preview?.cashSales ?? activeClosure?.cashSales)}</p><p className="mt-1 text-xs text-slate-400">Petrol cash + oil cash</p></div><div className="card p-5"><p className="text-xs text-slate-500">Credit Payments Received</p><p className="mt-2 text-2xl font-extrabold">{money(preview?.creditPaymentsReceived ?? activeClosure?.creditPaymentsReceived)}</p><p className="mt-1 text-xs text-slate-400">Customer receipts for this day</p></div><div className="card p-5"><p className="text-xs text-slate-500">Expenses</p><p className="mt-2 text-2xl font-extrabold">{money(preview?.expenses ?? activeClosure?.expenses)}</p><p className="mt-1 text-xs text-slate-400">Active day expenses</p></div></div>
      <section className="card p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold">Closure Calculation</h2><p className="mt-1 text-xs text-slate-400">Server calculates expected cash from the recorded transactions.</p></div><Calculator className="text-brand-600" size={20}/></div><div className="mt-5 grid gap-4 md:grid-cols-4"><label><span className="mb-2 block text-xs font-bold text-slate-600">Starting Cash</span><input className="input" type="number" min="0" step="0.01" value={starting} onChange={e => setStarting(e.target.value)} onBlur={calculate}/></label><label><span className="mb-2 block text-xs font-bold text-slate-600">Supplier Bank Payment</span><input className="input" type="number" min="0" step="0.01" value={supplier} onChange={e => setSupplier(e.target.value)} onBlur={calculate}/></label><label><span className="mb-2 block text-xs font-bold text-slate-600">Other Payments</span><input className="input" type="number" min="0" step="0.01" value={other} onChange={e => setOther(e.target.value)} onBlur={calculate}/></label><label><span className="mb-2 block text-xs font-bold text-slate-600">Actual Cash</span><input className="input text-lg font-bold" type="number" min="0" step="0.01" value={actual} onChange={e => setActual(e.target.value)}/></label></div><div className="mt-6 grid gap-4 md:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs text-slate-500">Expected Cash</p><p className="mt-1 text-2xl font-extrabold">{money(expected)}</p></div><div className={`rounded-2xl p-5 ${difference === 0 ? "bg-emerald-50" : "bg-amber-50"}`}><p className="text-xs text-slate-500">Difference</p><p className={`mt-1 text-2xl font-extrabold ${difference === 0 ? "text-emerald-700" : "text-amber-700"}`}>{money(difference)}</p></div><div className="rounded-2xl bg-blue-50 p-5"><p className="text-xs text-brand-700">Status</p><p className="mt-1 text-2xl font-extrabold text-brand-700">{activeClosure?.status || "DRAFT"}</p></div></div><div className="mt-5 flex justify-end"><button className="btn-primary" disabled={saving || activeClosure?.status === "CLOSED"} onClick={closeDay}>{saving ? <Loader2 size={15} className="animate-spin"/> : <LockKeyhole size={15}/>} {saving ? "Closing..." : activeClosure?.status === "CLOSED" ? "Day Closed" : "Close Business Day"}</button></div></section>
    </>}

    {historyOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"><div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-extrabold">Closure Records</h2><p className="mt-1 text-xs text-slate-400">Open a record to review the full reconciliation.</p></div><button onClick={() => { setHistoryOpen(false); setSelected(null); }} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div><div className="max-h-[calc(88vh-80px)] overflow-y-auto p-5">{selected ? <div><button className="btn-secondary mb-5" onClick={() => setSelected(null)}>Back to Records</button><div className="grid gap-4 sm:grid-cols-3">{[["Expected Cash", selected.expectedCash],["Actual Cash",selected.actualCashEntered],["Difference",selected.difference],["Cash Sales",selected.cashSales],["Credit Payments",selected.creditPaymentsReceived],["Expenses",selected.expenses],["Paytm",selected.paytmAmount],["CCMS / HP Pay",selected.ccmsHpPayAmount],["Supplier Bank",selected.supplierBankAmount]].map(([label,value])=><div key={String(label)} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-extrabold">{money(value as any)}</p></div>)}</div><div className="mt-5 rounded-2xl border border-slate-100 p-5 text-sm"><p><b>Business Day:</b> {selected.dailySales?.name || selected.dailySalesId}</p><p className="mt-2"><b>Status:</b> {selected.status}</p><p className="mt-2"><b>Closed By:</b> {selected.closedByUser?.name || "-"}</p><p className="mt-2"><b>Closed At:</b> {selected.closedAt ? new Date(selected.closedAt).toLocaleString("en-IN") : "-"}</p></div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-xs text-slate-400"><tr><th className="px-4 py-3 text-left">DAY</th><th className="px-4 py-3 text-left">DATE</th><th className="px-4 py-3 text-right">EXPECTED</th><th className="px-4 py-3 text-right">ACTUAL</th><th className="px-4 py-3 text-right">DIFF</th><th className="px-4 py-3 text-left">STATUS</th><th className="px-4 py-3 text-right">ACTION</th></tr></thead><tbody>{closures.map(row => <tr key={row.id} className="border-t border-slate-100"><td className="px-4 py-4 font-bold">{row.dailySales?.name || row.dailySalesId}</td><td className="px-4 py-4 text-slate-500">{row.dailySales?.businessDate ? new Date(row.dailySales.businessDate).toLocaleDateString("en-IN") : "-"}</td><td className="px-4 py-4 text-right">{money(row.expectedCash)}</td><td className="px-4 py-4 text-right">{money(row.actualCashEntered)}</td><td className="px-4 py-4 text-right font-bold">{money(row.difference)}</td><td className="px-4 py-4"><span className="badge bg-slate-100 text-slate-600">{row.status}</span></td><td className="px-4 py-4 text-right"><button className="btn-secondary px-3 py-2 text-xs" onClick={() => openRecord(row)}><Eye size={14}/> Details</button></td></tr>)}{!closures.length && <tr><td colSpan={7} className="p-10 text-center text-slate-400">No closure records found.</td></tr>}</tbody></table></div>}</div></div></div>}
  </div>;
}
