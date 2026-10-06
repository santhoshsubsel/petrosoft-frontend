import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  IndianRupee,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Loader2,
  Fuel,
  Package,
  Gauge,
  AlertTriangle,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import StatCard from "../components/StatCard";
import { getResource } from "../services/resourceService";

/* =========================================================
   TYPES
========================================================= */

interface SalesReport {
  totals?: {
    dailySales?: number;
    expenses?: number;
    creditSales?: number;
    oilSales?: number;
  };

  dailySales?: Array<{
    businessDate: string;
    totalAmount: string | number;
    status: string;
  }>;
}

interface ProductItem {
  id: string;
  name: string;
  code?: string | null;
  productType?: string;
  currentPrice: string | number;
  unit?: string;
  active?: boolean;
}

interface TankItem {
  id: string;
  name: string;
  productId: string;
  capacity: string | number;
  minCapacity: string | number;
  availableStock: string | number;
  active: boolean;

  product?: {
    id: string;
    name: string;
    code?: string | null;
    productType?: string;
    unit?: string;
    currentPrice?: string | number;
  };
}

/* =========================================================
   CHART COLORS
========================================================= */

const CHART_COLORS = [
  "#1677ff",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
];

/* =========================================================
   LAYOUT CONSTANTS
   Same grid template is used by the table header and every
   row, so all columns line up perfectly.
========================================================= */

