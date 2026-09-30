import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Eye,
  FileText,
  Info,
  Loader2,
  LockKeyhole,
  ReceiptText,
  X,
} from "lucide-react";
import { api } from "../services/api";
import { getOilInvoices } from "../services/oilSalesService";

/* =========================================================
   TYPES
========================================================= */

type Num = string | number | null | undefined;

interface Closure {
  id: string;
  dailySalesId: string;
  startingCashBalance: Num;
  cashSales: Num;
  creditPaymentsReceived: Num;
  paytmAmount: Num;
  ccmsHpPayAmount: Num;
  supplierBankAmount: Num;
  otherPayments: Num;
  expenses: Num;
  expectedCash: Num;
  actualCashEntered: Num;
  difference: Num;
  status: string;
  comments?: string | null;
  closedAt?: string | null;
  dailySales?: { name?: string; businessDate?: string; status?: string };
  closedByUser?: { name?: string } | null;
}

interface Daily {
  id: string;
  name?: string;
  businessDate: string;
  status: string;
}

interface ProductLine {
  productId?: string;
  name: string;
  productType?: string | null;
  quantity?: Num;
  amount: Num;
}

interface CreditReceipt {
  id?: string;
  amount?: Num;
  receivedAmount?: Num;
  paymentMethod?: string | null;
  receiptDate?: string | null;
}

interface CreditSale {
  id: string;
  dailySalesId: string;
  invoiceNumber?: string | null;
  totalAmount: Num;
  status: string;
  saleDate?: string;
  customer?: { id: string; name: string; phone?: string | null } | null;
  cashReceipts?: CreditReceipt[];
}

interface Preview {
  dailySalesId?: string;
  businessDate?: string;
  status?: string;
  startingCashBalance?: Num;
  supplierBankAmount?: Num;
  otherPayments?: Num;
  totalSales?: Num;
  expenses?: Num;
  cashReceipts?: Num;
  expectedCash?: Num;
  actualCashEntered?: Num;
  difference?: Num;
  creditSales?: Num;
  creditReceived?: Num;
  oilSales?: Num;
  petrolItems?: ProductLine[];
  oilItems?: ProductLine[];
}

/** Flexible because the backend may expose slightly different nested shapes. */
interface MeterReadingDetail {
  id: string;
  nozzleId: string;
  openingReading: Num;
  closingReading: Num;
  soldQuantity: Num;
  createdAt?: string;
  nozzle?: {
    id?: string;
    name?: string;
    tankId?: string;
    tank?: {
      id?: string;
      name?: string;
      productId?: string;
      product?: {
        id?: string;
        name?: string;
        code?: string;
        productType?: string | null;
        currentPrice?: Num;
      } | null;
    } | null;
  } | null;
}

interface SalesLineDetail {
  id: string;
  productId?: string;
  nozzleId?: string | null;
  unitPrice: Num;
  quantity: Num;
  totalAmount: Num;
  saleType?: string | null;
  product?: {
    id?: string;
    name?: string;
    code?: string;
    productType?: string | null;
    currentPrice?: Num;
  } | null;
  nozzle?: {
    id?: string;
    name?: string;
    tank?: { id?: string; name?: string; product?: { id?: string; name?: string; productType?: string | null } | null } | null;
  } | null;
}

interface OilInvoiceLine {
  id?: string;
  productId?: string;
  productName?: string | null;
  quantity?: Num;
  unitPrice?: Num;
  totalAmount?: Num;
  amount?: Num;
  product?: {
    id?: string;
    name?: string;
    code?: string;
    productType?: string | null;
    currentPrice?: Num;
  } | null;
}

interface OilInvoiceDetail {
  id: string;
  invoiceNumber?: string | null;
  invoiceNo?: string | null;
  invoiceDate?: string | null;
  saleDate?: string | null;
  createdAt?: string | null;
  dailySalesId?: string | null;
  totalAmount: Num;
  status?: string | null;
  paymentMethod?: string | null;
  customer?: { id?: string; name?: string; phone?: string | null } | null;
  lines?: OilInvoiceLine[];
  items?: OilInvoiceLine[];
  oilInvoiceLines?: OilInvoiceLine[];
}

interface OilLedgerRow {
  id: string;
  invoiceNumber: string;
  date?: string | null;
  productName: string;
  productType: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number;
  paymentMethod: string;
  status: string;
  customerName: string;
}

interface DailySalesDetail {
  id: string;
  name?: string;
  businessDate?: string;
  status?: string;
  totalAmount?: Num;
  meterReadings?: MeterReadingDetail[];
  salesLines?: SalesLineDetail[];
  oilInvoices?: OilInvoiceDetail[];
  creditSales?: CreditSale[];
  cashReceipts?: CreditReceipt[];
  expenses?: Array<{ amount?: Num }>;
}

type ReportMode = "preview" | "confirm" | null;
type LedgerMode = "petroleum" | "oil" | "credit" | null;

const CREDIT_ENDPOINT = "/credits";

/* =========================================================
   HELPERS
========================================================= */

const n = (v: Num) => Number(v || 0);

