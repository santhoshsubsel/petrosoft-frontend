
import { useState } from "react";
import {
  BarChart3,
  FileDown,
  Loader2,
} from "lucide-react";

import GenericPage from "./GenericPage";
import { getResource } from "../services/resourceService";

const reports = [
  {
    name: "Daily Sales Report",
    endpoint: "/reports/daily-sales",
  },
  {
    name: "Oil Sales Report",
    endpoint: "/reports/oil-sales",
  },
  {
    name: "Product Sales Report",
    endpoint: "/reports/product-sales",
  },
  {
    name: "Expenses Report",
    endpoint: "/reports/expenses",
  },
  {
    name: "Credit Sales Report",
    endpoint: "/reports/credit-sales",
  },
];

export default function Reports() {
  const [reportType, setReportType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const runReport = async () => {
    setMessage("");

    if (!reportType) {
      setMessage("Please select a report.");
      return;
    }

    if (!startDate || !endDate) {
      setMessage(
        "Please select both start date and end date."
      );
      return;
    }

    if (startDate > endDate) {
      setMessage(
        "Start date cannot be greater than end date."
      );
      return;
    }

    const selectedReport = reports.find(
      (report) => report.endpoint === reportType
    );

    if (!selectedReport) {
      setMessage("Invalid report selected.");
      return;
    }

    setLoading(true);

    try {
      const query = new URLSearchParams({
        startDate,
        endDate,
      });

      const data = await getResource<unknown>(
        `${selectedReport.endpoint}?${query.toString()}`
      );

      const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        {
          type: "application/json",
        }
      );

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = url;

      anchor.download =
        `${selectedReport.name
          .toLowerCase()
          .replaceAll(" ", "-")}` +
        `-${startDate}-to-${endDate}.json`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(url);

      setMessage(
        "Report generated successfully."
      );
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Unable to generate report."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <GenericPage
      title="Reports"
      subtitle="Generate business reports for a selected date range."
      action=""
      showDefaultFilters={false}
      filterContent={
        <div className="space-y-5">
          {/* Filter Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-brand-600">
              <BarChart3 size={20} />
            </div>

            <div>
              <h3 className="font-bold text-slate-800">
                Generate Report
              </h3>

              <p className="text-xs text-slate-400">
                Select a report and date range.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid gap-5 md:grid-cols-3">
            {/* Report Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Report Type
              </label>

              <select
                value={reportType}
                onChange={(e) =>
                  setReportType(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
              >
                <option value="">
                  Select Report
                </option>

                {reports.map((report) => (
                  <option
                    key={report.endpoint}
                    value={report.endpoint}
                  >
                    {report.name}
                  </option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                From Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                To Date
              </label>

              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-xl border p-3 text-sm ${
                message.includes("successfully")
                  ? "border-green-100 bg-green-50 text-green-600"
                  : "border-red-100 bg-red-50 text-red-600"
              }`}
            >
              {message}
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={runReport}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown size={15} />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      {/* Report result/content can come here later */}
    </GenericPage>
  );
}

