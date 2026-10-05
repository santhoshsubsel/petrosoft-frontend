import { useState } from "react";
import { BarChart3, FileDown, Loader2, X, Calendar } from "lucide-react";
import { api } from "../services/api";

const reports = [
  { value: "/reports/sales", label: "Daily Sales" },
  { value: "/reports/oil-sales", label: "Oil Sales" },
  { value: "/reports/product-sales", label: "Product Sales" },
  { value: "/reports/expenses", label: "Expenses" },
  { value: "/reports/credit-sales", label: "Credit Sales" },
];

const periodTypes = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom Range" },
];

export default function Reports() {
  const [reportType, setReportType] = useState("");
  const [periodType, setPeriodType] = useState("custom");
  const [date, setDate] = useState("");           // for Daily
  const [week, setWeek] = useState("");           // for Weekly (YYYY-Www)
  const [month, setMonth] = useState("");         // for Monthly (YYYY-MM)
  const [year, setYear] = useState("");           // for Yearly
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Helper: convert period → from/to
  function getDateRange(): { from?: string; to?: string; date?: string } {
    if (periodType === "daily") {
      return { date };
    }

    if (periodType === "weekly" && week) {
      // week format: 2026-W40
      const [yearStr, weekStr] = week.split("-W");
      const yearNum = Number(yearStr);
      const weekNum = Number(weekStr);

      // Simple ISO week calculation
      const simple = new Date(yearNum, 0, 1 + (weekNum - 1) * 7);
      const dayOfWeek = simple.getDay();
      const ISOweekStart = new Date(simple);
      ISOweekStart.setDate(simple.getDate() - dayOfWeek + 1);
      const ISOweekEnd = new Date(ISOweekStart);
      ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

      return {
        from: ISOweekStart.toISOString().slice(0, 10),
        to: ISOweekEnd.toISOString().slice(0, 10),
      };
    }

    if (periodType === "monthly" && month) {
      const [y, m] = month.split("-").map(Number);
      const fromDate = `${y}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const toDate = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;
      return { from: fromDate, to: toDate };
    }

    if (periodType === "yearly" && year) {
      return {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
      };
    }

    // custom
    return { from, to };
  }

  async function generate() {
    setMessage("");

    if (!reportType) {
      return setMessage("Please select a report type.");
    }

    // Validation based on period
    if (periodType === "daily" && !date) {
      return setMessage("Please select a date.");
    }
    if (periodType === "weekly" && !week) {
      return setMessage("Please select a week.");
    }
    if (periodType === "monthly" && !month) {
      return setMessage("Please select a month.");
    }
    if (periodType === "yearly" && !year) {
      return setMessage("Please select a year.");
    }
    if (periodType === "custom") {
      if (!from || !to) return setMessage("Please select From and To dates.");
      if (from > to) return setMessage("From date cannot be after To date.");
    }

    setLoading(true);

    try {
      const range = getDateRange();

      const response = await api.get(reportType, {
        params: {
          ...range,
          format: "pdf",
        },
        responseType: "blob",
      });

      const label =
        reports.find((r) => r.value === reportType)?.label || "report";

      let filenameSuffix = "";
      if (periodType === "daily") filenameSuffix = date;
      else if (periodType === "weekly") filenameSuffix = week;
      else if (periodType === "monthly") filenameSuffix = month;
      else if (periodType === "yearly") filenameSuffix = year;
      else filenameSuffix = `${from}-to-${to}`;

      const url = URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      const a = document.createElement("a");
      a.href = url;
      a.download = `petrosoft-${label
        .toLowerCase()
        .replaceAll(" ", "-")}-${filenameSuffix}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setMessage("Report generated successfully.");
    } catch (e: any) {
      // blob error handling
      if (e?.response?.data instanceof Blob) {
        const text = await e.response.data.text();
        try {
          const json = JSON.parse(text);
          setMessage(json.message || "Unable to generate report.");
        } catch {
          setMessage("Unable to generate report.");
        }
      } else {
        setMessage(e?.response?.data?.message || "Unable to generate report.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 pt-10">
      {/* Header */}
      <div>
        <span className="badge bg-blue-50 text-brand-600">ADMIN · REPORTS</span>
        <h1 className="mt-2 text-2xl font-extrabold">Reports</h1>
        <p className="mt-1 text-sm text-slate-400">
          Choose report type and period. PDF will be generated securely from backend.
        </p>
      </div>

      <section className="card p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-brand-600">
            <BarChart3 size={20} />
          </span>
          <div>
            <h2 className="font-bold">Generate Report</h2>
            <p className="text-xs text-slate-400">
              Backend applies the exact business date filter.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Report Type */}
          <label className="md:col-span-2 lg:col-span-1">
            <span className="mb-2 block text-xs font-bold text-slate-600">
              Report
            </span>
            <select
              className="input"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="">Select Report</option>
              {reports.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          {/* Period Type */}
          <label>
            <span className="mb-2 block text-xs font-bold text-slate-600">
              Period Type
            </span>
            <select
              className="input"
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
            >
              {periodTypes.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          {/* Dynamic Date Inputs */}
          {periodType === "daily" && (
            <label>
              <span className="mb-2 block text-xs font-bold text-slate-600">
                Date
              </span>
              <input
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          )}

          {periodType === "weekly" && (
            <label>
              <span className="mb-2 block text-xs font-bold text-slate-600">
                Week
              </span>
              <input
                className="input"
                type="week"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
              />
            </label>
          )}

          {periodType === "monthly" && (
            <label>
              <span className="mb-2 block text-xs font-bold text-slate-600">
                Month
              </span>
              <input
                className="input"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
          )}

          {periodType === "yearly" && (
            <label>
              <span className="mb-2 block text-xs font-bold text-slate-600">
                Year
              </span>
              <input
                className="input"
                type="number"
                min="2020"
                max="2035"
                placeholder="2026"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </label>
          )}

          {periodType === "custom" && (
            <>
              <label>
                <span className="mb-2 block text-xs font-bold text-slate-600">
                  From Date
                </span>
                <input
                  className="input"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold text-slate-600">
                  To Date
                </span>
                <input
                  className="input"
                  type="date"
                  min={from || undefined}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
            </>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mt-5 flex items-center justify-between rounded-xl border p-3 text-sm ${
              message.includes("successfully")
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-red-100 bg-red-50 text-red-600"
            }`}
          >
            <span>{message}</span>
            <button onClick={() => setMessage("")}>
              <X size={15} />
            </button>
          </div>
        )}

        {/* Generate Button */}
        <div className="mt-6 flex justify-end">
          <button
            className="btn-primary"
            disabled={loading}
            onClick={generate}
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileDown size={15} />
            )}
            {loading ? "Generating..." : "Generate PDF Report"}
          </button>
        </div>
      </section>
    </div>
  );
}