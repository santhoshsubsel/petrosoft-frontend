import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Activity,
  ArrowUpRight,
  CarFront,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Droplets,
  Gauge,
  Loader2,
  PackagePlus,
  ReceiptText,
  RefreshCw,
  Settings2,
  TestTube2,
  TrendingUp,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { getResource } from "../services/resourceService";

import {
  addManagerStock,
  createCreditSale,
  createExpense,
  createMeterSale,
  createSampleReading,
  createVehicleStock,
  getActiveDailySales,
  getManagerNozzles,
  getManagerProducts,
  getManagerTanks,
  type DailySalesRecord,
} from "../services/managerService";

import type { Product } from "../services/productService";
import type { Tank } from "../services/tankService";
import type { Nozzle } from "../services/nozzleService";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
}

interface ExpenseType {
  id: string;
  name: string;
  active?: boolean;
}

interface Vehicle {
  id: string;
  name: string;
  vehicleNumber?: string | null;
  active?: boolean;
}

interface ManagerNozzleShape {
  id: string;
  name?: string | null;
  active?: boolean | null;
  currentMeter?: number | string | null;
  openingMeter?: number | string | null;

  tank?: {
    id?: string;
    name?: string | null;

    product?: {
      id?: string;
      name?: string | null;
      currentPrice?: number | string | null;
      productType?: string | null;
    } | null;
  } | null;
}

type ActionKey =
  | "stock"
  | "dailySale"
  | "credit"
  | "sample"
  | "expense"
  | "vehicle";

type Action = ActionKey | null;

type ToastState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