const money = (v: Num) =>
  `₹${Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const moneyOrDash = (v: Num) => (v === null || v === undefined ? "—" : money(v));

const qty = (v: Num) =>
  Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

const round2 = (v: number) => Math.round(v * 100) / 100;

function errMsg(e: unknown, fallback: string) {
  const res = (e as { response?: { data?: { message?: unknown } } } | null)?.response;
  if (typeof res?.data?.message === "string") return res.data.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

function unwrap<T>(payload: unknown, fallback: T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data?: T }).data ?? fallback) as T;
  }
  return (payload as T) ?? fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN");
}

function productTypeLabel(type?: string | null) {
  switch ((type || "").toUpperCase()) {
    case "PETROL":
      return "Petrol";
    case "DIESEL":
      return "Diesel";
    case "OIL":
      return "Oil";
    case "WATER":
      return "Water";
    default:
      return type || "Other";
  }
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
        {required && <span className="text-red-500">*</span>}
        {label}
        {hint && (
          <span title={hint} className="text-slate-300 hover:text-slate-500">
            <Info size={13} />
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

function ReadOnly({ value, strong = false }: { value: string; strong?: boolean }) {
  return (
    <div
      className={`input cursor-default bg-slate-50 tabular-nums ${
        strong ? "font-extrabold text-slate-900" : "font-semibold text-slate-700"
      }`}
    >
      {value}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
      <div>
        <h2 className="font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {icon && (
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-brand-600">
          {icon}
        </div>
      )}
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${
          wide ? "max-w-7xl" : "max-w-xl"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-3 shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>

        {footer && (
          <div className="flex justify-end gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function TypeChip({ type }: { type?: string | null }) {
  const t = (type || "OTHER").toUpperCase();
  const cls =
    t === "PETROL"
      ? "bg-blue-50 text-blue-600"
      : t === "DIESEL"
        ? "bg-slate-100 text-slate-600"
        : t === "OIL"
          ? "bg-violet-50 text-violet-600"
          : "bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {t}
    </span>
  );
}

function LedgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-brand-700 transition hover:bg-blue-100"
    >
      <ReceiptText size={13} />
      Ledger
    </button>
  );
}

function ProductTable({
  title,
  rows,
  totalLabel,
  total,
  showType = false,
  emptyHint,
  chips,
  onLedger,
}: {
  title: string;
  rows: ProductLine[];
  totalLabel: string;
  total: number;
  showType?: boolean;
  emptyHint: string;
  chips?: ReactNode;
  onLedger?: () => void;
}) {
  const cols = showType ? 4 : 3;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          {onLedger && <LedgerButton onClick={onLedger} />}
        </div>
        {chips && <div className="flex flex-wrap gap-2">{chips}</div>}
      </div>

      {/* tables remain commented out — no UI change */}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function CashClosure() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [dailySales, setDailySales] = useState<Daily[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [selected, setSelected] = useState<Closure | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<Preview | null>(null);
  const [report, setReport] = useState<ReportMode>(null);

  const [starting, setStarting] = useState("0");
  const [paytm, setPaytm] = useState("0");
  const [ccms, setCcms] = useState("0");
  const [other, setOther] = useState("0");
  const [supplier, setSupplier] = useState("0");
  const [actual, setActual] = useState("");
  const [comments, setComments] = useState("");

  const [preview, setPreview] = useState<Preview | null>(null);
  const [credits, setCredits] = useState<CreditSale[]>([]);
  const [creditError, setCreditError] = useState("");

  /* Ledger */
  const [ledgerMode, setLedgerMode] = useState<LedgerMode>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState("");
  const [dailyDetail, setDailyDetail] = useState<DailySalesDetail | null>(null);
  const [oilHistory, setOilHistory] = useState<OilInvoiceDetail[]>([]);

  const activeDay = useMemo(
    () => dailySales.find((d) => d.status === "ACTIVE") ?? null,
    [dailySales],
  );

  const activeClosure = useMemo(
    () => (activeDay ? closures.find((c) => c.dailySalesId === activeDay.id) ?? null : null),
    [activeDay, closures],
  );

  const isClosed = activeClosure?.status === "CLOSED";

  /* ---------------------------- LOAD ---------------------------- */

  async function load() {
    try {
      setError("");
      setCreditError("");

      const [c, d, cr, oil] = await Promise.all([
        api.get("/cash-closure"),
        api.get("/daily-sales"),
        api
          .get(CREDIT_ENDPOINT)
          .then((res) => unwrap<CreditSale[]>(res.data, []))
          .catch((e: unknown) => {
            setCreditError(errMsg(e, "Unable to load credit sales."));
            return [] as CreditSale[];
          }),
        getOilInvoices()
          .then((rows) => rows as unknown as OilInvoiceDetail[])
          .catch(() => [] as OilInvoiceDetail[]),
      ]);

      setClosures(unwrap<Closure[]>(c.data, []));
      setDailySales(unwrap<Daily[]>(d.data, []));
      setCredits(cr);
      setOilHistory(oil);
    } catch (e: unknown) {
      setError(errMsg(e, "Unable to load cash closure."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  /* --------------------------- DAILY DETAIL / LEDGER --------------------------- */

  async function ensureDailyDetail(force = false): Promise<DailySalesDetail | null> {
    if (!activeDay) return null;
    if (!force && dailyDetail?.id === activeDay.id) return dailyDetail;

    try {
      setLedgerLoading(true);
      setLedgerError("");

      const response = await api.get(`/daily-sales/${activeDay.id}`);
      const data = unwrap<DailySalesDetail | null>(response.data, null);

      if (!data) throw new Error("Daily sales detail was not returned.");
      setDailyDetail(data);
      return data;
    } catch (e: unknown) {
      const message = errMsg(e, "Unable to load daily sales ledger.");
      setLedgerError(message);
      return null;
    } finally {
      setLedgerLoading(false);
    }
  }

  async function openLedger(mode: Exclude<LedgerMode, null>) {
    setLedgerMode(mode);
    setLedgerError("");
    await ensureDailyDetail();
  }

  /* --------------------------- PREVIEW --------------------------- */

  async function calculate(silent = true): Promise<Preview | null> {
    if (!activeDay) {
      setError("No active business day. Open Daily Sales first.");
      return null;
    }

    try {
      setCalculating(true);
      const response = await api.get(`/cash-closure/preview/${activeDay.id}`, {
        params: {
          startingCashBalance: Number(starting || 0),
          supplierBankAmount: Number(supplier || 0),
          otherPayments: Number(other || 0),
        },
      });

      const data = unwrap<Preview | null>(response.data, null);
      setPreview(data);
      if (!silent) setNotice("Closure report refreshed.");
      return data;
    } catch (e: unknown) {
      setError(errMsg(e, "Unable to calculate cash closure."));
      return null;
    } finally {
      setCalculating(false);
    }
  }

  /** Load preview for a historical closure so Details shows live totals. */
  const handleViewClosure = async (row: Closure) => {
    try {
      setSelected(row);
      setSelectedPreview(null);

      const response = await api.get(`/cash-closure/preview/${row.dailySalesId}`, {
        params: {
          startingCashBalance: Number(row.startingCashBalance ?? 0),
          supplierBankAmount: Number(row.supplierBankAmount ?? 0),
          otherPayments: Number(row.otherPayments ?? 0),
        },
      });

      const data = unwrap<Preview | null>(response.data, null);
      setSelectedPreview(data);
    } catch (e: unknown) {
      console.error("Failed to load closure preview:", e);
      setSelectedPreview(null);
    }
  };

  useEffect(() => {
    if (activeDay) {
      void calculate();
      void ensureDailyDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay?.id]);

  function fillFromClosure(c: Closure) {
    setStarting(String(c.startingCashBalance ?? 0));
    setSupplier(String(c.supplierBankAmount ?? 0));
    setOther(String(c.otherPayments ?? 0));
    setPaytm(String(c.paytmAmount ?? 0));
    setCcms(String(c.ccmsHpPayAmount ?? 0));
    setActual(c.actualCashEntered != null ? String(c.actualCashEntered) : "");
    setComments(c.comments ?? "");
  }

  useEffect(() => {
    if (activeClosure) fillFromClosure(activeClosure);
  }, [activeClosure?.id]);

  function resetForm() {
    setError("");
    if (activeClosure) {
      fillFromClosure(activeClosure);
    } else {
      setStarting("0");
      setPaytm("0");
      setCcms("0");
      setOther("0");
      setSupplier("0");
      setActual("");
      setComments("");
    }
  }

  /* ------------------------- CALCULATIONS ------------------------- */

  const sumItems = (rows: ProductLine[]) => rows.reduce((sum, r) => sum + n(r.amount), 0);

  const detailSalesLines = dailyDetail?.salesLines ?? [];
  const detailMeterReadings = dailyDetail?.meterReadings ?? [];
  const detailOilInvoices = dailyDetail?.oilInvoices ?? [];

  /*
   * Petroleum amount is deliberately NOT taken from preview.totalSales.
   * totalSales can contain other sale categories. Historical salesLines.totalAmount
   * is the exact amount for the nozzle sale that happened on that day.
   */
  const petroleumSalesLines = useMemo(
    () =>
      detailSalesLines.filter((line) => {
        const type = (line.product?.productType || "").toUpperCase();
        return type === "PETROL" || type === "DIESEL";
      }),
    [detailSalesLines],
  );

  const petroleumTotalFromLedger = useMemo(
    () => petroleumSalesLines.reduce((sum, line) => sum + n(line.totalAmount), 0),
    [petroleumSalesLines],
  );

  const previewPetrolItems = preview?.petrolItems ?? [];

  const petrolItems: ProductLine[] = useMemo(() => {
    if (petroleumSalesLines.length) {
      const map = new Map<string, ProductLine>();

      petroleumSalesLines.forEach((line) => {
        const id = line.productId || line.product?.id || line.id;
        const existing = map.get(id) ?? {
          productId: id,
          name: line.product?.name || "Unknown product",
          productType: line.product?.productType || "OTHER",
          quantity: 0,
          amount: 0,
        };

        existing.quantity = n(existing.quantity) + n(line.quantity);
        existing.amount = n(existing.amount) + n(line.totalAmount);
        map.set(id, existing);
      });

      return Array.from(map.values());
    }

    return previewPetrolItems;
  }, [petroleumSalesLines, previewPetrolItems]);

  const petroleumTotal = petroleumSalesLines.length
    ? petroleumTotalFromLedger
    : sumItems(petrolItems);

  /*
   * Oil total:
   * 1) preview oilItems if backend gives exact product rows
   * 2) oil invoice line totals if available
   * 3) invoice header totals as a safe fallback
   */
  const oilInvoiceLines = useMemo(() => {
    const lines: Array<OilInvoiceLine & { invoiceId: string; invoiceNumber: string }> = [];

    detailOilInvoices.forEach((invoice) => {
      const invoiceLines = invoice.lines ?? invoice.items ?? invoice.oilInvoiceLines ?? [];
      invoiceLines.forEach((line) => {
        lines.push({
          ...line,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber || invoice.invoiceNo || invoice.id,
        });
      });
    });

    return lines;
  }, [detailOilInvoices]);

  const oilItems: ProductLine[] = useMemo(() => {
    if (oilInvoiceLines.length) {
      const map = new Map<string, ProductLine>();

      oilInvoiceLines.forEach((line) => {
        const id = line.productId || line.product?.id || line.productName || "OIL-INVOICE";
        const existing = map.get(id) ?? {
          productId: line.productId || line.product?.id,
          name: line.product?.name || line.productName || "Oil Product",
          productType: line.product?.productType || "OIL",
          quantity: 0,
          amount: 0,
        };

        const amount =
          line.totalAmount != null
            ? n(line.totalAmount)
            : line.amount != null
              ? n(line.amount)
              : n(line.quantity) * n(line.unitPrice);

        existing.quantity = n(existing.quantity) + n(line.quantity);
        existing.amount = n(existing.amount) + amount;
        map.set(id, existing);
      });

      return Array.from(map.values());
    }

    if (preview?.oilItems?.length) return preview.oilItems;

    if (detailOilInvoices.length) {
      return detailOilInvoices.map((invoice) => ({
        productId: undefined,
        name: "Oil Invoice",
        productType: "OIL",
        quantity: undefined,
        amount: invoice.totalAmount,
      }));
    }

    return [];
  }, [oilInvoiceLines, preview?.oilItems, detailOilInvoices]);

  const oilTotalFromLedger = useMemo(
    () =>
      oilInvoiceLines.length
        ? oilInvoiceLines.reduce((sum, line) => {
            const amount =
              line.totalAmount != null
                ? n(line.totalAmount)
                : line.amount != null
                  ? n(line.amount)
                  : n(line.quantity) * n(line.unitPrice);
            return sum + amount;
          }, 0)
        : detailOilInvoices.reduce((sum, invoice) => sum + n(invoice.totalAmount), 0),
    [oilInvoiceLines, detailOilInvoices],
  );

  const oilTotal =
    detailOilInvoices.length || oilInvoiceLines.length
      ? oilTotalFromLedger
      : preview?.oilSales != null
        ? n(preview.oilSales)
        : sumItems(oilItems);

  const petrolByType = petrolItems.reduce<Record<string, number>>((acc, row) => {
    const key = (row.productType || "OTHER").toUpperCase();
    acc[key] = (acc[key] || 0) + n(row.amount);
    return acc;
  }, {});

  const dayCredits = credits.filter(
    (c) => c.dailySalesId === activeDay?.id && c.status !== "CANCELLED",
  );

  const creditRows = Array.from(
    dayCredits
      .reduce(
        (map, c) => {
          const key = c.customer?.id ?? c.id;
          const received = (c.cashReceipts ?? []).reduce(
            (sum, r) => sum + n(r.amount ?? r.receivedAmount),
            0,
          );

          const row = map.get(key) ?? {
            name: c.customer?.name ?? "Unknown customer",
            credit: 0,
            received: 0,
            invoices: 0,
          };

          row.credit += n(c.totalAmount);
          row.received += received;
          row.invoices += 1;
          map.set(key, row);
          return map;
        },
        new Map<string, { name: string; credit: number; received: number; invoices: number }>(),
      )
      .values(),
  );

  const localCreditTotal = creditRows.reduce((sum, r) => sum + r.credit, 0);
  const localCreditReceived = creditRows.reduce((sum, r) => sum + r.received, 0);

  const creditTotal = preview?.creditSales != null ? n(preview.creditSales) : localCreditTotal;
  const creditReceived =
    preview?.creditReceived != null ? n(preview.creditReceived) : localCreditReceived;
  const creditBalance = round2(creditTotal - creditReceived);

  const serverExpected = isClosed ? activeClosure?.expectedCash : preview?.expectedCash;
  const isEstimated = serverExpected === null || serverExpected === undefined;

  const estimatedExpected =
    n(starting) +
    n(preview?.totalSales) +
    n(preview?.cashReceipts) -
    n(preview?.expenses) -
    creditTotal -
    n(paytm) -
    n(ccms) -
    n(supplier) -
    n(other);

  const expected = round2(isEstimated ? estimatedExpected : Number(serverExpected));
  const difference = actual === "" ? 0 : round2(Number(actual) - expected);
  const expectedTotal = petroleumTotal + oilTotal;

  const diffTone =
    difference === 0
      ? "bg-emerald-50 text-emerald-700"
      : difference < 0
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  /* ------------------------- SAVE ------------------------- */

  const payload = () => ({
    startingCashBalance: Number(starting || 0),
    supplierBankAmount: Number(supplier || 0),
    otherPayments: Number(other || 0),
    paytmAmount: Number(paytm || 0),
    ccmsHpPayAmount: Number(ccms || 0),
    actualCashEntered: Number(actual || 0),
    comments: comments.trim(),
  });

  async function ensureClosure(): Promise<Closure> {
    if (!activeDay) throw new Error("Open an active business day first.");
    if (activeClosure) return activeClosure;

    const response = await api.post("/cash-closure", {
      dailySalesId: activeDay.id,
      ...payload(),
    });

    const created = unwrap<Closure>(response.data, null as unknown as Closure);
    setClosures((rows) => [created, ...rows]);
    return created;
  }

  function validate(): boolean {
    if (!activeDay) {
      setError("No active business day. Open Daily Sales first.");
      return false;
    }

    if (actual === "" || Number(actual) < 0) {
      setError("Enter Total Available Cash before submitting.");
      return false;
    }

    if (!comments.trim()) {
      setError("Comments are required.");
      return false;
    }

    setError("");
    return true;
  }

  async function openReport(mode: Exclude<ReportMode, null>) {
    if (mode === "confirm" && !validate()) return;
    await calculate();
    setReport(mode);
  }

  async function closeDay() {
    if (!validate()) return;

    setSaving(true);
    try {
      const closure = await ensureClosure();
      const response = await api.post(`/cash-closure/${closure.id}/close`, payload());
      const updated = unwrap<Closure>(response.data, closure);

      setClosures((rows) =>
        rows.map((row) => (row.id === closure.id ? { ...row, ...updated } : row)),
      );

      setReport(null);
      setNotice("Business day closed successfully.");
      await load();
      setSelected(updated);
      setHistoryOpen(true);
    } catch (e: unknown) {
      setReport(null);
      setError(errMsg(e, "Unable to close the business day."));
    } finally {
      setSaving(false);
    }
  }

  /* ----------------------------- LEDGER DATA ----------------------------- */

  const ledgerPetroleumRows = useMemo(() => {
    return petroleumSalesLines.map((line) => {
      const reading = detailMeterReadings.find((r) => r.nozzleId === line.nozzleId);

      const nozzleName =
        line.nozzle?.name ||
        reading?.nozzle?.name ||
        line.nozzleId ||
        "-";

      const tankName =
        line.nozzle?.tank?.name ||
        reading?.nozzle?.tank?.name ||
        "-";

      const productName =
        line.product?.name ||
        reading?.nozzle?.tank?.product?.name ||
        "Unknown product";

      const productType =
        line.product?.productType ||
        reading?.nozzle?.tank?.product?.productType ||
        "OTHER";

      return {
        id: line.id,
        nozzleName,
        tankName,
        productName,
        productType,
        opening: reading?.openingReading,
        closing: reading?.closingReading,
        soldQuantity: line.quantity ?? reading?.soldQuantity,
        unitPrice: line.unitPrice,
        amount: line.totalAmount,
        saleType: line.saleType || "CASH",
      };
    });
  }, [petroleumSalesLines, detailMeterReadings]);

  const ledgerPetroleumProductSummary = useMemo(() => {
    const map = new Map<
      string,
      { name: string; type?: string | null; quantity: number; amount: number }
    >();

    ledgerPetroleumRows.forEach((row) => {
      const key = row.productName;
      const existing = map.get(key) ?? {
        name: row.productName,
        type: row.productType,
        quantity: 0,
        amount: 0,
      };

      existing.quantity += n(row.soldQuantity);
      existing.amount += n(row.amount);
      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [ledgerPetroleumRows]);

  const ledgerOilHistoryInvoices = useMemo<OilInvoiceDetail[]>(() => {
    if (!activeDay) return [];

    return oilHistory.filter((invoice) => invoice.dailySalesId === activeDay.id);
  }, [oilHistory, activeDay?.id]);

  // Prefer Lubricant Sales History because it contains invoice-line quantity,
  // historical unit price and customer information. Daily Sales is fallback.
  const ledgerOilSourceInvoices =
    ledgerOilHistoryInvoices.length > 0 ? ledgerOilHistoryInvoices : detailOilInvoices;

  const ledgerOilRows = useMemo<OilLedgerRow[]>(() => {
    return ledgerOilSourceInvoices.flatMap((invoice): OilLedgerRow[] => {
      const lines: OilInvoiceLine[] =
        invoice.lines ?? invoice.items ?? invoice.oilInvoiceLines ?? [];

      const invoiceNumber = invoice.invoiceNumber || invoice.invoiceNo || invoice.id;
      const date = invoice.invoiceDate || invoice.saleDate || invoice.createdAt;
      const customerName = invoice.customer?.name || "-";
      const paymentMethod = invoice.paymentMethod || "-";
      const status = invoice.status || "ACTIVE";

      if (!lines.length) {
        return [{
          id: invoice.id,
          invoiceNumber,
          date,
          productName: "Oil Invoice",
          productType: "OIL",
          quantity: null,
          unitPrice: null,
          amount: n(invoice.totalAmount),
          paymentMethod,
          status,
          customerName,
        }];
      }

      return lines.map((line, index): OilLedgerRow => {
        const quantity = line.quantity == null ? null : n(line.quantity);
        const unitPrice = line.unitPrice == null ? null : n(line.unitPrice);
        const amount =
          line.totalAmount != null
            ? n(line.totalAmount)
            : line.amount != null
              ? n(line.amount)
              : (quantity ?? 0) * (unitPrice ?? 0);

        return {
          id: `${invoice.id}-${line.id || index}`,
          invoiceNumber,
          date,
          productName: line.product?.name || line.productName || "Oil Product",
          productType: line.product?.productType || "OIL",
          quantity,
          unitPrice,
          amount,
          paymentMethod,
          status,
          customerName,
        };
      });
    });
  }, [ledgerOilSourceInvoices]);

  const ledgerOilProductSummary = useMemo<
    Array<{ name: string; quantity: number; amount: number }>
  >(() => {
    const map = new Map<string, { name: string; quantity: number; amount: number }>();

    ledgerOilRows.forEach((row) => {
      const key = row.productName;
      const existing = map.get(key) ?? {
        name: row.productName,
        quantity: 0,
        amount: 0,
      };

      existing.quantity += n(row.quantity);
      existing.amount += n(row.amount);
      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [ledgerOilRows]);

  const ledgerCreditRows = useMemo(() => {
    return dayCredits.map((credit) => {
      const received = (credit.cashReceipts ?? []).reduce(
        (sum, receipt) => sum + n(receipt.amount ?? receipt.receivedAmount),
        0,
      );

      return {
        id: credit.id,
        invoiceNumber: credit.invoiceNumber || credit.id,
        date: credit.saleDate,
        customerName: credit.customer?.name || "Unknown customer",
        phone: credit.customer?.phone || "-",
        amount: n(credit.totalAmount),
        received,
        outstanding: round2(n(credit.totalAmount) - received),
        status: credit.status,
      };
    });
  }, [dayCredits]);

  /* Merged detail for Closure Records → Details (closure + preview) */
  const detail = useMemo(() => {
    if (!selected) return null;
    return {
      ...selected,
      ...(selectedPreview ?? {}),
    };
  }, [selected, selectedPreview]);

  /* ----------------------------- RENDER ----------------------------- */

  if (loading) {
    return (
      <div className="grid min-h-72 place-items-center">
        <Loader2 className="animate-spin text-brand-600" />
      </div>
    );
  }

  const reportRows: Array<[string, string]> = [
    ["Starting Balance", money(starting)],
    ["Petroleum Total", money(petroleumTotal)],
    ["Oil Total", money(oilTotal)],
    ["Credit Sales", money(creditTotal)],
    ["Credit Received", money(creditReceived)],
    ["Credit Balance (Outstanding)", money(creditBalance)],
    ["Cash Receipts (cash mode only)", moneyOrDash(preview?.cashReceipts)],
    ["Expenses", moneyOrDash(preview?.expenses)],
    ["Paytm Transaction", money(paytm)],
    ["CCMS / HP Pay", money(ccms)],
    ["Bank Transfer | Payments | Other Payouts", money(other)],
    ["Petrol Supplier Bank Account", money(supplier)],
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* HEADER */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="badge bg-amber-50 text-amber-700">MANAGER · CASH CLOSURE</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Cash Closure</h1>
          <p className="mt-1 text-sm text-slate-400">
            Reconcile the active business day and close it safely.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          onClick={() => setHistoryOpen(true)}
        >
          <Eye size={15} /> Closure Records
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          <span>{error}</span>
          <button type="button" aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={16} /> {notice}
          </span>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {!activeDay ? (
        <div className="card p-8 text-center">
          <AlertTriangle className="mx-auto text-amber-500" />
          <h2 className="mt-3 font-bold">No active business day</h2>
          <p className="mt-1 text-sm text-slate-400">
            Open a Daily Sales business day before starting cash closure.
          </p>
        </div>
      ) : (
        <>
          {/* ACTIVE DAY */}
          <div className="card flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-slate-400">Active Business Day</p>
              <h2 className="mt-1 font-extrabold text-slate-900">
                {activeDay.name || "Daily Sales"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge bg-emerald-50 text-emerald-600">
                {new Date(activeDay.businessDate).toLocaleDateString("en-IN")}
              </span>
              <span
                className={`badge ${
                  isClosed ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-brand-700"
                }`}
              >
                {activeClosure?.status || "DRAFT"}
              </span>
            </div>
          </div>

          {/* GENERATED REPORT */}
          <section className="card overflow-hidden">
            <SectionTitle
              title="Generated Report"
              subtitle="Product-wise sales, nozzle-wise sales, credit balance and expected totals for the active day."
              icon={<Calculator size={18} />}
            />

            <div className="space-y-6 p-5 sm:p-6">
              {/* PETROLEUM */}
              <ProductTable
                title="Petroleum Sales"
                rows={petrolItems}
                showType
                totalLabel="Petroleum Total Amount"
                total={petroleumTotal}
                emptyHint="No petrol / diesel sales returned for this business day."
                onLedger={() => void openLedger("petroleum")}
                chips={Object.entries(petrolByType).map(([type, amount]) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    <TypeChip type={type} /> {money(amount)}
                  </span>
                ))}
              />

              {/* OIL */}
              <ProductTable
                title="Oil Sales"
                rows={oilItems}
                totalLabel="Expected Oil Total"
                total={oilTotal}
                emptyHint="No oil sales found for this business day."
                onLedger={() => void openLedger("oil")}
              />

              {/* CREDIT */}
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-start gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Credit Sales</h3>
                  <LedgerButton onClick={() => void openLedger("credit")} />
                </div>
              </div>

              {/* TOTALS */}
              <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Petroleum Total Amount">
                  <ReadOnly value={money(petroleumTotal)} />
                </Field>
                <Field label="Expected Oil Total" hint="Exact oil invoice/product total for this business day">
                  <ReadOnly value={money(oilTotal)} />
                </Field>
                <Field label="Total Credit Sales Amount">
                  <ReadOnly value={money(creditTotal)} />
                </Field>
                <Field label="Expected Expenses">
                  <ReadOnly value={moneyOrDash(preview?.expenses)} />
                </Field>
                <Field label="Expected Total" hint="Petroleum total + oil total">
                  <ReadOnly value={money(expectedTotal)} strong />
                </Field>
              </div>
            </div>
          </section>

          {/* CASH CLOSURE FORM */}
          <section className="card overflow-hidden">
            <SectionTitle
              title="Cash Closure"
              subtitle="Enter the collections and payouts, then submit for the day."
              icon={<LockKeyhole size={18} />}
            />

            <div className="p-5 sm:p-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Starting Balance" required hint="Cash in hand at the start of the day">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={isClosed}
                    value={starting}
                    onChange={(e) => setStarting(e.target.value)}
                    onBlur={() => void calculate()}
                  />
                </Field>

                <Field label="Paytm Transaction" required hint="Total received via Paytm">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={isClosed}
                    value={paytm}
                    onChange={(e) => setPaytm(e.target.value)}
                  />
                </Field>

                <Field label="CCMS/HP Pay" required hint="Total received via CCMS / HP Pay">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={isClosed}
                    value={ccms}
                    onChange={(e) => setCcms(e.target.value)}
                  />
                </Field>

                <Field
                  label="Bank Transfer | Payments | Other Payouts"
                  required
                  hint="Bank transfers, payments and other payouts made today"
                >
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={isClosed}
                    value={other}
                    onChange={(e) => setOther(e.target.value)}
                    onBlur={() => void calculate()}
                  />
                </Field>

                <Field
                  label="Cash Receipts (payment mode cash only)"
                  required
                  hint="Customer receipts collected in cash - calculated by the server"
                >
                  <ReadOnly value={moneyOrDash(preview?.cashReceipts)} />
                </Field>

                <Field
                  label="Petrol Supplier Bank Account"
                  required
                  hint="Amount paid to the petrol supplier bank account"
                >
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={isClosed}
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    onBlur={() => void calculate()}
                  />
                </Field>

                <Field
                  label="Expected Total Cash in Hand"
                  hint={
                    isEstimated
                      ? "Estimated until the server confirms the final figure"
                      : "Calculated by the server"
                  }
                >
                  <div className="relative">
                    <ReadOnly value={money(expected)} strong />
                    {isEstimated && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                        Estimated
                      </span>
                    )}
                  </div>
                </Field>

                <Field label="Total Available Cash" required hint="Actual cash counted in the drawer">
                  <input
                    className="input text-base font-bold"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={isClosed}
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                  />
                </Field>

                <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${diffTone}`}>
                  <span className="text-xs font-bold">Difference</span>
                  <span className="text-lg font-extrabold tabular-nums">{money(difference)}</span>
                </div>
              </div>

              <div className="mt-4">
                <Field label="Comments" required>
                  <textarea
                    className="input min-h-24"
                    disabled={isClosed}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add closing remarks for this business day"
                  />
                </Field>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="btn-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  disabled={saving}
                  onClick={resetForm}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  disabled={saving || calculating}
                  onClick={() => void openReport("preview")}
                >
                  {calculating ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <FileText size={15} />
                  )}
                  Preview Closure Report
                </button>

                <button
                  type="button"
                  className="btn-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  disabled={saving || calculating || isClosed}
                  onClick={() => void openReport("confirm")}
                >
                  <LockKeyhole size={15} />
                  {isClosed ? "Day Closed" : "Submit Cash Closure for the Day"}
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* PREVIEW / CONFIRM REPORT */}
      {report && (
        <ModalShell
          title={report === "confirm" ? "Confirm Cash Closure" : "Closure Report Preview"}
          subtitle={
            report === "confirm"
              ? "Review the figures. Once submitted the business day is closed."
              : "Summary of the entered and calculated values."
          }
          onClose={() => !saving && setReport(null)}
          footer={
            report === "confirm" ? (
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving}
                  onClick={() => setReport(null)}
                >
                  Back
                </button>
                <button type="button" className="btn-primary" disabled={saving} onClick={() => void closeDay()}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <LockKeyhole size={15} />}
                  {saving ? "Closing..." : "Confirm & Close Day"}
                </button>
              </>
            ) : (
              <button type="button" className="btn-primary" onClick={() => setReport(null)}>
                Close
              </button>
            )
          }
        >
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
            {reportRows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-bold tabular-nums text-slate-900">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Expected Cash in Hand{isEstimated ? " (est.)" : ""}</p>
              <p className="mt-1 text-lg font-extrabold tabular-nums">{money(expected)}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs text-brand-700">Total Available Cash</p>
              <p className="mt-1 text-lg font-extrabold tabular-nums text-brand-700">
                {actual === "" ? "—" : money(actual)}
              </p>
            </div>
            <div className={`rounded-2xl p-4 ${diffTone}`}>
              <p className="text-xs">Difference</p>
              <p className="mt-1 text-lg font-extrabold tabular-nums">{money(difference)}</p>
            </div>
          </div>

          {comments.trim() && (
            <div className="mt-4 rounded-2xl border border-slate-100 p-4 text-sm">
              <p className="text-xs font-bold text-slate-500">Comments</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">{comments}</p>
            </div>
          )}
        </ModalShell>
      )}

      {/* =========================================================
          LEDGER MODAL
      ========================================================= */}
      {ledgerMode && (
        <ModalShell
          wide
          title={
            ledgerMode === "petroleum"
              ? "Petroleum Sales Ledger"
              : ledgerMode === "oil"
                ? "Oil Sales Ledger"
                : "Credit Sales Ledger"
          }
          subtitle={
            ledgerMode === "petroleum"
              ? "Exact nozzle-wise meter reading, quantity, historical selling price and sale amount."
              : ledgerMode === "oil"
                ? "Exact oil invoice/product-wise sales details and expected oil total."
                : "Exact credit invoice, customer, received amount and outstanding balance."
          }
          onClose={() => setLedgerMode(null)}
          footer={
            <button type="button" className="btn-primary" onClick={() => setLedgerMode(null)}>
              Close Ledger
            </button>
          }
        >
          {ledgerLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Loading ledger details...
            </div>
          )}

          {!ledgerLoading && ledgerError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {ledgerError}
            </div>
          )}

          {!ledgerLoading && !ledgerError && ledgerMode === "petroleum" && (
            <div className="space-y-6">
              {/* PRODUCT SUMMARY */}
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Product-wise Petroleum Summary</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Amounts are taken from historical Daily Sales lines, not today's Product Master price.
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 px-4 py-2 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Petroleum Total</p>
                    <p className="text-lg font-extrabold tabular-nums text-blue-700">{money(petroleumTotal)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-right">Total Qty</th>
                        <th className="px-4 py-3 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerPetroleumProductSummary.length ? (
                        ledgerPetroleumProductSummary.map((row) => (
                          <tr key={row.name} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-semibold text-slate-800">{row.name}</td>
                            <td className="px-4 py-3"><TypeChip type={row.type} /></td>
                            <td className="px-4 py-3 text-right tabular-nums">{qty(row.quantity)}</td>
                            <td className="px-4 py-3 text-right font-extrabold tabular-nums">{money(row.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400">
                            No petroleum meter sales found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-600">Petroleum Ledger Total</td>
                        <td className="px-4 py-3 text-right font-extrabold tabular-nums">{money(petroleumTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* NOZZLE DETAIL */}
              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Nozzle-wise Sales Ledger</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Opening meter → closing meter = sold quantity. Amount uses the sale line's historical unit price.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full min-w-[1200px] text-sm">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-3 py-3 text-left">Nozzle</th>
                        <th className="px-3 py-3 text-left">Tank</th>
                        <th className="px-3 py-3 text-left">Product</th>
                        <th className="px-3 py-3 text-left">Type</th>
                        <th className="px-3 py-3 text-right">Opening Meter</th>
                        <th className="px-3 py-3 text-right">Closing Meter</th>
                        <th className="px-3 py-3 text-right">Sold Qty</th>
                        <th className="px-3 py-3 text-right">Unit Price</th>
                        <th className="px-3 py-3 text-right">Amount</th>
                        <th className="px-3 py-3 text-left">Sale Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerPetroleumRows.length ? (
                        ledgerPetroleumRows.map((row) => (
                          <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="px-3 py-3 font-bold text-slate-800">{row.nozzleName}</td>
                            <td className="px-3 py-3 text-slate-600">{row.tankName}</td>
                            <td className="px-3 py-3 font-semibold text-slate-800">{row.productName}</td>
                            <td className="px-3 py-3"><TypeChip type={row.productType} /></td>
                            <td className="px-3 py-3 text-right tabular-nums text-slate-600">{qty(row.opening)}</td>
                            <td className="px-3 py-3 text-right tabular-nums text-slate-600">{qty(row.closing)}</td>
                            <td className="px-3 py-3 text-right font-semibold tabular-nums">{qty(row.soldQuantity)}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{money(row.unitPrice)}</td>
                            <td className="px-3 py-3 text-right font-extrabold tabular-nums text-slate-900">{money(row.amount)}</td>
                            <td className="px-3 py-3">
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                {row.saleType}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="px-4 py-10 text-center text-xs text-slate-400">
                            No nozzle-wise petroleum ledger rows found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td colSpan={6} className="px-3 py-3 text-xs font-bold text-slate-600">Total Petroleum Sales</td>
                        <td className="px-3 py-3 text-right font-extrabold tabular-nums">
                          {qty(ledgerPetroleumRows.reduce((s, r) => s + n(r.soldQuantity), 0))}
                        </td>
                        <td />
                        <td className="px-3 py-3 text-right font-extrabold tabular-nums">{money(petroleumTotal)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!ledgerLoading && !ledgerError && ledgerMode === "oil" && (
            <div className="space-y-6">
              {/* OIL TOTAL */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-violet-50 p-4">
                  <p className="text-xs font-semibold text-violet-700">Expected Oil Total</p>
                  <p className="mt-1 text-xl font-extrabold tabular-nums text-violet-800">{money(oilTotal)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">Oil Invoices</p>
                  <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-800">{ledgerOilSourceInvoices.length}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700">Product Rows</p>
                  <p className="mt-1 text-xl font-extrabold tabular-nums text-blue-800">{ledgerOilRows.length}</p>
                </div>
              </div>

              {/* PRODUCT SUMMARY */}
              <div>
                <h3 className="mb-3 text-sm font-extrabold text-slate-900">Oil Product-wise Summary</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Oil Product</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerOilProductSummary.length ? (
                        ledgerOilProductSummary.map((row) => (
                          <tr key={row.name} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-semibold text-slate-800">{row.name}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{qty(row.quantity)}</td>
                            <td className="px-4 py-3 text-right font-extrabold tabular-nums">{money(row.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-400">
                            No detailed oil product lines are available. Invoice totals are shown in the detailed ledger when present.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td className="px-4 py-3 text-xs font-bold text-slate-600">Expected Oil Total</td>
                        <td />
                        <td className="px-4 py-3 text-right font-extrabold tabular-nums">{money(oilTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* OIL DETAIL */}
              <div>
                <h3 className="mb-3 text-sm font-extrabold text-slate-900">Oil Invoice / Product Ledger</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full min-w-[1200px] text-sm">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-3 py-3 text-left">Invoice</th>
                        <th className="px-3 py-3 text-left">Date</th>
                        <th className="px-3 py-3 text-left">Product</th>
                        <th className="px-3 py-3 text-right">Qty</th>
                        <th className="px-3 py-3 text-right">Unit Price</th>
                        <th className="px-3 py-3 text-right">Amount</th>
                        <th className="px-3 py-3 text-left">Payment</th>
                        <th className="px-3 py-3 text-left">Customer</th>
                        <th className="px-3 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerOilRows.length ? (
                        ledgerOilRows.map((row) => (
                          <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="px-3 py-3 font-bold text-slate-800">{row.invoiceNumber}</td>
                            <td className="px-3 py-3 text-slate-500">{formatDate(row.date)}</td>
                            <td className="px-3 py-3 font-semibold text-slate-800">{row.productName}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{row.quantity == null ? "-" : qty(row.quantity)}</td>
                            <td className="px-3 py-3 text-right tabular-nums">
                              {row.unitPrice == null ? "-" : money(row.unitPrice)}
                            </td>
                            <td className="px-3 py-3 text-right font-extrabold tabular-nums">{money(row.amount)}</td>
                            <td className="px-3 py-3">
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                                {row.paymentMethod}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-slate-600">{row.customerName}</td>
                            <td className="px-3 py-3 text-slate-600">{row.status}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-4 py-10 text-center text-xs text-slate-400">
                            No oil invoices found for this business day.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td colSpan={5} className="px-3 py-3 text-xs font-bold text-slate-600">
                          Expected Oil Total
                        </td>
                        <td className="px-3 py-3 text-right font-extrabold tabular-nums">{money(oilTotal)}</td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!ledgerLoading && !ledgerError && ledgerMode === "credit" && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Total Credit</p>
                  <p className="mt-1 text-xl font-extrabold tabular-nums">{money(creditTotal)}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-700">Received</p>
                  <p className="mt-1 text-xl font-extrabold tabular-nums text-emerald-700">{money(creditReceived)}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-xs text-amber-700">Outstanding</p>
                  <p className="mt-1 text-xl font-extrabold tabular-nums text-amber-700">{money(creditBalance)}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-3 py-3 text-left">Invoice</th>
                      <th className="px-3 py-3 text-left">Date</th>
                      <th className="px-3 py-3 text-left">Customer</th>
                      <th className="px-3 py-3 text-left">Phone</th>
                      <th className="px-3 py-3 text-right">Credit</th>
                      <th className="px-3 py-3 text-right">Received</th>
                      <th className="px-3 py-3 text-right">Outstanding</th>
                      <th className="px-3 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerCreditRows.length ? (
                      ledgerCreditRows.map((row) => (
                        <tr key={row.id} className="border-t border-slate-100">
                          <td className="px-3 py-3 font-bold text-slate-800">{row.invoiceNumber}</td>
                          <td className="px-3 py-3 text-slate-500">{formatDate(row.date)}</td>
                          <td className="px-3 py-3 font-semibold">{row.customerName}</td>
                          <td className="px-3 py-3 text-slate-500">{row.phone}</td>
                          <td className="px-3 py-3 text-right font-bold tabular-nums">{money(row.amount)}</td>
                          <td className="px-3 py-3 text-right font-bold tabular-nums text-emerald-600">{money(row.received)}</td>
                          <td className="px-3 py-3 text-right font-extrabold tabular-nums text-amber-600">{money(row.outstanding)}</td>
                          <td className="px-3 py-3">{row.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-xs text-slate-400">
                          No credit sales found for this business day.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td colSpan={4} className="px-3 py-3 text-xs font-bold text-slate-600">Credit Ledger Total</td>
                      <td className="px-3 py-3 text-right font-extrabold tabular-nums">{money(creditTotal)}</td>
                      <td className="px-3 py-3 text-right font-extrabold tabular-nums text-emerald-600">{money(creditReceived)}</td>
                      <td className="px-3 py-3 text-right font-extrabold tabular-nums text-amber-600">{money(creditBalance)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {/* CLOSURE RECORDS */}
      {historyOpen && (
        <ModalShell
          wide
          title="Closure Records"
          subtitle="Open a record to review the full reconciliation."
          onClose={() => {
            setHistoryOpen(false);
            setSelected(null);
            setSelectedPreview(null);
          }}
        >
          {selected ? (
            <div>
              <button
                className="btn-secondary mb-5"
                onClick={() => {
                  setSelected(null);
                  setSelectedPreview(null);
                }}
              >
                Back to Records
              </button>

              <div className="grid gap-4 sm:grid-cols-3">
                {(
                  [
                    ["Expected Cash", detail?.expectedCash],
                    ["Actual Cash", detail?.actualCashEntered],
                    ["Difference", detail?.difference],
                    ["Cash Sales", detail?.cashSales ?? (detail as any)?.totalSales],
                    ["Credit Payments", detail?.creditPaymentsReceived ?? (detail as any)?.cashReceipts],
                    ["Expenses", detail?.expenses],
                    ["Paytm", detail?.paytmAmount],
                    ["CCMS / HP Pay", detail?.ccmsHpPayAmount],
                    ["Supplier Bank", detail?.supplierBankAmount],
                  ] as Array<[string, Num]>
                ).map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 font-extrabold tabular-nums">{money(value)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2 rounded-2xl border border-slate-100 p-5 text-sm">
                <p>
                  <b>Business Day:</b> {selected.dailySales?.name || selected.dailySalesId}
                </p>
                <p>
                  <b>Status:</b> {selected.status}
                </p>
                <p>
                  <b>Closed By:</b> {selected.closedByUser?.name || "-"}
                </p>
                <p>
                  <b>Closed At:</b> {selected.closedAt ? formatDateTime(selected.closedAt) : "-"}
                </p>
                {selected.comments && (
                  <p>
                    <b>Comments:</b> {selected.comments}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-xs text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">DAY</th>
                    <th className="px-4 py-3 text-left">DATE</th>
                    <th className="px-4 py-3 text-right">EXPECTED</th>
                    <th className="px-4 py-3 text-right">ACTUAL</th>
                    <th className="px-4 py-3 text-right">DIFF</th>
                    <th className="px-4 py-3 text-left">STATUS</th>
                    <th className="px-4 py-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {closures.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-4 py-4 font-bold">{row.dailySales?.name || row.dailySalesId}</td>
                      <td className="px-4 py-4 text-slate-500">
                        {row.dailySales?.businessDate
                          ? new Date(row.dailySales.businessDate).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums">{money(row.expectedCash)}</td>
                      <td className="px-4 py-4 text-right tabular-nums">{money(row.actualCashEntered)}</td>
                      <td className="px-4 py-4 text-right font-bold tabular-nums">{money(row.difference)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`badge ${
                            row.status === "CLOSED"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          className="btn-secondary px-3 py-2 text-xs"
                          onClick={() => void handleViewClosure(row)}
                        >
                          <Eye size={14} /> Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!closures.length && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400">
                        No closure records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ModalShell>
      )}
    </div>
  );
}