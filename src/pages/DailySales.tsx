import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { CalendarDays, Loader2, Plus, X } from "lucide-react";
import { api } from "../services/api";

type DailySalesStatus = "ACTIVE" | "CLOSED" | string;
type Num = string | number | null | undefined;

interface ProductDetail {
  id: string;
  name?: string | null;
  productType?: string | null;
  currentPrice?: Num;
}
interface TankDetail {
  id: string;
  name?: string | null;
  product?: ProductDetail | null;
}
interface NozzleDetail {
  id: string;
  tankId?: string;
  name?: string | null;
  openingMeter?: Num;
  currentMeter?: Num;
  active?: boolean | null;
  tank?: TankDetail | null;
}
interface MeterReadingDetail {
  id: string;
  dailySalesId?: string;
  nozzleId: string;
  openingReading: Num;
  closingReading: Num;
  soldQuantity: Num;
  createdAt?: string;
  nozzle?: NozzleDetail | null;
}
interface SalesLineDetail {
  id: string;
  dailySalesId?: string;
  productId: string;
  nozzleId?: string | null;
  unitPrice: Num;
  quantity: Num;
  totalAmount: Num;
  saleType?: string | null;
  product?: ProductDetail | null;
  nozzle?: NozzleDetail | null;
}
interface CreditSaleDetail {
  id: string;
  invoiceNumber?: string | null;
  totalAmount?: Num;
  status?: string | null;
  saleDate?: string;
  customer?: { id: string; name?: string | null } | null;
  lines?: Array<{
    id: string;
    productId?: string;
    quantity?: Num;
    unitPrice?: Num;
    totalAmount?: Num;
    product?: ProductDetail | null;
  }>;
  cashReceipts?: Array<{ id: string; amount?: Num }>;
}
interface ExpenseDetail {
  id: string;
  amount?: Num;
  comment?: string | null;
  expenseType?: { id: string; name?: string | null } | null;
}
interface CashReceiptDetail {
  id: string;
  amount?: Num;
  paymentMethod?: string | null;
}
interface OilInvoiceDetail {
  id: string;
  invoiceNumber?: string | null;
  totalAmount?: Num;
  status?: string | null;
}

interface DailySale {
  id: string;
  accountId?: string;
  name: string;
  businessDate: string;
  status: DailySalesStatus;
  totalAmount: string | number;
  openedAt?: string;
  closedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    meterReadings?: number;
    salesLines?: number;
    creditSales?: number;
    cashReceipts?: number;
    expenses?: number;
    invoices?: number;
    oilInvoices?: number;
  };
}

interface DailySalesDetail extends DailySale {
  meterReadings?: MeterReadingDetail[];
  salesLines?: SalesLineDetail[];
  creditSales?: CreditSaleDetail[];
  expenses?: ExpenseDetail[];
  invoices?: unknown[];
  cashReceipts?: CashReceiptDetail[];
  oilInvoices?: OilInvoiceDetail[];
  cashClosure?: {
    id: string;
    status?: string;
    expectedCash?: Num;
    actualCashEntered?: Num;
    actualCash?: Num;
    difference?: Num;
  } | null;
}
interface DailySalesForm {
  name: string;
  businessDate: string;
}

const ITEMS_PER_PAGE = 10;

function getTodayDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}
function formatAmount(value?: Num) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function unwrapResponse<T>(response: any): T {
  return response?.data?.data ?? response?.data;
}