interface BulkMeterRow {
  nozzleId: string;
  currentMeter: string;
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

const actions = [
  {
    key: "stock",
    label: "Add Stock",
    subtitle: "Tank loading",
    icon: PackagePlus,
    tone: "blue",
    configured: true,
  },
  {
    key: "dailySale",
    label: "Add Daily Sales",
    subtitle: "Meter reading",
    icon: ClipboardList,
    tone: "amber",
    configured: true,
  },
  {
    key: "credit",
    label: "Add Credit Sales",
    subtitle: "Customer credit",
    icon: ReceiptText,
    tone: "cyan",
    configured: true,
  },
  {
    key: "sample",
    label: "Sample Reading",
    subtitle: "Fuel sample",
    icon: TestTube2,
    tone: "rose",
    configured: true,
  },
  {
    key: "expense",
    label: "Add Expense",
    subtitle: "Daily expense",
    icon: Activity,
    tone: "red",
    configured: true,
  },
  {
    key: "vehicle",
    label: "Vehicle Stock",
    subtitle: "Vehicle loading",
    icon: CarFront,
    tone: "indigo",
    configured: true,
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const toneClasses: Record<
  string,
  {
    icon: string;
    iconBg: string;
    arrow: string;
  }
> = {
  blue: {
    icon: "text-blue-600",
    iconBg: "bg-blue-50",
    arrow: "text-blue-500",
  },
  amber: {
    icon: "text-amber-600",
    iconBg: "bg-amber-50",
    arrow: "text-amber-500",
  },
  cyan: {
    icon: "text-cyan-600",
    iconBg: "bg-cyan-50",
    arrow: "text-cyan-500",
  },
  rose: {
    icon: "text-rose-600",
    iconBg: "bg-rose-50",
    arrow: "text-rose-500",
  },
  red: {
    icon: "text-red-600",
    iconBg: "bg-red-50",
    arrow: "text-red-500",
  },
  indigo: {
    icon: "text-indigo-600",
    iconBg: "bg-indigo-50",
    arrow: "text-indigo-500",
  },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const today = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

const money = (value: number | string | null | undefined) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const num = (value: number | string | null | undefined) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: unknown;
          };
        };
      }
    ).response;

    if (typeof response?.data?.message === "string") {
      return response.data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function toManagerNozzle(nozzle: Nozzle): ManagerNozzleShape {
  return nozzle as unknown as ManagerNozzleShape;
}

function dateKey(value: string | Date) {
  const d = new Date(value);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDateOffset(offset: number) {
  const d = new Date();

  d.setDate(d.getDate() + offset);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(value: Date | null) {
  if (!value) return "Not updated";

  return value.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTankPercentage(tank: Tank) {
  const capacity = Number(tank.capacity || 0);
  const available = Number(tank.availableStock || 0);

  if (capacity <= 0) return 0;

  return Math.min(100, Math.max(0, (available / capacity) * 100));
}

function getProductTypeLabel(productType?: string | null) {
  switch (productType) {
    case "PETROL":
      return "Petrol";

    case "DIESEL":
      return "Diesel";

    case "OIL":
      return "Oil";

    case "WATER":
      return "Water";

    default:
      return "Fuel";
  }
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[92vh] w-full overflow-hidden rounded-3xl bg-white shadow-2xl ${
          wide ? "max-w-6xl" : "max-w-xl"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold text-slate-900">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-3 shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X size={19} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-76px)] overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </span>

      {children}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Footer                                                               */
/* -------------------------------------------------------------------------- */

function ModalFooter({
  saving,
  onClose,
  label = "Save",
}: {
  saving: boolean;
  onClose: () => void;
  label?: string;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="btn-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className="btn-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {saving && <Loader2 size={15} className="animate-spin" />}

        {saving ? "Saving..." : label}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const classes =
    normalized === "ACTIVE"
      ? "bg-emerald-50 text-emerald-600"
      : normalized === "PENDING"
        ? "bg-amber-50 text-amber-600"
        : "bg-slate-100 text-slate-500";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${classes}`}
    >
      {status}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty State                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ClipboardList;
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-48 place-items-center px-5 py-10 text-center">
      <div>
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon size={19} />
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-700">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* KPI Card                                                                   */
/* -------------------------------------------------------------------------- */

function KpiCard({
  label,
  value,
  subtitle,
  trend,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: string;
  subtitle: string;
  trend: string;
  icon: typeof Activity;
  tone: string;
  loading: boolean;
}) {
  const toneStyle = toneClasses[tone] ?? toneClasses.blue;

  return (
    <div className="card p-4 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${toneStyle.iconBg} ${toneStyle.icon}`}
        >
          <Icon size={17} />
        </div>

        {!loading && (
          <span className="text-[10px] font-semibold text-slate-400">
            {trend}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>

        {loading ? (
          <Skeleton className="mt-2 h-7 w-28" />
        ) : (
          <p className="mt-1 text-xl font-bold tracking-tight text-blue-600">
            {value}
          </p>
        )}

        <p className="mt-1 text-[10px] text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Quick Action Card                                                          */
/* -------------------------------------------------------------------------- */

function QuickActionCard({
  label,
  subtitle,
  icon: Icon,
  tone,
  configured,
  onClick,
}: {
  label: string;
  subtitle: string;
  icon: typeof Activity;
  tone: string;
  configured: boolean;
  onClick: () => void;
  onConfigure: () => void;
}) {
  const toneStyle = toneClasses[tone] ?? toneClasses.blue;

  return (
    <div
      className={`group flex min-h-[118px] flex-col rounded-2xl border bg-white transition-colors duration-200 ${
        configured
          ? "border-slate-100 hover:border-slate-200 hover:bg-slate-50/40"
          : "border-dashed border-slate-200 bg-slate-50/40"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-start gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneStyle.iconBg} ${toneStyle.icon}`}
        >
          <Icon size={18} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-slate-800">
            {label}
          </span>

          <span className="mt-1 block truncate text-xs text-slate-400">
            {subtitle}
          </span>
        </span>

        {configured && (
          <ArrowUpRight
            size={15}
            className={`mt-1 shrink-0 ${toneStyle.arrow} opacity-0 transition group-hover:opacity-100`}
          />
        )}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Recent Sales                                                               */
/* -------------------------------------------------------------------------- */

function RecentSalesTable({
  rows,
  loading,
  onViewAll,
}: {
  rows: DailySalesRecord[];
  loading: boolean;
  onViewAll: () => void;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-bold text-slate-900">Recent Daily Sales</h2>

          <p className="mt-1 text-xs text-slate-400">
            Business-day status and totals.
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-600 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          View all
          <ChevronRight size={14} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <Skeleton className="h-10 w-44" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
      ) : rows.length ? (
        <>
          <div className="hidden md:block">
            <table className="w-full table-fixed text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="w-[42%] px-5 py-3 text-left">
                    Date
                  </th>

                  <th className="w-[28%] px-4 py-3 text-left">
                    Status
                  </th>

                  <th className="w-[30%] px-5 py-3 text-right">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.slice(0, 10).map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">
                        {new Date(
                          row.businessDate
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>

                      <div className="mt-0.5 truncate text-[11px] text-slate-400">
                        {row.name || "Daily Sales"}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={row.status} />
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <span className="font-bold tabular-nums text-slate-900">
                        {money(row.totalAmount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {rows.slice(0, 10).map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 px-4 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {row.name || "Daily Sales"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(
                      row.businessDate
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <StatusBadge status={row.status} />

                  <p className="mt-1.5 text-sm font-bold tabular-nums text-slate-900">
                    {money(row.totalAmount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No daily sales records"
          description="Daily sales will appear here once created."
        />
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Tank Level Card                                                            */
/* -------------------------------------------------------------------------- */

function TankLevelCard({
  tank,
  product,
  animate,
}: {
  tank: Tank;
  product?: Product;
  animate: boolean;
}) {
  const percentage = getTankPercentage(tank);

  const levelClass =
    percentage < 20
      ? "bg-red-500"
      : percentage <= 50
        ? "bg-amber-500"
        : "bg-emerald-500";

  const textClass =
    percentage < 20
      ? "text-red-600"
      : percentage <= 50
        ? "text-amber-600"
        : "text-emerald-600";

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-800">
            {tank.name}
          </p>

          <span className="mt-1 inline-flex max-w-full truncate rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-500 shadow-sm">
            {getProductTypeLabel(product?.productType)}
          </span>
        </div>

        <div className="shrink-0 text-right">
          <p className={`text-sm font-extrabold ${textClass}`}>
            {percentage.toFixed(0)}%
          </p>

          {percentage < 20 && (
            <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600">
              Low
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">
          {num(tank.availableStock)} L
        </span>

        <span className="text-slate-400">
          / {num(tank.capacity)} L
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full ${levelClass} transition-[width] duration-700 ease-out`}
          style={{
            width: animate ? `${percentage}%` : "0%",
          }}
        />
      </div>
    </div>
  );
}

/* ========================================================================== */
/* MAIN COMPONENT                                                             */
/* ========================================================================== */

export default function ManagerTrackSales() {
  const navigate = useNavigate();

  const [action, setAction] = useState<Action>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState>(null);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [tankAnimationReady, setTankAnimationReady] =
    useState(false);

  /* ------------------------------------------------------------------------ */
  /* Bulk Meter Toggle                                                        */
  /* ------------------------------------------------------------------------ */

  const [bulkMeterEnabled, setBulkMeterEnabled] =
    useState(false);

  const [bulkMeterRows, setBulkMeterRows] = useState<
    BulkMeterRow[]
  >([]);

  /* ------------------------------------------------------------------------ */
  /* Master Data                                                              */
  /* ------------------------------------------------------------------------ */

  const [products, setProducts] = useState<Product[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<
    ExpenseType[]
  >([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [dailySales, setDailySales] = useState<
    DailySalesRecord[]
  >([]);

  /* ------------------------------------------------------------------------ */
  /* Stock                                                                    */
  /* ------------------------------------------------------------------------ */

  const [stock, setStock] = useState({
    productId: "",
    tankId: "",
    beforeDipping: "",
    quantity: "",
  });

  /* ------------------------------------------------------------------------ */
  /* Single Daily Sale                                                        */
  /* ------------------------------------------------------------------------ */

  const [dailySale, setDailySale] = useState({
    productId: "",
    nozzleId: "",
    currentMeter: "",
  });

  /* ------------------------------------------------------------------------ */
  /* Credit                                                                    */
  /* ------------------------------------------------------------------------ */

  const [credit, setCredit] = useState({
    productId: "",
    customerId: "",
    quantity: "",
    invoiceNumber: "",
    comments: "",
  });

  /* ------------------------------------------------------------------------ */
  /* Sample Reading                                                           */
  /* ------------------------------------------------------------------------ */

  const [sample, setSample] = useState({
    nozzleId: "",
    quantity: "",
    notes: "",
  });

  /* ------------------------------------------------------------------------ */
  /* Vehicle Stock                                                            */
  /* ------------------------------------------------------------------------ */

  const [vehicleStock, setVehicleStock] = useState({
    vehicleId: "",
    productId: "",
    tankId: "",
    newStock: "",
    notes: "",
  });

  /* ------------------------------------------------------------------------ */
  /* Expense                                                                   */
  /* ------------------------------------------------------------------------ */

  const [expense, setExpense] = useState({
    amount: "",
    expenseTypeId: "",
    comment: "",
    expenseDate: today(),
  });

  /* ------------------------------------------------------------------------ */
  /* Derived Data                                                              */
  /* ------------------------------------------------------------------------ */

  const activeDaily = useMemo(
    () =>
      dailySales.find(
        (daily) => daily.status === "ACTIVE"
      ) ?? null,
    [dailySales]
  );

  const fuelProducts = useMemo(
    () =>
      products.filter((product) =>
        ["PETROL", "DIESEL"].includes(
          product.productType
        )
      ),
    [products]
  );

  const nozzleViews = useMemo(
    () => nozzles.map(toManagerNozzle),
    [nozzles]
  );

  const activeNozzleViews = useMemo(
    () =>
      nozzleViews.filter(
        (nozzle) => nozzle.active !== false
      ),
    [nozzleViews]
  );

  const selectedStockTank = useMemo(
    () =>
      tanks.find(
        (tank) => tank.id === stock.tankId
      ),
    [stock.tankId, tanks]
  );

  const selectedNozzle = useMemo(
    () =>
      nozzleViews.find(
        (nozzle) =>
          nozzle.id === dailySale.nozzleId
      ),
    [dailySale.nozzleId, nozzleViews]
  );

  const selectedSampleNozzle = useMemo(
    () =>
      nozzleViews.find(
        (nozzle) => nozzle.id === sample.nozzleId
      ),
    [sample.nozzleId, nozzleViews]
  );

  const selectedCreditProduct = useMemo(
    () =>
      fuelProducts.find(
        (product) =>
          product.id === credit.productId
      ),
    [credit.productId, fuelProducts]
  );

  const selectedVehicleTank = useMemo(
    () =>
      tanks.find(
        (tank) => tank.id === vehicleStock.tankId
      ),
    [vehicleStock.tankId, tanks]
  );

  const sortedTanks = useMemo(
    () =>
      [...tanks].sort(
        (a, b) =>
          getTankPercentage(a) -
          getTankPercentage(b)
      ),
    [tanks]
  );

  const creditTotal =
    Number(credit.quantity || 0) *
    Number(
      selectedCreditProduct?.currentPrice || 0
    );

  /* ------------------------------------------------------------------------ */
  /* Single Meter Calculation                                                 */
  /* ------------------------------------------------------------------------ */

  const oldMeter = Number(
    selectedNozzle?.currentMeter ??
      selectedNozzle?.openingMeter ??
      0
  );

  const saleQuantity = selectedNozzle
    ? Math.max(
        0,
        Number(dailySale.currentMeter || 0) -
          oldMeter
      )
    : 0;

  const nozzlePrice = Number(
    selectedNozzle?.tank?.product?.currentPrice ??
      fuelProducts.find(
        (product) =>
          product.id === dailySale.productId
      )?.currentPrice ??
      0
  );

  const saleAmount =
    saleQuantity * nozzlePrice;

  /* ------------------------------------------------------------------------ */
  /* Today / Yesterday KPI                                                    */
  /* ------------------------------------------------------------------------ */

  const todaySalesRecord = useMemo(() => {
    const currentDate = today();

    return (
      dailySales.find(
        (record) =>
          dateKey(record.businessDate) ===
          currentDate
      ) ?? activeDaily
    );
  }, [activeDaily, dailySales]);

  const yesterdaySalesRecord = useMemo(() => {
    const yesterday = getDateOffset(-1);

    return (
      dailySales.find(
        (record) =>
          dateKey(record.businessDate) ===
          yesterday
      ) ?? null
    );
  }, [dailySales]);

  const todaySalesAmount = Number(
    todaySalesRecord?.totalAmount || 0
  );

  const yesterdaySalesAmount = Number(
    yesterdaySalesRecord?.totalAmount || 0
  );

  const salesTrend = useMemo(() => {
    if (!yesterdaySalesRecord) {
      return "No prior day";
    }

    if (
      yesterdaySalesAmount === 0 &&
      todaySalesAmount > 0
    ) {
      return "New sales";
    }

    if (yesterdaySalesAmount === 0) {
      return "No change";
    }

    const percentage =
      ((todaySalesAmount -
        yesterdaySalesAmount) /
        yesterdaySalesAmount) *
      100;

    return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(
      1
    )}%`;
  }, [
    todaySalesAmount,
    yesterdaySalesAmount,
    yesterdaySalesRecord,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Bulk Meter Calculations                                                  */
  /* ------------------------------------------------------------------------ */

  const bulkMeterSummary = useMemo(() => {
    let totalQuantity = 0;
    let totalAmount = 0;
    let completedCount = 0;

    for (const row of bulkMeterRows) {
      const nozzle = activeNozzleViews.find(
        (item) => item.id === row.nozzleId
      );

      if (!nozzle) continue;

      const old = Number(
        nozzle.currentMeter ??
          nozzle.openingMeter ??
          0
      );

      const current = Number(
        row.currentMeter || 0
      );

      const quantity = Math.max(
        0,
        current - old
      );

      const price = Number(
        nozzle.tank?.product?.currentPrice ||
          0
      );

      if (row.currentMeter) {
        completedCount += 1;
      }

      totalQuantity += quantity;
      totalAmount += quantity * price;
    }

    return {
      totalQuantity,
      totalAmount,
      completedCount,
      totalNozzles: activeNozzleViews.length,
    };
  }, [activeNozzleViews, bulkMeterRows]);

  /* ------------------------------------------------------------------------ */
  /* Load                                                                      */
  /* ------------------------------------------------------------------------ */

  async function load(): Promise<boolean> {
    try {
      setError("");

      const [
        productResponse,
        tankResponse,
        nozzleResponse,
        customerResponse,
        dailySalesResponse,
        expenseTypeResponse,
        vehicleResponse,
      ] = await Promise.all([
        getManagerProducts(),
        getManagerTanks(),
        getManagerNozzles(),
        getResource<Customer[]>("/customers"),
        getActiveDailySales(),
        getResource<ExpenseType[]>(
          "/expense-types"
        ).catch(
          () => [] as ExpenseType[]
        ),
        getResource<Vehicle[]>(
          "/vehicles"
        ).catch(
          () => [] as Vehicle[]
        ),
      ]);

      setProducts(
        productResponse.filter(
          (product) => product.active
        )
      );

      setTanks(
        tankResponse.filter(
          (tank) => tank.active
        )
      );

      setNozzles(
        nozzleResponse.filter(
          (nozzle) => nozzle.active
        )
      );

      setCustomers(
        Array.isArray(customerResponse)
          ? customerResponse
          : []
      );

      setDailySales(
        dailySalesResponse
      );

      setExpenseTypes(
        Array.isArray(expenseTypeResponse)
          ? expenseTypeResponse.filter(
              (expenseType) =>
                expenseType.active !== false
            )
          : []
      );

      setVehicles(
        Array.isArray(vehicleResponse)
          ? vehicleResponse.filter(
              (vehicle) => vehicle.active !== false
            )
          : []
      );

      setLastUpdated(new Date());

      return true;
    } catch (loadError: unknown) {
      const message = getErrorMessage(
        loadError,
        "Unable to load manager data."
      );

      setError(message);

      setToast({
        type: "error",
        message,
      });

      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const frame =
      window.requestAnimationFrame(() => {
        setTankAnimationReady(true);
      });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast]);

  /* ------------------------------------------------------------------------ */
  /* Notifications                                                             */
  /* ------------------------------------------------------------------------ */

  function showSuccess(message: string) {
    setToast({
      type: "success",
      message,
    });
  }

  function showError(message: string) {
    setError(message);

    setToast({
      type: "error",
      message,
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Close                                                                     */
  /* ------------------------------------------------------------------------ */

  function close() {
    if (!saving) {
      setAction(null);
      setBulkMeterEnabled(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Open Daily Sale                                                           */
  /* ------------------------------------------------------------------------ */

  function openDailySale() {
    if (!activeDaily) {
      showError(
        "Open a business day from the Daily Sales tab first."
      );

      return;
    }

    setBulkMeterEnabled(false);

    setDailySale({
      productId: "",
      nozzleId: "",
      currentMeter: "",
    });

    setAction("dailySale");
  }

  /* ------------------------------------------------------------------------ */
  /* Open Bulk Meter                                                           */
  /* ------------------------------------------------------------------------ */

  function openBulkMeterReading() {
    if (!activeDaily) {
      showError("Open a business day first.");
      return;
    }

    const rows: BulkMeterRow[] =
      activeNozzleViews.map((nozzle) => ({
        nozzleId: nozzle.id,
        currentMeter: String(
          nozzle.currentMeter ??
            nozzle.openingMeter ??
            ""
        ),
      }));

    setBulkMeterRows(rows);
    setBulkMeterEnabled(true);
  }

  /* ------------------------------------------------------------------------ */
  /* Product Change                                                            */
  /* ------------------------------------------------------------------------ */

  function handleProductChange(
    productId: string
  ) {
    const firstNozzle =
      activeNozzleViews.find(
        (nozzle) =>
          nozzle.tank?.product?.id ===
          productId
      );

    setDailySale({
      productId,
      nozzleId: firstNozzle?.id || "",
      currentMeter: firstNozzle
        ? String(
            firstNozzle.currentMeter ??
              firstNozzle.openingMeter ??
              ""
          )
        : "",
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Nozzle Change                                                             */
  /* ------------------------------------------------------------------------ */

  function handleNozzleChange(
    nozzleId: string
  ) {
    const nozzle =
      activeNozzleViews.find(
        (item) => item.id === nozzleId
      );

    const productId =
      nozzle?.tank?.product?.id ||
      dailySale.productId;

    setDailySale({
      productId,
      nozzleId,
      currentMeter: nozzle
        ? String(
            nozzle.currentMeter ??
              nozzle.openingMeter ??
              ""
          )
        : "",
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Bulk Meter Input                                                          */
  /* ------------------------------------------------------------------------ */

  function handleBulkMeterChange(
    nozzleId: string,
    value: string
  ) {
    setBulkMeterRows((currentRows) =>
      currentRows.map((row) =>
        row.nozzleId === nozzleId
          ? {
              ...row,
              currentMeter: value,
            }
          : row
      )
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Refresh                                                                    */
  /* ------------------------------------------------------------------------ */

  async function handleRefresh() {
    setRefreshing(true);

    const refreshed = await load();

    if (refreshed) {
      showSuccess(
        "Manager data refreshed."
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Stock Submit                                                              */
  /* ------------------------------------------------------------------------ */

  async function submitStock(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !stock.productId ||
      !stock.tankId ||
      Number(stock.quantity) <= 0
    ) {
      showError(
        "Select product, tank and valid quantity."
      );

      return;
    }

    setSaving(true);

    try {
      await addManagerStock({
        productId: stock.productId,
        tankId: stock.tankId,
        beforeDipping: Number(
          stock.beforeDipping || 0
        ),
        quantity: Number(stock.quantity),
      });

      setStock({
        productId: "",
        tankId: "",
        beforeDipping: "",
        quantity: "",
      });

      setAction(null);

      await load();

      showSuccess(
        "Stock added successfully."
      );
    } catch (saveError: unknown) {
      showError(
        getErrorMessage(
          saveError,
          "Unable to add stock."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Single Meter Submit                                                       */
  /* ------------------------------------------------------------------------ */

  async function submitDailySale(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!activeDaily) {
      showError(
        "Open a business day first."
      );

      return;
    }

    if (
      !dailySale.nozzleId ||
      !dailySale.currentMeter
    ) {
      showError(
        "Select an output nozzle and enter the current meter."
      );

      return;
    }

    if (
      Number(dailySale.currentMeter) <
      Number(
        selectedNozzle?.currentMeter ?? 0
      )
    ) {
      showError(
        "Current meter cannot be lower than the old meter."
      );

      return;
    }

    setSaving(true);

    try {
      await createMeterSale({
        dailySalesId: activeDaily.id,
        nozzleId: dailySale.nozzleId,
        currentMeter: Number(
          dailySale.currentMeter
        ),
      });

      await load();

      setDailySale({
        productId: "",
        nozzleId: "",
        currentMeter: "",
      });

      showSuccess(
        "Daily meter sale saved."
      );
    } catch (saveError: unknown) {
      showError(
        getErrorMessage(
          saveError,
          "Unable to save daily sales."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* BULK METER SUBMIT                                                        */
  /* ------------------------------------------------------------------------ */

  async function submitBulkMeterReadings(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!activeDaily) {
      showError(
        "Open a business day first."
      );

      return;
    }

    if (!activeNozzleViews.length) {
      showError(
        "No active nozzles are available."
      );

      return;
    }

    const invalidRow =
      bulkMeterRows.find((row) => {
        const nozzle =
          activeNozzleViews.find(
            (item) =>
              item.id === row.nozzleId
          );

        if (!nozzle) return true;

        if (!row.currentMeter) {
          return true;
        }

        const oldMeter = Number(
          nozzle.currentMeter ??
            nozzle.openingMeter ??
            0
        );

        return (
          Number(row.currentMeter) <
          oldMeter
        );
      });

    if (invalidRow) {
      showError(
        "Please enter valid current meter values. Current meter cannot be lower than old meter."
      );

      return;
    }

    setSaving(true);

    try {
      /*
       * Current backend has single meter-sale API.
       * Therefore bulk save calls the same API once
       * for every active nozzle.
       */

      for (const row of bulkMeterRows) {
        await createMeterSale({
          dailySalesId: activeDaily.id,
          nozzleId: row.nozzleId,
          currentMeter: Number(
            row.currentMeter
          ),
        });
      }

      await load();

      setBulkMeterRows([]);
      setBulkMeterEnabled(false);
      setAction(null);

      showSuccess(
        `${bulkMeterSummary.totalNozzles} nozzle meter readings saved successfully.`
      );
    } catch (saveError: unknown) {
      showError(
        getErrorMessage(
          saveError,
          "Unable to save bulk meter readings."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Credit Submit                                                             */
  /* ------------------------------------------------------------------------ */

  async function submitCredit(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!activeDaily) {
      showError(
        "Open a business day first."
      );

      return;
    }

    if (
      !credit.productId ||
      !credit.customerId ||
      Number(credit.quantity) <= 0
    ) {
      showError(
        "Select customer, product and a valid quantity."
      );

      return;
    }

    setSaving(true);

    try {
      await createCreditSale({
        dailySalesId: activeDaily.id,
        productId: credit.productId,
        customerId: credit.customerId,
        quantity: Number(credit.quantity),
        invoiceNumber: credit.invoiceNumber || undefined,
        comments: credit.comments || undefined,
      });

      setCredit({
        productId: "",
        customerId: "",
        quantity: "",
        invoiceNumber: "",
        comments: "",
      });

      setAction(null);

      await load();

      showSuccess(
        "Credit sale saved successfully."
      );
    } catch (saveError: unknown) {
      showError(
        getErrorMessage(
          saveError,
          "Unable to save credit sale."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Sample Reading Submit                                                    */
  /* ------------------------------------------------------------------------ */

  async function submitSample(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!activeDaily) {
      showError(
        "Open a business day first."
      );

      return;
    }

    if (
      !sample.nozzleId ||
      Number(sample.quantity) <= 0
    ) {
      showError(
        "Select a nozzle and enter a valid sample quantity."
      );

      return;
    }

    setSaving(true);

    try {
      await createSampleReading({
        dailySalesId: activeDaily.id,
        readings: [
          {
            nozzleId: sample.nozzleId,
            quantity: Number(sample.quantity),
            notes: sample.notes || undefined,
          },
        ],
      });

      setSample({
        nozzleId: "",
        quantity: "",
        notes: "",
      });

      setAction(null);

      await load();

      showSuccess(
        "Sample reading saved successfully."
      );
    } catch (saveError: unknown) {
      showError(
        getErrorMessage(
          saveError,
          "Unable to save sample reading."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Vehicle Stock Submit                                                     */
  /* ------------------------------------------------------------------------ */

  async function submitVehicleStock(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !vehicleStock.vehicleId ||
      !vehicleStock.productId ||
      !vehicleStock.tankId ||
      Number(vehicleStock.newStock) < 0
    ) {
      showError(
        "Select vehicle, product, tank and enter a valid stock value."
      );

      return;
    }

    setSaving(true);

    try {
      await createVehicleStock({
        vehicleId: vehicleStock.vehicleId,
        productId: vehicleStock.productId,
        tankId: vehicleStock.tankId,
        newStock: Number(vehicleStock.newStock),
        notes: vehicleStock.notes || undefined,
      });

      setVehicleStock({
        vehicleId: "",
        productId: "",
        tankId: "",
        newStock: "",
        notes: "",
      });

      setAction(null);

      await load();

      showSuccess(
        "Vehicle stock saved successfully."
      );
    } catch (saveError: unknown) {
      showError(
        getErrorMessage(
          saveError,
          "Unable to save vehicle stock."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Expense Submit                                                            */
  /* ------------------------------------------------------------------------ */

  async function submitExpense(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!activeDaily) {
      showError(
        "Open a business day first."
      );

      return;
    }

    if (
      !expense.expenseTypeId ||
      Number(expense.amount) <= 0
    ) {
      showError(
        "Select an expense type and enter a valid amount."
      );

      return;
    }

    setSaving(true);

    try {
      await createExpense({
        dailySalesId: activeDaily.id,
        expenseTypeId:
          expense.expenseTypeId,
        amount: Number(expense.amount),
        comment:
          expense.comment || undefined,
        expenseDate:
          expense.expenseDate,
      });

      setExpense({
        amount: "",
        expenseTypeId: "",
        comment: "",
        expenseDate: today(),
      });

      setAction(null);

      await load();

      showSuccess(
        "Expense saved successfully."
      );
    } catch (saveError: unknown) {
      showError(
        getErrorMessage(
          saveError,
          "Unable to save expense."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  /* ======================================================================== */
  /* RENDER                                                                   */
  /* ======================================================================== */

  return (
    <div className="space-y-5 pb-8">
      {/* -------------------------------------------------------------------- */}
      {/* Header                                                               */}
      {/* -------------------------------------------------------------------- */}

      <header className="sticky top-2 z-30 rounded-3xl border border-slate-200/80 bg-slate-50/95 p-4 shadow-sm backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge bg-blue-50 text-brand-600">
                MANAGER OPERATIONS
              </span>

              {activeDaily ? (
                <span className="badge bg-emerald-50 text-emerald-600">
                  DAY ACTIVE
                </span>
              ) : (
                <span className="badge bg-amber-50 text-amber-600">
                  NO ACTIVE DAY
                </span>
              )}

              {lastUpdated && (
                <span className="hidden items-center gap-1 text-[10px] text-slate-400 sm:inline-flex">
                  <Clock3 size={11} />
                  Last updated{" "}
                  {formatTime(lastUpdated)}
                </span>
              )}
            </div>

            <div className="mt-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Track Petrol Sales
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Record meter sales, bulk meter
                readings, credit sales, stock and
                expenses from one workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* <button
              type="button"
              onClick={() =>
                navigate("/daily-sales")
              }
              className="btn-secondary"
            >
              Daily Sales
            </button> */}

            <button
              type="button"
              onClick={() =>
                navigate("/customers")
              }
              className="btn-secondary"
            >
              Customer
            </button>

            <button
              type="button"
              onClick={() =>
                void handleRefresh()
              }
              disabled={refreshing}
              className="btn-secondary"
            >
              {refreshing ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <RefreshCw size={15} />
              )}

              Refresh
            </button>
          </div>
        </div>

        {lastUpdated && (
          <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-400 sm:hidden">
            <Clock3 size={11} />
            Last updated{" "}
            {formatTime(lastUpdated)}
          </div>
        )}
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* Error                                                                */}
      {/* -------------------------------------------------------------------- */}

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="shrink-0 rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* KPI Cards                                                            */}
      {/* -------------------------------------------------------------------- */}

      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Today's Sales"
            value={money(
              todaySalesAmount
            )}
            subtitle="Current business day"
            trend={salesTrend}
            icon={TrendingUp}
            tone="blue"
            loading={loading}
          />

          <KpiCard
            label="Yesterday's Sales"
            value={money(
              yesterdaySalesAmount
            )}
            subtitle="Previous business day"
            trend={
              yesterdaySalesRecord
                ? "Previous day"
                : "No data"
            }
            icon={ArrowUpRight}
            tone="cyan"
            loading={loading}
          />

          <KpiCard
            label="Active Tanks"
            value={String(tanks.length)}
            subtitle="Available tank masters"
            trend="Live"
            icon={Droplets}
            tone="indigo"
            loading={loading}
          />

          <KpiCard
            label="Active Nozzles"
            value={String(
              activeNozzleViews.length
            )}
            subtitle="Ready for meter entry"
            trend="Live"
            icon={Gauge}
            tone="amber"
            loading={loading}
          />
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* Quick Actions                                                        */}
      {/* -------------------------------------------------------------------- */}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Common manager operations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
          {actions.map((item) => (
            <QuickActionCard
              key={item.key}
              label={item.label}
              subtitle={item.subtitle}
              icon={item.icon}
              tone={item.tone}
              configured={item.configured}
              onClick={() => {
                if (
                  item.key === "dailySale"
                ) {
                  openDailySale();
                  return;
                }

                if (item.key === "sample") {
                  if (!activeDaily) {
                    showError(
                      "Open a business day first."
                    );
                    return;
                  }

                  setSample({
                    nozzleId: "",
                    quantity: "",
                    notes: "",
                  });
                }

                if (item.key === "vehicle") {
                  setVehicleStock({
                    vehicleId: "",
                    productId: "",
                    tankId: "",
                    newStock: "",
                    notes: "",
                  });
                }

                setAction(item.key);
              }}
              onConfigure={() => {
                setAction(item.key);
              }}
            />
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* Recent Sales                                                         */}
      {/* -------------------------------------------------------------------- */}

      <div className="grid gap-5 xl:grid-cols-1">
        <RecentSalesTable
          rows={dailySales}
          loading={loading}
          onViewAll={() =>
            navigate("/daily-sales")
          }
        />
      </div>

      {/* ==================================================================== */}
      {/* STOCK MODAL                                                          */}
      {/* ==================================================================== */}

      {action === "stock" && (
        <Modal
          title="Add Stock"
          subtitle="Record tank loading with dip reading."
          onClose={close}
        >
          <form
            onSubmit={submitStock}
            className="space-y-4"
          >
            <Field label="Product">
              <select
                className="input"
                value={stock.productId}
                onChange={(event) =>
                  setStock({
                    ...stock,
                    productId:
                      event.target.value,
                    tankId: "",
                  })
                }
              >
                <option value="">
                  Select Product
                </option>

                {fuelProducts.map(
                  (product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Tank">
              <select
                className="input"
                value={stock.tankId}
                onChange={(event) =>
                  setStock({
                    ...stock,
                    tankId:
                      event.target.value,
                  })
                }
              >
                <option value="">
                  Select Tank
                </option>

                {tanks
                  .filter(
                    (tank) =>
                      !stock.productId ||
                      tank.productId ===
                        stock.productId
                  )
                  .map((tank) => (
                    <option
                      key={tank.id}
                      value={tank.id}
                    >
                      {tank.name}
                    </option>
                  ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Before Dipping">
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={
                    stock.beforeDipping
                  }
                  onChange={(event) =>
                    setStock({
                      ...stock,
                      beforeDipping:
                        event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Quantity Loaded">
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={stock.quantity}
                  onChange={(event) =>
                    setStock({
                      ...stock,
                      quantity:
                        event.target.value,
                    })
                  }
                />
              </Field>
            </div>

            {selectedStockTank && (
              <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                Current stock{" "}
                <b>
                  {num(
                    selectedStockTank.availableStock
                  )}
                </b>{" "}
                · Capacity{" "}
                <b>
                  {num(
                    selectedStockTank.capacity
                  )}
                </b>
              </div>
            )}

            <ModalFooter
              saving={saving}
              onClose={close}
              label="Add Stock"
            />
          </form>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* DAILY SALES MODAL                                                    */}
      {/* ==================================================================== */}

      {action === "dailySale" &&
        !bulkMeterEnabled && (
          <Modal
            title="Add Daily Sales"
            subtitle="Record meter reading for one nozzle."
            onClose={close}
          >
            <form
              onSubmit={submitDailySale}
              className="space-y-4"
            >
              {/* Bulk Toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <Gauge size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Bulk Meter Reading
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Enter meter readings for all active nozzles at once.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={
                    bulkMeterEnabled
                  }
                  onClick={() =>
                    openBulkMeterReading()
                  }
                  className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                    bulkMeterEnabled
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                      bulkMeterEnabled
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Product */}
              <Field label="Product">
                <select
                  className="input"
                  value={
                    dailySale.productId
                  }
                  onChange={(event) =>
                    handleProductChange(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select Product
                  </option>

                  {fuelProducts.map(
                    (product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name}
                      </option>
                    )
                  )}
                </select>
              </Field>

              {/* Nozzle */}
              <Field label="Output Nozzle">
                <select
                  className="input"
                  value={
                    dailySale.nozzleId
                  }
                  onChange={(event) =>
                    handleNozzleChange(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select Output Nozzle
                  </option>

                  {activeNozzleViews
                    .filter(
                      (nozzle) =>
                        !dailySale.productId ||
                        nozzle.tank?.product?.id ===
                          dailySale.productId
                    )
                    .map((nozzle) => (
                      <option
                        key={nozzle.id}
                        value={nozzle.id}
                      >
                        {nozzle.tank?.name ||
                          "Tank"}{" "}
                        -{" "}
                        {nozzle.name ||
                          "Nozzle"}
                      </option>
                    ))}
                </select>
              </Field>

              {/* Meter */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Old Meter Value">
                  <input
                    className="input bg-slate-50"
                    readOnly
                    value={
                      selectedNozzle
                        ? num(
                            selectedNozzle.currentMeter ??
                              selectedNozzle.openingMeter
                          )
                        : ""
                    }
                  />
                </Field>

                <Field label="Current Meter Value">
                  <input
                    className="input"
                    type="number"
                    min={oldMeter}
                    step="0.01"
                    value={
                      dailySale.currentMeter
                    }
                    onChange={(event) =>
                      setDailySale({
                        ...dailySale,
                        currentMeter:
                          event.target.value,
                      })
                    }
                  />
                </Field>
              </div>

              {/* Result */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold text-emerald-700">
                    Sale Quantity
                  </p>

                  <p className="mt-1 text-xl font-extrabold text-emerald-700">
                    {num(saleQuantity)}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700">
                    Sale Amount
                  </p>

                  <p className="mt-1 text-xl font-extrabold text-blue-700">
                    {money(saleAmount)}
                  </p>
                </div>
              </div>

              <ModalFooter
                saving={saving}
                onClose={close}
                label="Save and Next"
              />
            </form>
          </Modal>
        )}

      {/* ==================================================================== */}
      {/* BULK METER READING MODAL                                             */}
      {/* ==================================================================== */}

      {action === "dailySale" &&
        bulkMeterEnabled && (
          <Modal
            title="Bulk Meter Reading"
            subtitle={`Enter current meter readings for all ${activeNozzleViews.length} active nozzles.`}
            onClose={close}
            wide
          >
            <form
              onSubmit={
                submitBulkMeterReadings
              }
              className="space-y-5"
            >
              {/* Header Summary */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-blue-500">
                    Total Nozzles
                  </p>

                  <p className="mt-1 text-2xl font-extrabold text-blue-600">
                    {
                      bulkMeterSummary.totalNozzles
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                    Entered
                  </p>

                  <p className="mt-1 text-2xl font-extrabold text-emerald-600">
                    {
                      bulkMeterSummary.completedCount
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">
                    Total Quantity
                  </p>

                  <p className="mt-1 text-2xl font-extrabold text-amber-600">
                    {num(
                      bulkMeterSummary.totalQuantity
                    )}{" "}
                    L
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">
                    Total Amount
                  </p>

                  <p className="mt-1 text-2xl font-extrabold text-indigo-600">
                    {money(
                      bulkMeterSummary.totalAmount
                    )}
                  </p>
                </div>
              </div>

              {/* Nozzle Table */}
              {activeNozzleViews.length ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          <th className="px-4 py-3 text-left">
                            Nozzle
                          </th>

                          <th className="px-4 py-3 text-left">
                            Tank
                          </th>

                          <th className="px-4 py-3 text-left">
                            Product
                          </th>

                          <th className="px-4 py-3 text-right">
                            Old Meter
                          </th>

                          <th className="px-4 py-3 text-right">
                            Current Meter
                          </th>

                          <th className="px-4 py-3 text-right">
                            Sale Qty
                          </th>

                          <th className="px-4 py-3 text-right">
                            Amount
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {activeNozzleViews.map(
                          (nozzle) => {
                            const row =
                              bulkMeterRows.find(
                                (item) =>
                                  item.nozzleId ===
                                  nozzle.id
                              );

                            const old =
                              Number(
                                nozzle.currentMeter ??
                                  nozzle.openingMeter ??
                                  0
                              );

                            const current =
                              Number(
                                row?.currentMeter ||
                                  0
                              );

                            const quantity =
                              Math.max(
                                0,
                                current - old
                              );

                            const price =
                              Number(
                                nozzle.tank?.product
                                  ?.currentPrice ||
                                  0
                              );

                            const amount =
                              quantity * price;

                            const invalid =
                              row?.currentMeter &&
                              current < old;

                            return (
                              <tr
                                key={
                                  nozzle.id
                                }
                                className="border-t border-slate-100 hover:bg-slate-50/60"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                                      <Gauge
                                        size={
                                          15
                                        }
                                      />
                                    </span>

                                    <div>
                                      <p className="font-bold text-slate-800">
                                        {nozzle.name ||
                                          "Nozzle"}
                                      </p>

                                      <p className="text-[10px] text-slate-400">
                                        {
                                          nozzle.id
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <span className="font-semibold text-slate-700">
                                    {nozzle
                                      .tank
                                      ?.name ||
                                      "Tank"}
                                  </span>
                                </td>

                                <td className="px-4 py-3">
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                    {getProductTypeLabel(
                                      nozzle
                                        .tank
                                        ?.product
                                        ?.productType
                                    )}
                                  </span>
                                </td>

                                <td className="px-4 py-3 text-right">
                                  <span className="font-semibold tabular-nums text-slate-500">
                                    {num(old)}
                                  </span>
                                </td>

                                <td className="px-4 py-3">
                                  <input
                                    className={`input min-w-[150px] text-right font-bold tabular-nums ${
                                      invalid
                                        ? "border-red-300 bg-red-50 text-red-600"
                                        : ""
                                    }`}
                                    type="number"
                                    min={old}
                                    step="0.01"
                                    value={
                                      row?.currentMeter ??
                                      ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleBulkMeterChange(
                                        nozzle.id,
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  />
                                </td>

                                <td className="px-4 py-3 text-right">
                                  <span className="font-bold tabular-nums text-emerald-600">
                                    {num(
                                      quantity
                                    )}
                                  </span>
                                </td>

                                <td className="px-4 py-3 text-right">
                                  <span className="font-bold tabular-nums text-blue-600">
                                    {money(
                                      amount
                                    )}
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>

                      <tfoot className="border-t border-slate-200 bg-slate-50">
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-4 text-right text-xs font-extrabold uppercase tracking-wide text-slate-500"
                          >
                            Bulk Total
                          </td>

                          <td className="px-4 py-4 text-right">
                            <span className="text-base font-extrabold text-emerald-600">
                              {num(
                                bulkMeterSummary.totalQuantity
                              )}{" "}
                              L
                            </span>
                          </td>

                          <td className="px-4 py-4 text-right">
                            <span className="text-base font-extrabold text-blue-600">
                              {money(
                                bulkMeterSummary.totalAmount
                              )}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Gauge}
                  title="No active nozzles"
                  description="Create or activate nozzles before entering bulk meter readings."
                />
              )}

              {/* Bottom Information */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <ClipboardList
                      size={17}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-blue-800">
                      Bulk meter update
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Old meter values are loaded
                      automatically from the active nozzle
                      records. Enter only the current meter
                      values. Sale quantity and amount are
                      calculated automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setBulkMeterEnabled(
                      false
                    )
                  }
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Single Meter Reading
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={close}
                    disabled={saving}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !activeNozzleViews.length ||
                      bulkMeterSummary.completedCount !==
                        bulkMeterSummary.totalNozzles
                    }
                    className="btn-primary"
                  >
                    {saving && (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    )}

                    {saving
                      ? "Saving All..."
                      : "Save All Meter Readings"}
                  </button>
                </div>
              </div>
            </form>
          </Modal>
        )}

      {/* ==================================================================== */}
      {/* CREDIT MODAL                                                         */}
      {/* ==================================================================== */}

      {action === "credit" && (
        <Modal
          title="Add Credit Sales"
          subtitle="Product price is looked up automatically from the product master."
          onClose={close}
        >
          <form
            onSubmit={submitCredit}
            className="space-y-4"
          >
            <Field label="Customer">
              <select
                className="input"
                value={credit.customerId}
                onChange={(event) =>
                  setCredit({
                    ...credit,
                    customerId:
                      event.target.value,
                  })
                }
              >
                <option value="">
                  Select Customer
                </option>

                {customers.map(
                  (customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name}
                      {customer.phone
                        ? ` · ${customer.phone}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Product">
              <select
                className="input"
                value={credit.productId}
                onChange={(event) =>
                  setCredit({
                    ...credit,
                    productId:
                      event.target.value,
                  })
                }
              >
                <option value="">
                  Select Product
                </option>

                {fuelProducts.map(
                  (product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} ·{" "}
                      {money(
                        product.currentPrice
                      )}
                    </option>
                  )
                )}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quantity">
                <input
                  className="input"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={credit.quantity}
                  onChange={(event) =>
                    setCredit({
                      ...credit,
                      quantity:
                        event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Unit Price">
                <input
                  className="input bg-slate-50 font-bold"
                  readOnly
                  value={
                    selectedCreditProduct
                      ? money(
                          selectedCreditProduct.currentPrice
                        )
                      : ""
                  }
                />
              </Field>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-700">
                Total Credit Amount
              </p>

              <p className="mt-1 text-2xl font-extrabold text-blue-700">
                {money(creditTotal)}
              </p>
            </div>

            <Field label="Bill Number">
              <input
                className="input"
                value={
                  credit.invoiceNumber
                }
                onChange={(event) =>
                  setCredit({
                    ...credit,
                    invoiceNumber:
                      event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Comments">
              <textarea
                className="input min-h-24"
                value={credit.comments}
                onChange={(event) =>
                  setCredit({
                    ...credit,
                    comments:
                      event.target.value,
                  })
                }
              />
            </Field>

            <ModalFooter
              saving={saving}
              onClose={close}
              label="Save Credit Sale"
            />
          </form>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* SAMPLE READING MODAL                                                 */}
      {/* ==================================================================== */}

      {action === "sample" && (
        <Modal
          title="Sample Reading"
          subtitle="Record fuel sample quantity against an active nozzle."
          onClose={close}
        >
          <form
            onSubmit={submitSample}
            className="space-y-4"
          >
            <Field label="Output Nozzle">
              <select
                className="input"
                value={sample.nozzleId}
                onChange={(event) =>
                  setSample({
                    ...sample,
                    nozzleId: event.target.value,
                  })
                }
              >
                <option value="">
                  Select Output Nozzle
                </option>

                {activeNozzleViews.map(
                  (nozzle) => (
                    <option
                      key={nozzle.id}
                      value={nozzle.id}
                    >
                      {nozzle.tank?.name ||
                        "Tank"}{" "}
                      -{" "}
                      {nozzle.name ||
                        "Nozzle"}{" "}
                      (
                      {getProductTypeLabel(
                        nozzle.tank?.product
                          ?.productType
                      )}
                      )
                    </option>
                  )
                )}
              </select>
            </Field>

            {selectedSampleNozzle && (
              <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                Tank{" "}
                <b>
                  {selectedSampleNozzle.tank
                    ?.name || "—"}
                </b>{" "}
                · Product{" "}
                <b>
                  {getProductTypeLabel(
                    selectedSampleNozzle.tank
                      ?.product?.productType
                  )}
                </b>
              </div>
            )}

            <Field label="Sample Quantity (L)">
              <input
                className="input"
                type="number"
                min="0.001"
                step="0.001"
                value={sample.quantity}
                onChange={(event) =>
                  setSample({
                    ...sample,
                    quantity:
                      event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Notes">
              <textarea
                className="input min-h-24"
                value={sample.notes}
                onChange={(event) =>
                  setSample({
                    ...sample,
                    notes: event.target.value,
                  })
                }
                placeholder="Nozzle calibration sample reading"
              />
            </Field>

            <ModalFooter
              saving={saving}
              onClose={close}
              label="Save Sample Reading"
            />
          </form>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* VEHICLE STOCK MODAL                                                  */}
      {/* ==================================================================== */}

      {action === "vehicle" && (
        <Modal
          title="Vehicle Stock"
          subtitle="Reconcile vehicle stock against tank and product."
          onClose={close}
        >
          <form
            onSubmit={submitVehicleStock}
            className="space-y-4"
          >
            <Field label="Vehicle">
              <select
                className="input"
                value={vehicleStock.vehicleId}
                onChange={(event) =>
                  setVehicleStock({
                    ...vehicleStock,
                    vehicleId:
                      event.target.value,
                  })
                }
              >
                <option value="">
                  Select Vehicle
                </option>

                {vehicles.map((vehicle) => (
                  <option
                    key={vehicle.id}
                    value={vehicle.id}
                  >
                    {vehicle.name}
                    {vehicle.vehicleNumber
                      ? ` · ${vehicle.vehicleNumber}`
                      : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Product">
              <select
                className="input"
                value={vehicleStock.productId}
                onChange={(event) =>
                  setVehicleStock({
                    ...vehicleStock,
                    productId:
                      event.target.value,
                    tankId: "",
                  })
                }
              >
                <option value="">
                  Select Product
                </option>

                {fuelProducts.map(
                  (product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Tank">
              <select
                className="input"
                value={vehicleStock.tankId}
                onChange={(event) =>
                  setVehicleStock({
                    ...vehicleStock,
                    tankId:
                      event.target.value,
                  })
                }
              >
                <option value="">
                  Select Tank
                </option>

                {tanks
                  .filter(
                    (tank) =>
                      !vehicleStock.productId ||
                      tank.productId ===
                        vehicleStock.productId
                  )
                  .map((tank) => (
                    <option
                      key={tank.id}
                      value={tank.id}
                    >
                      {tank.name}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label="New Stock (L)">
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={vehicleStock.newStock}
                onChange={(event) =>
                  setVehicleStock({
                    ...vehicleStock,
                    newStock:
                      event.target.value,
                  })
                }
              />
            </Field>

            {selectedVehicleTank && (
              <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                Current tank stock{" "}
                <b>
                  {num(
                    selectedVehicleTank.availableStock
                  )}
                </b>{" "}
                · Capacity{" "}
                <b>
                  {num(
                    selectedVehicleTank.capacity
                  )}
                </b>
              </div>
            )}

            <Field label="Notes">
              <textarea
                className="input min-h-24"
                value={vehicleStock.notes}
                onChange={(event) =>
                  setVehicleStock({
                    ...vehicleStock,
                    notes: event.target.value,
                  })
                }
                placeholder="Vehicle stock reconciliation"
              />
            </Field>

            <ModalFooter
              saving={saving}
              onClose={close}
              label="Save Vehicle Stock"
            />
          </form>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* EXPENSE MODAL                                                        */}
      {/* ==================================================================== */}

      {action === "expense" && (
        <Modal
          title="Add Expense"
          subtitle="Use an existing expense type to avoid validation errors."
          onClose={close}
        >
          <form
            onSubmit={submitExpense}
            className="space-y-4"
          >
            <Field label="Expense Type">
              <select
                className="input"
                value={
                  expense.expenseTypeId
                }
                onChange={(event) =>
                  setExpense({
                    ...expense,
                    expenseTypeId:
                      event.target.value,
                  })
                }
              >
                <option value="">
                  Select Expense Type
                </option>

                {expenseTypes.map(
                  (type) => (
                    <option
                      key={type.id}
                      value={type.id}
                    >
                      {type.name}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Amount">
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={expense.amount}
                onChange={(event) =>
                  setExpense({
                    ...expense,
                    amount:
                      event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Expense Date">
              <input
                className="input"
                type="date"
                value={
                  expense.expenseDate
                }
                onChange={(event) =>
                  setExpense({
                    ...expense,
                    expenseDate:
                      event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Comments">
              <textarea
                className="input min-h-24"
                value={expense.comment}
                onChange={(event) =>
                  setExpense({
                    ...expense,
                    comment:
                      event.target.value,
                  })
                }
              />
            </Field>

            <ModalFooter
              saving={saving}
              onClose={close}
              label="Save Expense"
            />
          </form>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* TOAST                                                                */}
      {/* ==================================================================== */}

      {toast && (
        <div
          className="fixed bottom-5 right-5 z-[60] w-[min(92vw,380px)]"
          role={
            toast.type === "error"
              ? "alert"
              : "status"
          }
        >
          <div
            className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-2xl ${
              toast.type === "success"
                ? "border-emerald-100"
                : "border-red-100"
            }`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={17} />
              ) : (
                <X size={17} />
              )}
            </span>

            <p className="min-w-0 flex-1 pt-1 text-xs font-semibold leading-5 text-slate-700">
              {toast.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setToast(null)
              }
              aria-label="Close notification"
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
