import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Download,
  IndianRupee,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Loader2,
  Fuel,
  Package,
  Droplets,
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
import { useAuth } from "../context/AuthContext";

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
  return <Fuel size={17} />;
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const { user } = useAuth();

  /* -------------------------------------------------------
     SALES
  ------------------------------------------------------- */

  const [report, setReport] = useState<SalesReport | null>(null);
  const [salesLoading, setSalesLoading] = useState(true);

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

        const sales = await getResource<SalesReport>(
          "/reports/sales"
        );

        setReport(sales);
      } catch (error) {
        console.error("Sales dashboard loading failed:", error);
      } finally {
        setSalesLoading(false);
      }
    };

    loadSales();
  }, []);

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
       ["PETROL", "DIESEL", "WATER", "OTHER"].includes(
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

        const response = await getResource<TankItem[]>(
          "/tanks"
        );

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
    return (report?.dailySales ?? []).map((item) => ({
      time: new Date(item.businessDate).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
        }
      ),

      sales: Number(item.totalAmount),
    }));
  }, [report]);

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
          ? Math.min(
              100,
              Math.max(0, (available / capacity) * 100)
            )
          : 0;

      const isLow =
        available <= minCapacity || percentage < 20;

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
    return tankData.reduce(
      (sum, tank) => sum + tank.capacityValue,
      0
    );
  }, [tankData]);

  const totalAvailableStock = useMemo(() => {
    return tankData.reduce(
      (sum, tank) => sum + tank.availableValue,
      0
    );
  }, [tankData]);

  const totalTankPercentage =
    totalTankCapacity > 0
      ? (totalAvailableStock / totalTankCapacity) * 100
      : 0;

  const lowStockTanks = tankData.filter(
    (tank) => tank.isLow
  ).length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">
            {user?.role === "ADMIN"
              ? "Good Evening,"
              : "Welcome Back,"}
          </p>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {user?.name || "PetroSoft User"} 👋
          </h1>

          <p className="text-xs text-slate-400">
            Here's your station overview for today.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary"
          >
            <CalendarDays size={16} />
            Today
          </button>

          <button
            type="button"
            className="btn-primary"
          >
            Today
            <ChevronRight size={15} />
          </button>
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

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

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">

{/* =================================================
    PRODUCT PRICES
================================================= */}

<section className="card overflow-hidden p-5">

  {/* HEADER */}
  <div className="mb-4 flex items-center justify-between">
    <div>
      <h2 className="font-bold text-slate-900">
        Product Prices
      </h2>

      <p className="text-xs text-slate-400">
        Current selling price
      </p>
    </div>

    <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
      <Fuel size={18} />
    </div>
  </div>

  {/* CONTENT */}
  {productsLoading ? (
    <div className="grid min-h-32 place-items-center">
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
    <div className="overflow-x-auto">

      <div className="min-w-[520px]">

        {/* TABLE HEADER */}
       <div
  className="
    grid
    grid-cols-[minmax(220px,1fr)_100px_100px]
    items-center
    gap-2
    border-b
    border-slate-100
    px-2
    pb-2.5
    text-[10px]
    font-semibold
    uppercase
    tracking-wider
    text-slate-400
  "
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
              className="
                grid
                grid-cols-[minmax(240px,1fr)_130px_130px]
                items-center
                gap-4
                px-3
                py-3
                transition-colors
                hover:bg-slate-50
              "
            >

              {/* PRODUCT */}
              <div className="flex min-w-0 items-center gap-3">

                <div
                  className="
                    grid
                    h-9
                    w-9
                    shrink-0
                    place-items-center
                    rounded-lg
                    bg-blue-50
                    text-blue-600
                  "
                >
                  <ProductIcon
                    productType={product.productType}
                  />
                </div>

                <div className="min-w-0">

                  <p className="truncate text-sm font-bold text-slate-800">
                    {product.name}
                  </p>

                  {product.code && (
                    <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                      {product.code}
                    </p>
                  )}

                </div>

              </div>

              {/* PRODUCT TYPE */}
              <div>

                <span
                  className={`
                    inline-flex
                    rounded-full
                    px-2.5
                    py-1
                    text-[10px]
                    font-semibold

                    ${
                      product.productType === "PETROL"
                        ? "bg-blue-50 text-blue-600"
                        : product.productType === "DIESEL"
                        ? "bg-slate-100 text-slate-600"
                        : product.productType === "WATER"
                        ? "bg-cyan-50 text-cyan-600"
                        : "bg-violet-50 text-violet-600"
                    }
                  `}
                >
                  {product.productType || "OTHER"}
                </span>

              </div>

              {/* PRICE */}
              <div className="text-right">

                <p className="text-sm font-extrabold text-slate-900">
                  {formatCurrency(product.price)}
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  )}

