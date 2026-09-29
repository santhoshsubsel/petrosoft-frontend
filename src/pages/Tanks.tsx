import { useEffect, useMemo, useState } from "react";
import GenericPage from "./GenericPage";
import { getTanks, addTankStock } from "../services/tankService";
import type { Tank } from "../services/tankService";
import { getResource } from "../services/resourceService";
import {
  History,
  Loader2,
  MoreVertical,
  Plus,
  X,
} from "lucide-react";

interface StockHistoryItem {
  id: string;
  transactionType?: string;
  type?: string;
  quantity: number | string;
  beforeStock: number | string;
  afterStock: number | string;
  createdAt: string;
}

const HISTORY_PER_PAGE = 10;

/* -------------------------------------------------------------------------- */
/* Tank Liquid                                                                 */
/* -------------------------------------------------------------------------- */

function TankLiquid({ percent }: { percent: number }) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLevel(percent);
    }, 60);

    return () => clearTimeout(timer);
  }, [percent]);

  const visibleLevel = level > 0 ? Math.max(level, 6) : 0;

  return (
    <div className="relative h-20 w-12 shrink-0 overflow-hidden rounded-lg border-2 border-slate-200 bg-white">
      <div
        className="tank-liquid absolute bottom-0 left-0 right-0"
        style={{
          height: `${visibleLevel}%`,
          opacity: level > 0 ? 1 : 0,
        }}
      >
        <svg
          className="tank-wave-b absolute -top-2 left-0 h-3 w-[200%] text-emerald-300"
          viewBox="0 0 120 12"
          preserveAspectRatio="none"
        >
          <path
            d="M0 6 Q15 0 30 6 T60 6 T90 6 T120 6 V12 H0 Z"
            fill="currentColor"
          />
        </svg>

        <svg
          className="tank-wave-a absolute -top-1.5 left-0 h-3 w-[200%] text-emerald-400"
          viewBox="0 0 120 12"
          preserveAspectRatio="none"
        >
          <path
            d="M0 6 Q15 0 30 6 T60 6 T90 6 T120 6 V12 H0 Z"
            fill="currentColor"
          />
        </svg>

        <div className="absolute inset-0 bg-gradient-to-b from-emerald-400 to-emerald-500" />

        <span
          className="tank-bubble absolute bottom-1 left-[28%] h-1.5 w-1.5 rounded-full bg-white/70"
          style={{ animationDelay: "0s" }}
        />

        <span
          className="tank-bubble absolute bottom-1 left-[62%] h-1 w-1 rounded-full bg-white/70"
          style={{ animationDelay: "1.1s" }}
        />
      </div>

      <div className="pointer-events-none absolute inset-y-1 left-1 w-1 rounded-full bg-white/50" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatNumber(value: number | string | null | undefined) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return {
    date: date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                              */
/* -------------------------------------------------------------------------- */

export default function Tanks() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Add Stock */
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedTankId, setSelectedTankId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [stockError, setStockError] = useState("");

  /* Three-dot menu */
  const [menuTankId, setMenuTankId] = useState<string | null>(null);

  /* Stock History */
  const [showHistory, setShowHistory] = useState(false);
  const [historyTank, setHistoryTank] = useState<Tank | null>(null);
  const [history, setHistory] = useState<StockHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);

  /* ------------------------------------------------------------------------ */
  /* Load Tanks                                                               */
  /* ------------------------------------------------------------------------ */

  const loadTanks = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const data = await getTanks();

      setTanks(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to load tanks."
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadTanks();
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Add Stock                                                                */
  /* ------------------------------------------------------------------------ */

  const openAddStock = () => {
    setSelectedTankId("");
    setQuantity("");
    setStockError("");
    setMenuTankId(null);
    setShowAddStock(true);
  };

  const openAddStockForTank = (tank: Tank) => {
    setSelectedTankId(tank.id);
    setQuantity("");
    setStockError("");
    setMenuTankId(null);
    setShowAddStock(true);
  };

  const closeAddStock = () => {
    if (saving) return;

    setShowAddStock(false);
    setSelectedTankId("");
    setQuantity("");
    setStockError("");
  };

  const selectedTank =
    tanks.find((tank) => tank.id === selectedTankId) ?? null;

  const handleAddStock = async () => {
    if (!selectedTank) {
      setStockError("Please select a tank.");
      return;
    }

    const qty = Number(quantity);

    if (!quantity || !Number.isFinite(qty) || qty <= 0) {
      setStockError("Please enter a valid stock quantity.");
      return;
    }

    const currentStock = Number(
      selectedTank.availableStock
    );

    const capacity = Number(selectedTank.capacity);

    if (currentStock + qty > capacity) {
      setStockError(
        `Stock cannot exceed tank capacity of ${formatNumber(
          capacity
        )}.`
      );
      return;
    }

    try {
      setSaving(true);
      setStockError("");

      await addTankStock(selectedTank.id, {
        quantity: qty,
      });

      closeAddStock();

      // Refresh tank cards without showing the full-page loader.
      await loadTanks(true);
    } catch (err: any) {
      setStockError(
        err?.response?.data?.message ||
          "Unable to add stock."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Stock History                                                            */
  /* ------------------------------------------------------------------------ */

  const openStockHistory = async (tank: Tank) => {
    setMenuTankId(null);

    setHistoryTank(tank);
    setHistory([]);
    setHistoryPage(1);
    setHistoryError("");
    setShowHistory(true);
    setHistoryLoading(true);

    try {
      /*
       * Backend:
       * GET /api/v1/tanks/:id/stock-history
       *
       * getResource() already uses the configured API base URL.
       */
      const data = await getResource<unknown[]>(
        `/tanks/${tank.id}/stock-history`
      );

      const validRows: StockHistoryItem[] = Array.isArray(data)
        ? data.filter(
            (
              item
            ): item is StockHistoryItem =>
              Boolean(
                item &&
                  typeof item === "object" &&
                  "id" in item &&
                  "quantity" in item &&
                  "beforeStock" in item &&
                  "afterStock" in item
              )
          )
        : [];

      const sorted = [...validRows].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setHistory(sorted);
    } catch (err: any) {
      setHistoryError(
        err?.response?.data?.message ||
          "Unable to load stock history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeStockHistory = () => {
    if (historyLoading) return;

    setShowHistory(false);
    setHistoryTank(null);
    setHistory([]);
    setHistoryPage(1);
    setHistoryError("");
  };

  /* ------------------------------------------------------------------------ */
  /* History Pagination                                                       */
  /* ------------------------------------------------------------------------ */

  const historyTotalPages = Math.max(
    1,
    Math.ceil(history.length / HISTORY_PER_PAGE)
  );

  const historyStartIndex =
    (historyPage - 1) * HISTORY_PER_PAGE;

  const paginatedHistory = useMemo(
    () =>
      history.slice(
        historyStartIndex,
        historyStartIndex + HISTORY_PER_PAGE
      ),
    [history, historyStartIndex]
  );

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Tank Animation Styles                                             */}
      {/* ------------------------------------------------------------------ */}

      <style>{`
        .tank-liquid {
          transition:
            height 1.6s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.4s ease;
        }

        @keyframes tank-wave {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        @keyframes tank-bubble {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }

          20% {
            opacity: 0.9;
          }

          100% {
            transform: translateY(-36px) scale(0.6);
            opacity: 0;
          }
        }

        .tank-wave-a {
          animation: tank-wave 2.2s linear infinite;
        }

        .tank-wave-b {
          animation: tank-wave 3.4s linear infinite reverse;
        }

        .tank-bubble {
          animation: tank-bubble 2.6s ease-in infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .tank-liquid {
            transition: none;
          }

          .tank-wave-a,
          .tank-wave-b,
          .tank-bubble {
            animation: none;
          }
        }
      `}</style>

      {/* ------------------------------------------------------------------ */}
      {/* Main Tank Page                                                     */}
      {/* ------------------------------------------------------------------ */}

      <GenericPage
        title="Tank Management"
        subtitle="Monitor tank capacity, minimum level and available stock."
        action="Add Stock"
        onAction={openAddStock}
      >
        {loading ? (
          <div className="card grid min-h-40 place-items-center">
            <Loader2
              className="animate-spin text-brand-600"
              size={22}
            />
          </div>
        ) : error ? (
          <div className="card p-5 text-sm text-red-600">
            {error}
          </div>
        ) : tanks.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500">
            No tanks found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tanks.map((tank) => {
              const capacity = Number(tank.capacity);

              const available = Number(
                tank.availableStock
              );

              const percent =
                capacity > 0
                  ? Math.min(
                      100,
                      Math.max(
                        0,
                        (available / capacity) * 100
                      )
                    )
                  : 0;

              return (
                <div
                  className="card p-5"
                  key={tank.id}
                >
                  {/* ------------------------------------------------------ */}
                  {/* Card Header                                             */}
                  {/* ------------------------------------------------------ */}

                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <span className="badge bg-emerald-50 text-emerald-600">
                        {tank.product?.name || "Product"}
                      </span>

                      <h3 className="mt-2 truncate font-bold text-slate-900">
                        {tank.name}
                      </h3>
                    </div>

                    {/* Three Dot Menu */}
                    <div className="relative ml-3 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setMenuTankId(
                            menuTankId === tank.id
                              ? null
                              : tank.id
                          )
                        }
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`Actions for ${tank.name}`}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {menuTankId === tank.id && (
                        <div className="absolute right-0 top-10 z-30 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl">
                          <button
                            type="button"
                            onClick={() =>
                              openStockHistory(tank)
                            }
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <History size={16} />
                            Stock History
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openAddStockForTank(tank)
                            }
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Plus size={16} />
                            Add Stock
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tank Level */}
                    <div className="ml-2">
                      <TankLiquid percent={percent} />
                    </div>
                  </div>

                  {/* ------------------------------------------------------ */}
                  {/* Tank Information                                       */}
                  {/* ------------------------------------------------------ */}

                  <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400">
                        Capacity
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {formatNumber(capacity)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">
                        Min Capacity
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {formatNumber(
                          tank.minCapacity
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">
                        Available
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {formatNumber(available)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">
                        Fuel %
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Low Stock Indicator */}
                  {available <=
                    Number(tank.minCapacity) && (
                    <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-600">
                      Stock is below minimum capacity.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GenericPage>

      {/* ================================================================== */}
      {/* Add Stock Modal                                                    */}
      {/* ================================================================== */}

      {showAddStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add Stock
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select a tank and enter stock quantity.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddStock}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-6 py-5">
              {/* Tank */}
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tank
                </label>

                <select
                  value={selectedTankId}
                  onChange={(e) => {
                    setSelectedTankId(e.target.value);
                    setQuantity("");
                    setStockError("");
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500"
                >
                  <option value="">
                    Select Tank
                  </option>

                  {tanks
                    .filter((tank) => tank.active)
                    .map((tank) => (
                      <option
                        key={tank.id}
                        value={tank.id}
                      >
                        {tank.name} -{" "}
                        {tank.product?.name ||
                          "Product"}
                      </option>
                    ))}
                </select>
              </div>

              {/* Current Stock / Capacity */}
              {selectedTank && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Current Stock
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {formatNumber(
                        selectedTank.availableStock
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Capacity
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {formatNumber(
                        selectedTank.capacity
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Stock Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setStockError("");
                  }}
                  placeholder="Enter stock quantity"
                  disabled={!selectedTank}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                {selectedTank && (
                  <p className="mt-1 text-xs text-slate-400">
                    Maximum available space:{" "}
                    {formatNumber(
                      Number(
                        selectedTank.capacity
                      ) -
                        Number(
                          selectedTank.availableStock
                        )
                    )}
                  </p>
                )}
              </div>

              {/* Error */}
              {stockError && (
                <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
                  {stockError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={closeAddStock}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddStock}
                disabled={
                  saving || !selectedTank
                }
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                {saving ? "Adding..." : "Add Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Stock History Modal                                                */}
      {/* ================================================================== */}

      {showHistory && historyTank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Stock History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {historyTank.name} ·{" "}
                  {historyTank.product?.name ||
                    "Product"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeStockHistory}
                disabled={historyLoading}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {historyLoading ? (
                <div className="grid min-h-48 place-items-center">
                  <Loader2
                    size={24}
                    className="animate-spin text-brand-600"
                  />
                </div>
              ) : historyError ? (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                  {historyError}
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center">
                  <History
                    size={30}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-medium text-slate-500">
                    No stock history found.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Stock movements will appear here
                    after stock is added.
                  </p>
                </div>
              ) : (
                <>
                  {/* History Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-400">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            DATE & TIME
                          </th>

                          <th className="px-4 py-3 text-left">
                            TYPE
                          </th>

                          <th className="px-4 py-3 text-right">
                            QUANTITY
                          </th>

                          <th className="px-4 py-3 text-right">
                            BEFORE STOCK
                          </th>

                          <th className="px-4 py-3 text-right">
                            AFTER STOCK
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedHistory.map(
                          (item) => {
                            const dateTime =
                              formatDateTime(
                                item.createdAt
                              );

                            const transactionType =
                              item.transactionType ||
                              item.type ||
                              "STOCK_IN";

                            return (
                              <tr
                                key={item.id}
                                className="border-t border-slate-100 transition hover:bg-slate-50/50"
                              >
                                {/* Date */}
                                <td className="px-4 py-4">
                                  <div className="font-medium text-slate-700">
                                    {dateTime.date}
                                  </div>

                                  <div className="mt-0.5 text-xs text-slate-400">
                                    {dateTime.time}
                                  </div>
                                </td>

                                {/* Type */}
                                <td className="px-4 py-4">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                      transactionType ===
                                      "STOCK_IN"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {transactionType.replace(
                                      /_/g,
                                      " "
                                    )}
                                  </span>
                                </td>

                                {/* Quantity */}
                                <td className="px-4 py-4 text-right font-semibold text-emerald-600">
                                  {transactionType ===
                                    "STOCK_IN" &&
                                    "+"}
                                  {formatNumber(
                                    item.quantity
                                  )}
                                </td>

                                {/* Before */}
                                <td className="px-4 py-4 text-right font-medium text-slate-600">
                                  {formatNumber(
                                    item.beforeStock
                                  )}
                                </td>

                                {/* After */}
                                <td className="px-4 py-4 text-right font-bold text-slate-900">
                                  {formatNumber(
                                    item.afterStock
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-400">
                      Showing{" "}
                      <span className="font-medium text-slate-600">
                        {historyStartIndex + 1}
                      </span>{" "}
                      –{" "}
                      <span className="font-medium text-slate-600">
                        {Math.min(
                          historyStartIndex +
                            HISTORY_PER_PAGE,
                          history.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-slate-600">
                        {history.length}
                      </span>{" "}
                      records
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={
                          historyPage === 1
                        }
                        onClick={() =>
                          setHistoryPage((page) =>
                            Math.max(1, page - 1)
                          )
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>

                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                        {historyPage} /{" "}
                        {historyTotalPages}
                      </div>

                      <button
                        type="button"
                        disabled={
                          historyPage ===
                          historyTotalPages
                        }
                        onClick={() =>
                          setHistoryPage((page) =>
                            Math.min(
                              historyTotalPages,
                              page + 1
                            )
                          )
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}