const PRODUCT_GRID =
  "grid grid-cols-[minmax(0,1fr)_96px_120px] items-center gap-4 px-3";

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value: number | string | undefined) => {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatNumber = (value: number | string | undefined) => {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

/* =========================================================
   PRODUCT ICON
========================================================= */
function ProductIcon({ productType }: { productType?: string }) {
  void productType;
  return <Fuel size={17} />;
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  /* -------------------------------------------------------
     SALES
  ------------------------------------------------------- */

  const [report, setReport] = useState<SalesReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<SalesReport | null>(null);
  const [salesLoading, setSalesLoading] = useState(true);
const [searchParams] = useSearchParams();

const getLocalDate = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
};

const selectedDate =
  searchParams.get("date") || getLocalDate();
const chartYear = Number(selectedDate.slice(0, 4)) || new Date().getFullYear();
  /* -------------------------------------------------------
     PRODUCTS
  ------------------------------------------------------- */

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  /* -------------------------------------------------------
     TANKS
  ------------------------------------------------------- */

  const [tanks, setTanks] = useState<TankItem[]>([]);
  const [tanksLoading, setTanksLoading] = useState(true);
  const [tanksError, setTanksError] = useState("");

  /* =======================================================
     LOAD SALES
  ======================================================= */

useEffect(() => {
  const loadSales = async () => {
    try {
      setSalesLoading(true);

      const sales =
        await getResource<SalesReport>(
          `/reports/sales?date=${selectedDate}`
        );

      setReport(sales);
    } catch (error) {
      console.error(
        "Sales dashboard loading failed:",
        error
      );

      setReport({
        totals: {
          dailySales: 0,
          expenses: 0,
          creditSales: 0,
          oilSales: 0,
        },
        dailySales: [],
      });
    } finally {
      setSalesLoading(false);
    }
  };

  void loadSales();
}, [selectedDate]);

useEffect(() => {
  const loadMonthlySales = async () => {
    try {
      const monthlyData = await getResource<SalesReport>(
        `/reports/sales?from=${chartYear}-01-01&to=${chartYear}-12-31`
      );
      setMonthlyReport(monthlyData);
    } catch (error) {
      console.error("Monthly sales chart loading failed:", error);
      setMonthlyReport({ dailySales: [] });
    }
  };

  void loadMonthlySales();
}, [chartYear]);
  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");

        const response = await getResource<ProductItem[]>("/products");

        // Show only Petrol, Diesel, Water and Other products
        // Exclude Oil products
        const filteredProducts = response.filter((product) =>
          ["PETROL", "DIESEL", "OTHER"].includes(
            product.productType ?? ""
          )
        );

        setProducts(filteredProducts);
      } catch (error) {
        console.error("Products loading failed:", error);
        setProductsError("Unable to load product prices.");
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, []);

  /* =======================================================
     LOAD TANKS
  ======================================================= */

  useEffect(() => {
    const loadTanks = async () => {
      try {
        setTanksLoading(true);
        setTanksError("");

        const response = await getResource<TankItem[]>("/tanks");

        setTanks(response);
      } catch (error) {
        console.error("Tanks loading failed:", error);
        setTanksError("Unable to load tank information.");
      } finally {
        setTanksLoading(false);
      }
    };

    loadTanks();
  }, []);

  /* =======================================================
     SALES TOTALS
  ======================================================= */

  const totals = report?.totals ?? {};

  /* =======================================================
     SALES TREND
  ======================================================= */

  const trend = useMemo(() => {
    const monthlyTotals = Array.from({ length: 12 }, () => 0);

    (monthlyReport?.dailySales ?? []).forEach((item) => {
      const businessDate = new Date(`${item.businessDate.slice(0, 10)}T00:00:00`);
      if (Number.isNaN(businessDate.getTime()) || businessDate.getFullYear() !== chartYear) {
        return;
      }

      monthlyTotals[businessDate.getMonth()] += Number(item.totalAmount) || 0;
    });

    return monthlyTotals.map((sales, monthIndex) => ({
      month: new Date(chartYear, monthIndex, 1).toLocaleDateString("en-IN", {
        month: "short",
      }),
      sales,
    }));
  }, [monthlyReport, chartYear]);

  /* =======================================================
     REVENUE DISTRIBUTION
  ======================================================= */

  const salesDistribution = useMemo(() => {
    return [
      {
        name: "Fuel Sales",
        value: Number(totals.dailySales || 0),
      },
      {
        name: "Oil Sales",
        value: Number(totals.oilSales || 0),
      },
      {
        name: "Credit Sales",
        value: Number(totals.creditSales || 0),
      },
      {
        name: "Expenses",
        value: Number(totals.expenses || 0),
      },
    ].filter((item) => item.value > 0);
  }, [totals]);

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const productPriceData = useMemo(() => {
    return products
      .filter((product) => product.active !== false)
      .map((product) => ({
        ...product,
        price: Number(product.currentPrice),
      }));
  }, [products]);

  /* =======================================================
     TANKS
  ======================================================= */

  const tankData = useMemo(() => {
    return tanks
      .filter((tank) => tank.active)
      .slice(0, 3)
      .map((tank) => {
        const capacity = Number(tank.capacity);
        const available = Number(tank.availableStock);
        const minCapacity = Number(tank.minCapacity);

        const percentage =
          capacity > 0
            ? Math.min(100, Math.max(0, (available / capacity) * 100))
            : 0;

        const isLow = available <= minCapacity || percentage < 20;

        return {
          ...tank,
          capacityValue: capacity,
          availableValue: available,
          minCapacityValue: minCapacity,
          percentage,
          isLow,
        };
      });
  }, [tanks]);

  /* =======================================================
     TANK SUMMARY
  ======================================================= */

  const totalTankCapacity = useMemo(() => {
    return tankData.reduce((sum, tank) => sum + tank.capacityValue, 0);
  }, [tankData]);

  const totalAvailableStock = useMemo(() => {
    return tankData.reduce((sum, tank) => sum + tank.availableValue, 0);
  }, [tankData]);

  const totalTankPercentage =
    totalTankCapacity > 0
      ? (totalAvailableStock / totalTankCapacity) * 100
      : 0;

  const lowStockTanks = tankData.filter((tank) => tank.isLow).length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6 pt-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-xl font-extrabold text-slate-900">
      Dashboard
    </h1>

    <p className="text-xs text-slate-400">
      Revenue and station performance overview
    </p>
  </div>

  <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
    <span className="h-2 w-2 rounded-full bg-blue-600" />

    Revenue for{" "}
    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    )}
  </div>