</section>
        {/* =================================================
            TANK STATUS
        ================================================= */}

        <section className="card p-5">

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="font-bold text-slate-900">
                Tank Status
              </h2>

              <p className="text-xs text-slate-400">
                Current fuel availability
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Package size={18} />
            </div>

          </div>

          {tanksLoading ? (
            <div className="grid min-h-32 place-items-center">
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
              {/* OVERALL STOCK */}

              <div className="mb-5 rounded-2xl bg-slate-50 p-4">

                <div className="mb-3 flex items-center justify-between">

                  <div>
                    <p className="text-xs text-slate-400">
                      Total Available Stock
                    </p>

                    <p className="mt-1 text-xl font-extrabold text-slate-900">
                      {formatNumber(totalAvailableStock)}
                    </p>
                  </div>

                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <Gauge size={20} />
                  </div>

                </div>

                <div className="mb-2 flex justify-between text-[11px] text-slate-400">
                  <span>
                    Capacity{" "}
                    {formatNumber(totalTankCapacity)}
                  </span>

                  <span className="font-bold text-emerald-600">
                    {totalTankPercentage.toFixed(1)}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        totalTankPercentage
                      )}%`,
                    }}
                  />
                </div>

              </div>

              {/* LOW STOCK */}

              {lowStockTanks > 0 && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">

                  <AlertTriangle
                    size={17}
                    className="text-amber-500"
                  />

                  <div>
                    <p className="text-xs font-bold text-amber-700">
                      Low Stock Alert
                    </p>

                    <p className="text-[10px] text-amber-600">
                      {lowStockTanks} tank
                      {lowStockTanks > 1 ? "s" : ""} need
                      attention.
                    </p>
                  </div>

                </div>
              )}

              {/* TANK LIST */}

              <div className="space-y-5">

                {tankData.map((tank) => (
                  <div key={tank.id}>

                    <div className="mb-1.5 flex items-center justify-between">

                      <div className="min-w-0">

                        <p className="truncate text-xs font-bold text-slate-700">
                          {tank.name}
                        </p>

                        <p className="truncate text-[10px] text-slate-400">
                          {tank.product?.name || "Product"}
                        </p>

                      </div>

                      <span
                        className={`ml-3 shrink-0 text-xs font-bold ${
                          tank.isLow
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {tank.percentage.toFixed(1)}%
                      </span>

                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          tank.isLow
                            ? "bg-amber-400"
                            : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${tank.percentage}%`,
                        }}
                      />

                    </div>

                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">

                      <span>
                        Available{" "}
                        {formatNumber(tank.availableValue)}
                      </span>

                      <span>
                        Capacity{" "}
                        {formatNumber(tank.capacityValue)}
                      </span>

                    </div>

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

      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">

        {/* =================================================
            SALES PERFORMANCE
        ================================================= */}

        <section className="card overflow-hidden p-5">

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="font-bold text-slate-900">
                Sales Performance
              </h2>

              <p className="text-xs text-slate-400">
                Daily sales performance from backend
              </p>
            </div>

            <button
              type="button"
              className="btn-secondary py-2 text-xs"
            >
              <Download size={14} />
              Export
            </button>

          </div>

          <div className="h-72">

            {trend.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={trend}
                  margin={{
                    top: 10,
                    right: 10,
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
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tick={{ fill: "#94a3b8" }}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tick={{ fill: "#94a3b8" }}
                    tickFormatter={(value) =>
                      `₹${Number(value).toLocaleString(
                        "en-IN"
                      )}`
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
                      boxShadow:
                        "0 10px 30px rgba(15,23,42,0.08)",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#1677ff"
                    strokeWidth={3}
                    fill="url(#salesGradient)"
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

        <section className="card p-5">

          <div className="mb-3">

            <h2 className="font-bold text-slate-900">
              Revenue Distribution
            </h2>

            <p className="text-xs text-slate-400">
              Current sales breakdown
            </p>

          </div>

          <div className="relative h-60">

            {salesDistribution.length > 0 ? (
              <>
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
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
                      {salesDistribution.map(
                        (_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              CHART_COLORS[
                                index %
                                  CHART_COLORS.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(Number(value))
                      }
                    />

                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                  <div className="text-center">

                    <p className="text-xs text-slate-400">
                      Total
                    </p>

                    <p className="text-lg font-extrabold text-slate-900">
                      {formatCurrency(
                        salesDistribution.reduce(
                          (sum, item) =>
                            sum + item.value,
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

          <div className="space-y-2">

            {salesDistribution.map(
              (item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs"
                >

                  <div className="flex items-center gap-2">

                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_COLORS[
                            index %
                              CHART_COLORS.length
                          ],
                      }}
                    />

                    <span className="text-slate-500">
                      {item.name}
                    </span>

                  </div>

                  <span className="font-bold text-slate-700">
                    {formatCurrency(item.value)}
                  </span>

                </div>
              )
            )}

          </div>

        </section>

      </div>

    </div>
  );
}