export default function DailySales() {
  const [sales, setSales] = useState<DailySale[]>([]);
  const [selectedSale, setSelectedSale] = useState<DailySalesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingSale, setEditingSale] = useState<DailySale | null>(null);
  const [form, setForm] = useState<DailySalesForm>({
    name: "",
    businessDate: getTodayDate(),
  });
  const [currentPage, setCurrentPage] = useState(1);

  const activeSale = useMemo(
    () => sales.find((sale) => sale.status === "ACTIVE") ?? null,
    [sales]
  );
  const totalPages = Math.max(1, Math.ceil(sales.length / ITEMS_PER_PAGE));
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sales.slice(start, start + ITEMS_PER_PAGE);
  }, [sales, currentPage]);
  const startRecord =
    sales.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endRecord = Math.min(currentPage * ITEMS_PER_PAGE, sales.length);
  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  const loadDailySalesDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setDetailError("");
      const response = await api.get(`/daily-sales/${id}`);
      setSelectedSale(unwrapResponse<DailySalesDetail>(response));
    } catch (err: any) {
      console.error("Daily sales detail error:", err);
      setDetailError(
        err?.response?.data?.message || "Unable to load daily sales details."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const loadDailySales = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/daily-sales");
      const data = unwrapResponse<DailySale[]>(response);
      const list = Array.isArray(data) ? data : [];
      setSales(list);
      setCurrentPage(1);

      const nextSelected =
        list.find((sale) => sale.id === selectedSale?.id) ??
        list.find((sale) => sale.status === "ACTIVE") ??
        list[0] ??
        null;

      if (nextSelected) await loadDailySalesDetail(nextSelected.id);
      else setSelectedSale(null);
    } catch (err: any) {
      console.error("Daily sales loading error:", err);
      setError(err?.response?.data?.message || "Unable to load daily sales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDailySales();
  }, []);

  const handlePreview = async (sale: DailySale) => {
    setShowPreviewModal(true);
    await loadDailySalesDetail(sale.id);
  };

  const openCreateModal = () => {
    setEditingSale(null);
    setFormError("");
    const today = getTodayDate();
    setForm({
      name: `Daily Sales - ${today.split("-").reverse().join("-")}`,
      businessDate: today,
    });
    setShowFormModal(true);
  };

  const openEditModal = (sale: DailySale) => {
    if (sale.status === "CLOSED") return;
    setEditingSale(sale);
    setFormError("");
    setForm({
      name: sale.name,
      businessDate: sale.businessDate.slice(0, 10),
    });
    setShowFormModal(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Daily sales name is required.");
      return;
    }
    if (!form.businessDate) {
      setFormError("Business date is required.");
      return;
    }

    try {
      setSaving(true);

      if (editingSale) {
        await api.patch(`/daily-sales/${editingSale.id}`, {
          name: form.name.trim(),
          businessDate: form.businessDate,
        });
      } else {
        if (activeSale) {
          setFormError(
            "An active daily sales entry already exists. Close the current business day before opening another."
          );
          return;
        }
        await api.post("/daily-sales", {
          name: form.name.trim(),
          businessDate: form.businessDate,
        });
      }

      setShowFormModal(false);
      setEditingSale(null);
      await loadDailySales();
    } catch (err: any) {
      console.error("Daily sales save error:", err);
      setFormError(
        err?.response?.data?.message || "Unable to save daily sales."
      );
    } finally {
      setSaving(false);
    }
  };

  const productTotals = useMemo(() => {
    const productMap = new Map<
      string,
      { name: string; productType: string; quantity: number; amount: number }
    >();

    selectedSale?.salesLines?.forEach((line: SalesLineDetail) => {
      const key = line.productId;
      const existing = productMap.get(key);
      const quantity = Number(line.quantity || 0);
      const amount = Number(line.totalAmount || 0);

      if (existing) {
        existing.quantity += quantity;
        existing.amount += amount;
      } else {
        productMap.set(key, {
          name: line.product?.name || "-",
          productType: line.product?.productType || "-",
          quantity,
          amount,
        });
      }
    });

    return Array.from(productMap.values());
  }, [selectedSale]);

  const closePreviewModal = () => {
    if (!detailLoading) setShowPreviewModal(false);
  };

  const closeFormModal = () => {
    if (saving) return;
    setShowFormModal(false);
    setEditingSale(null);
    setFormError("");
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Daily Sales</h2>
            <p className="mt-1 text-xs text-slate-400">
              Manage business day entries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400">
              {sales.length} {sales.length === 1 ? "Entry" : "Entries"}
            </div>
            {!activeSale && !loading && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-700"
              >
                <Plus size={15} /> Open Daily Sales
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <Loader2 size={26} className="animate-spin text-brand-600" />
          </div>
        ) : sales.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={30} />}
            title="No daily sales entry"
            message="Open a business day to start recording transactions."
            actionLabel="Open Daily Sales"
            onAction={openCreateModal}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400">Daily Sales</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400">Business Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400">Total Amount</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.map((sale) => {
                    const isSelected = selectedSale?.id === sale.id;
                    return (
                      <tr
                        key={sale.id}
                        className={[
                          "border-t border-slate-100 transition",
                          isSelected ? "bg-brand-50/40" : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => void handlePreview(sale)}
                            className="text-left"
                          >
                            <p className="font-semibold text-slate-800">{sale.name}</p>
                            <p className="mt-1 max-w-[280px] truncate font-mono text-[11px] text-slate-400">
                              {sale.id}
                            </p>
                          </button>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{formatDate(sale.businessDate)}</td>
                        <td className="px-5 py-4">
                          {sale.status === "ACTIVE" ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">ACTIVE</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">CLOSED</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-slate-800">
                          ₹{formatAmount(sale.totalAmount)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-2">
                            {sale.status === "CLOSED" ? (
                              <button
                                type="button"
                                onClick={() => void handlePreview(sale)}
                                className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                              >
                                View
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handlePreview(sale)}
                                  className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                                >
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(sale)}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  Edit
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {sales.length > ITEMS_PER_PAGE && (
              <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Showing <span className="font-semibold text-slate-600">{startRecord}</span> to{" "}
                  <span className="font-semibold text-slate-600">{endRecord}</span> of{" "}
                  <span className="font-semibold text-slate-600">{sales.length}</span> entries
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={[
                        "h-9 min-w-9 rounded-lg px-3 text-xs font-semibold transition",
                        currentPage === page
                          ? "bg-brand-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Daily Sales Preview</h2>
                {selectedSale && (
                  <p className="mt-1 text-xs text-slate-400">{selectedSale.name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={closePreviewModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {detailLoading ? (
                <div className="grid min-h-64 place-items-center">
                  <Loader2 size={28} className="animate-spin text-brand-600" />
                </div>
              ) : detailError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {detailError}
                </div>
              ) : selectedSale ? (
                <div className="space-y-5">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Daily Sales</p>
                        <p className="mt-1 text-lg font-bold text-slate-800">{selectedSale.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Business Date: {formatDate(selectedSale.businessDate)}
                        </p>
                      </div>
                      <span
                        className={
                          selectedSale.status === "ACTIVE"
                            ? "inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600"
                            : "inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
                        }
                      >
                        {selectedSale.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <PreviewCard label="Total Amount" value={`₹${formatAmount(selectedSale.totalAmount)}`} />
                    <PreviewCard
                      label="Meter Readings"
                      value={String(selectedSale._count?.meterReadings ?? selectedSale.meterReadings?.length ?? 0)}
                    />
                    <PreviewCard
                      label="Credit Sales"
                      value={String(selectedSale._count?.creditSales ?? selectedSale.creditSales?.length ?? 0)}
                    />
                    <PreviewCard
                      label="Expenses"
                      value={String(selectedSale._count?.expenses ?? selectedSale.expenses?.length ?? 0)}
                    />
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <h3 className="text-sm font-bold text-slate-800">Transaction Summary</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      <SummaryRow label="Meter Readings" value={selectedSale._count?.meterReadings ?? selectedSale.meterReadings?.length ?? 0} />
                      <SummaryRow label="Sales Lines" value={selectedSale._count?.salesLines ?? selectedSale.salesLines?.length ?? 0} />
                      <SummaryRow label="Credit Sales" value={selectedSale._count?.creditSales ?? selectedSale.creditSales?.length ?? 0} />
                      <SummaryRow label="Oil Invoices" value={selectedSale._count?.oilInvoices ?? selectedSale.oilInvoices?.length ?? 0} />
                      <SummaryRow label="Expenses" value={selectedSale._count?.expenses ?? selectedSale.expenses?.length ?? 0} />
                      <SummaryRow label="Cash Receipts" value={selectedSale._count?.cashReceipts ?? selectedSale.cashReceipts?.length ?? 0} />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">Nozzle-wise Sales</h3>
                          <p className="mt-1 text-xs text-slate-400">
                            Opening meter, closing meter and quantity sold
                          </p>
                        </div>
                        <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand-600">
                          {selectedSale.meterReadings?.length ?? 0} Nozzles
                        </span>
                      </div>
                    </div>

                    {selectedSale.meterReadings?.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              {["Nozzle", "Tank", "Product", "Opening", "Closing", "Sold Qty", "Rate", "Sales"].map((heading) => (
                                <th
                                  key={heading}
                                  className={`px-4 py-3 text-xs font-semibold text-slate-400 ${
                                    ["Opening", "Closing", "Sold Qty", "Rate", "Sales"].includes(heading)
                                      ? "text-right"
                                      : "text-left"
                                  }`}
                                >
                                  {heading}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSale.meterReadings.map((reading: MeterReadingDetail) => {
                              const matchingLine = selectedSale.salesLines?.find(
                                (line: SalesLineDetail) => line.nozzleId === reading.nozzleId
                              );
                              const product =
                                matchingLine?.product ?? reading.nozzle?.tank?.product;

                              return (
                                <tr key={reading.id} className="border-t border-slate-100">
                                  <td className="px-4 py-3 font-semibold text-slate-800">{reading.nozzle?.name || "-"}</td>
                                  <td className="px-4 py-3 text-slate-600">{reading.nozzle?.tank?.name || "-"}</td>
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-slate-700">{product?.name || "-"}</p>
                                    <p className="text-[11px] text-slate-400">{product?.productType || "-"}</p>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-slate-600">{Number(reading.openingReading || 0).toFixed(3)}</td>
                                  <td className="px-4 py-3 text-right font-mono text-slate-600">{Number(reading.closingReading || 0).toFixed(3)}</td>
                                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{Number(reading.soldQuantity || 0).toFixed(3)} L</td>
                                  <td className="px-4 py-3 text-right text-slate-600">₹{formatAmount(matchingLine?.unitPrice)}</td>
                                  <td className="px-4 py-3 text-right font-bold text-slate-800">₹{formatAmount(matchingLine?.totalAmount)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-5 py-10 text-center">
                        <p className="text-sm font-semibold text-slate-500">No nozzle sales recorded</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Meter readings will appear here once sales are entered.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <h3 className="text-sm font-bold text-slate-800">Product-wise Sales</h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Total quantity and sales amount by product
                      </p>
                    </div>
                    {productTotals.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Product</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Type</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Quantity</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Total Sales</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productTotals.map((product) => (
                              <tr key={`${product.name}-${product.productType}`} className="border-t border-slate-100">
                                <td className="px-4 py-3 font-semibold text-slate-800">{product.name}</td>
                                <td className="px-4 py-3 text-slate-500">{product.productType}</td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-700">{product.quantity.toFixed(3)} L</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-800">₹{formatAmount(product.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-5 py-8 text-center text-sm text-slate-400">No product sales recorded.</div>
                    )}
                  </div>

                  {selectedSale.cashClosure && (
                    <div className="rounded-xl border border-slate-100 bg-white">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-800">Cash Closure</h3>
                          {selectedSale.cashClosure.status && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                              {selectedSale.cashClosure.status}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-4 p-4 sm:grid-cols-3">
                        <PreviewCard label="Expected Cash" value={`₹${formatAmount(selectedSale.cashClosure.expectedCash)}`} />
                        <PreviewCard
                          label="Actual Cash"
                          value={`₹${formatAmount(
                            selectedSale.cashClosure.actualCashEntered ??
                              selectedSale.cashClosure.actualCash
                          )}`}
                        />
                        <PreviewCard label="Difference" value={`₹${formatAmount(selectedSale.cashClosure.difference)}`} />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {editingSale ? "Edit Daily Sales" : "Open Daily Sales"}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Create or update the business day entry.
                </p>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600">Daily Sales Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Daily Sales - 28-09-2026"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Business Date</label>
                <input
                  type="date"
                  value={form.businessDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      businessDate: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              {!editingSale && (
                <div className="rounded-lg bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
                  Only one active business day should exist for the account.
                  Transactions will be linked to this Daily Sales entry.
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {editingSale ? "Update Daily Sales" : "Open Daily Sales"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="grid min-h-64 place-items-center px-5 py-12 text-center">
      <div>
        <div className="flex justify-center text-slate-300">
          {icon ?? <CalendarDays size={30} />}
        </div>
        <p className="mt-4 font-semibold text-slate-600">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">{message}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-700"
          >
            <Plus size={15} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