</div>
      {/* ===================================================
          SALES STAT CARDS
      =================================================== */}

      {salesLoading ? (
        <div className="card grid min-h-28 place-items-center">
          <Loader2 className="animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Today Sales"
            value={formatCurrency(totals.dailySales)}
            change="Live API data"
            icon={IndianRupee}
            tone="green"
          />

          <StatCard
            label="Oil Sales"
            value={formatCurrency(totals.oilSales)}
            change="Live API data"
            icon={ShoppingCart}
          />

          <StatCard
            label="Credit Sales"
            value={formatCurrency(totals.creditSales)}
            change="Live API data"
            icon={Receipt}
            tone="orange"
          />

          <StatCard
            label="Expenses"
            value={formatCurrency(totals.expenses)}
            change="Live API data"
            icon={TrendingUp}
            tone="red"
          />
        </div>
      )}

      {/* ===================================================
          PRODUCTS + TANKS
      =================================================== */}

      <div className="grid items-stretch gap-5 xl:grid-cols-[1.2fr_1fr]">
        {/* =================================================
            PRODUCT PRICES
        ================================================= */}

        <section className="card flex flex-col p-5">
          {/* HEADER */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Product Prices</h2>

              <p className="text-xs text-slate-400">Current selling price</p>
            </div>

            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Fuel size={18} />
            </div>
          </div>

          {/* CONTENT */}
          {productsLoading ? (
            <div className="grid min-h-32 flex-1 place-items-center">
              <Loader2 className="animate-spin text-brand-600" />
            </div>
          ) : productsError ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {productsError}
            </div>
          ) : productPriceData.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-400">
              No active products found.
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              {/* TABLE HEADER */}
              <div
                className={`${PRODUCT_GRID} border-b border-slate-100 pb-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400`}
              >
                <span>Product</span>
                <span>Type</span>
                <span className="text-right">Price</span>
              </div>

              {/* PRODUCT LIST */}
              <div className="divide-y divide-slate-100">
                {productPriceData.map((product) => (
                  <div
                    key={product.id}
                    className={`${PRODUCT_GRID} py-3 transition-colors hover:bg-slate-50`}
                  >
                    {/* PRODUCT */}
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                        <ProductIcon productType={product.productType} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold leading-tight text-slate-800">
                          {product.name}
                        </p>

                        {product.code && (
                          <p className="mt-0.5 truncate text-[10px] font-medium uppercase text-slate-400">
                            {product.code}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* PRODUCT TYPE */}
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          product.productType === "PETROL"
                            ? "bg-blue-50 text-blue-600"
                            : product.productType === "DIESEL"
                            ? "bg-slate-100 text-slate-600"
                            : product.productType === "WATER"
                            ? "bg-cyan-50 text-cyan-600"
                            : "bg-violet-50 text-violet-600"
                        }`}
                      >
                        {product.productType || "OTHER"}
                      </span>
                    </div>

                    {/* PRICE */}
                    <div className="text-right">
                      <p className="text-sm font-extrabold tabular-nums text-slate-900">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* FOOTER (keeps card height balanced with Tank Status) */}
              <div className="mt-auto border-t border-slate-100 px-3 pt-3 text-[11px] text-slate-400">
                {productPriceData.length} active product
                {productPriceData.length > 1 ? "s" : ""}
              </div>
            </div>
          )}
        </section>

        {/* =================================================
            TANK STATUS
        ================================================= */}

        <section className="card flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Tank Status</h2>

              <p className="text-xs text-slate-400">
                Current fuel availability
              </p>
            </div>

            <div className="flex items-center gap-2">
              {lowStockTanks > 0 && (
                <span
                  title="Tanks need attention"
                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 ring-1 ring-amber-100"
                >
                  <AlertTriangle size={12} />
                  {lowStockTanks} low
                </span>
              )}

              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Package size={18} />
              </div>
            </div>
          </div>

          {tanksLoading ? (
            <div className="grid min-h-32 flex-1 place-items-center">
              <Loader2 className="animate-spin text-brand-600" />
            </div>
          ) : tanksError ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {tanksError}
            </div>
          ) : tankData.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No active tanks found.
            </div>
          ) : (
            <>
              {/* OVERALL STOCK (compact) */}

              <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-emerald-600 shadow-sm">
                  <Gauge size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-extrabold tabular-nums text-slate-900">
                      {formatNumber(totalAvailableStock)}
                      <span className="ml-1 text-[11px] font-medium text-slate-400">
                        / {formatNumber(totalTankCapacity)}
                      </span>
                    </p>

                    <span className="text-xs font-bold tabular-nums text-emerald-600">
                      {totalTankPercentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                      style={{
                        width: `${Math.min(100, totalTankPercentage)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* TANK LIST (compact rows) */}

              <div className="divide-y divide-slate-100">
                {tankData.map((tank) => (
                  <div key={tank.id} className="py-2.5 first:pt-1 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-xs font-bold text-slate-700">
                          {tank.name}
                        </p>

                        <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          {tank.product?.name || "Product"}
                        </span>

                        {tank.isLow && (
                          <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                            Low
                          </span>
                        )}
                      </div>

                      <span
                        className={`shrink-0 text-xs font-bold tabular-nums ${
                          tank.isLow ? "text-amber-600" : "text-emerald-600"
                        }`}
                      >
                        {tank.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          tank.isLow ? "bg-amber-400" : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${tank.percentage}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1 text-[10px] tabular-nums text-slate-400">
                      {formatNumber(tank.availableValue)} /{" "}
                      {formatNumber(tank.capacityValue)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ===================================================
          SALES GRAPH + DONUT
      =================================================== */}

      <div className="grid items-stretch gap-5 xl:grid-cols-[1.7fr_1fr]">
        {/* =================================================
            SALES PERFORMANCE
        ================================================= */}

        <section className="card flex flex-col overflow-hidden p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Monthly Sales Performance</h2>

              <p className="text-xs text-slate-400">
                Monthly sales for {chartYear}
              </p>
            </div>

          </div>

          <div className="h-72 w-full">
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend}
                  margin={{
                    top: 10,
                    right: 16,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="salesGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#1677ff"
                        stopOpacity={0.3}
                      />

                      <stop
                        offset="100%"
                        stopColor="#1677ff"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickMargin={10}
                    interval={0}
                    padding={{ left: 24, right: 24 }}
                    tick={{ fill: "#94a3b8" }}
                  />

                  <YAxis
                    width={64}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickMargin={8}
                    tick={{ fill: "#94a3b8" }}
                    tickFormatter={(value) =>
                      `₹${Number(value).toLocaleString("en-IN")}`
                    }
                  />

                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Sales",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#1677ff"
                    strokeWidth={3}
                    fill="url(#salesGradient)"
                    dot={{
                      r: 4,
                      fill: "#ffffff",
                      stroke: "#1677ff",
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-400">
                No sales trend data available.
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            REVENUE DONUT
        ================================================= */}

        <section className="card flex flex-col p-5">
          <div className="mb-3">
            <h2 className="font-bold text-slate-900">Revenue Distribution</h2>

            <p className="text-xs text-slate-400">Current sales breakdown</p>
          </div>

          <div className="relative h-60 w-full">
            {salesDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {salesDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Total</p>

                    <p className="text-lg font-extrabold tabular-nums text-slate-900">
                      {formatCurrency(
                        salesDistribution.reduce(
                          (sum, item) => sum + item.value,
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-400">
                No revenue data.
              </div>
            )}
          </div>

          <div className="mt-auto space-y-2.5 border-t border-slate-100 pt-4">
            {salesDistribution.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />

                  <span className="truncate text-slate-500">{item.name}</span>
                </div>

                <span className="shrink-0 font-bold tabular-nums text-slate-700">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}