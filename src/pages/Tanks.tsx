import { useEffect, useState } from "react";
import GenericPage from "./GenericPage";
import { getTanks, addTankStock } from "../services/tankService";
import type { Tank } from "../services/tankService";
import { Loader2, Plus, X } from "lucide-react";

/**
 * Animated liquid tank.
 */
function TankLiquid({ percent }: { percent: number }) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setLevel(percent), 60);
    return () => clearTimeout(t);
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

export default function Tanks() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedTankId, setSelectedTankId] = useState("");

  const [quantity, setQuantity] = useState("");

  const [saving, setSaving] = useState(false);
  const [stockError, setStockError] = useState("");

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

  /**
   * Open Add Stock modal.
   * If called from the top button, no tank is selected initially.
   */
  const openAddStock = () => {
    setSelectedTankId("");
    setQuantity("");
    setStockError("");
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

    if (!quantity || qty <= 0) {
      setStockError("Please enter a valid stock quantity.");
      return;
    }

    const currentStock = Number(
      selectedTank.availableStock
    );

    const capacity = Number(selectedTank.capacity);

    if (currentStock + qty > capacity) {
      setStockError(
        `Stock cannot exceed tank capacity of ${capacity.toLocaleString()}.`
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

      // Refresh without showing page loader.
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

  return (
    <>
      {/* Tank liquid animation */}
      <style>{`
        .tank-liquid {
          transition: height 1.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease;
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

      <GenericPage
        title="Tank Management"
        subtitle="Monitor tank capacity, minimum level and available stock."
        action="Add Stock"
        onAction={openAddStock}
      >
        {loading ? (
          <div className="card grid min-h-40 place-items-center">
            <Loader2 className="animate-spin text-brand-600" />
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
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="badge bg-emerald-50 text-emerald-600">
                        {tank.product?.name || "Product"}
                      </span>

                      <h3 className="mt-2 font-bold">
                        {tank.name}
                      </h3>
                    </div>

                    <TankLiquid percent={percent} />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400">
                        Capacity
                      </p>

                      <p className="mt-1 font-bold">
                        {capacity.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">
                        Min Capacity
                      </p>

                      <p className="mt-1 font-bold">
                        {Number(
                          tank.minCapacity
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">
                        Available
                      </p>

                      <p className="mt-1 font-bold">
                        {available.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">
                        Fuel %
                      </p>

                      <p className="mt-1 font-bold">
                        {percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GenericPage>

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
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
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-6 py-5">
              {/* Tank Dropdown */}
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
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
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

              {/* Selected Tank Information */}
              {selectedTank && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Current Stock
                    </p>

                    <p className="mt-1 font-bold">
                      {Number(
                        selectedTank.availableStock
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Capacity
                    </p>

                    <p className="mt-1 font-bold">
                      {Number(
                        selectedTank.capacity
                      ).toLocaleString()}
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
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                {selectedTank && (
                  <p className="mt-1 text-xs text-slate-400">
                    Maximum available space:{" "}
                    {(
                      Number(selectedTank.capacity) -
                      Number(selectedTank.availableStock)
                    ).toLocaleString()}
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
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddStock}
                disabled={saving || !selectedTank}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
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
    </>
  );
}