import { useState } from "react";
import { BarChart3, FileDown, Loader2, X } from "lucide-react";
import { api } from "../services/api";

const reports = [
  { value: "/reports/sales", label: "Daily Sales" },
  { value: "/reports/oil-sales", label: "Oil Sales" },
  { value: "/reports/product-sales", label: "Product Sales" },
  { value: "/reports/expenses", label: "Expenses" },
  { value: "/reports/credit-sales", label: "Credit Sales" },
];

export default function Reports() {
  const [reportType, setReportType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function generate() {
    setMessage("");
    if (!reportType || !from || !to) return setMessage("Select report, from date and to date.");
    if (from > to) return setMessage("From date cannot be after to date.");
    setLoading(true);
    try {
      const response = await api.get(reportType, { params: { from, to } });
      const payload = response.data.data ?? response.data;
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const label = reports.find(r => r.value === reportType)?.label || "report";
      a.href = url;
      a.download = `petrosoft-${label.toLowerCase().replaceAll(" ", "-")}-${from}-to-${to}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage("Report generated successfully.");
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Unable to generate report.");
    } finally { setLoading(false); }
  }

  return <div className="space-y-5">
    <div><span className="badge bg-blue-50 text-brand-600">ADMIN · REPORTS</span><h1 className="mt-2 text-2xl font-extrabold">Reports</h1><p className="mt-1 text-sm text-slate-400">Choose a report and filter the exact business date range.</p></div>
    <section className="card p-6">
      <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-brand-600"><BarChart3 size={20}/></span><div><h2 className="font-bold">Generate Report</h2><p className="text-xs text-slate-400">The backend applies the date filter to the selected report.</p></div></div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label><span className="mb-2 block text-xs font-bold text-slate-600">Report</span><select className="input" value={reportType} onChange={e => setReportType(e.target.value)}><option value="">Select Report</option>{reports.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
        <label><span className="mb-2 block text-xs font-bold text-slate-600">From Date</span><input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)}/></label>
        <label><span className="mb-2 block text-xs font-bold text-slate-600">To Date</span><input className="input" type="date" min={from || undefined} value={to} onChange={e => setTo(e.target.value)}/></label>
      </div>
      {message && <div className={`mt-5 flex items-center justify-between rounded-xl border p-3 text-sm ${message.includes("successfully") ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-600"}`}><span>{message}</span><button onClick={() => setMessage("")}><X size={15}/></button></div>}
      <div className="mt-6 flex justify-end"><button className="btn-primary" disabled={loading} onClick={generate}>{loading ? <Loader2 size={15} className="animate-spin"/> : <FileDown size={15}/>} {loading ? "Generating..." : "Generate Report"}</button></div>
    </section>
  </div>;
}
