import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  CalendarDays,
  Loader2,
  Plus,
  X,
} from "lucide-react";

import { api } from "../services/api";

/* =========================================================
   TYPES
========================================================= */

type DailySalesStatus = "ACTIVE" | "CLOSED" | string;

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
  };
}

interface DailySalesDetail extends DailySale {
  meterReadings?: unknown[];
  salesLines?: unknown[];
  creditSales?: unknown[];
  expenses?: unknown[];
  invoices?: unknown[];
  cashReceipts?: unknown[];

  cashClosure?: {
    id: string;
    status?: string;
    expectedCash?: string | number;
    actualCash?: string | number;
    difference?: string | number;
  } | null;
}

interface DailySalesForm {
  name: string;
  businessDate: string;
}

/* =========================================================
   PAGINATION
========================================================= */

const ITEMS_PER_PAGE = 10;

/* =========================================================
   HELPERS
========================================================= */

function getTodayDate() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatAmount(value?: string | number) {
  return Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function unwrapResponse<T>(response: any): T {
  return response?.data?.data ?? response?.data;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function DailySales() {
  /* =======================================================
     DATA STATE
  ======================================================= */

  const [sales, setSales] = useState<DailySale[]>(
    []
  );

  const [selectedSale, setSelectedSale] =
    useState<DailySalesDetail | null>(null);

  /* =======================================================
     LOADING / ERROR STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [detailError, setDetailError] =
    useState("");

  /* =======================================================
     MODAL STATE
  ======================================================= */

  const [showPreviewModal, setShowPreviewModal] =
    useState(false);

  const [showFormModal, setShowFormModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [editingSale, setEditingSale] =
    useState<DailySale | null>(null);

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [form, setForm] =
    useState<DailySalesForm>({
      name: "",
      businessDate: getTodayDate(),
    });

  /* =======================================================
     PAGINATION
  ======================================================= */

  const [currentPage, setCurrentPage] =
    useState(1);

  /* =======================================================
     ACTIVE SALE
  ======================================================= */

  const activeSale = useMemo(
    () =>
      sales.find(
        (sale) =>
          sale.status === "ACTIVE"
      ) ?? null,
    [sales]
  );

  /* =======================================================
     PAGINATION CALCULATIONS
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      sales.length / ITEMS_PER_PAGE
    )
  );

  const paginatedSales = useMemo(() => {
    const start =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    const end =
      start + ITEMS_PER_PAGE;

    return sales.slice(start, end);
  }, [
    sales,
    currentPage,
  ]);

  const startRecord =
    sales.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const endRecord = Math.min(
    currentPage * ITEMS_PER_PAGE,
    sales.length
  );

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];

    for (
      let page = 1;
      page <= totalPages;
      page++
    ) {
      pages.push(page);
    }

    return pages;
  }, [totalPages]);

  /* =======================================================
     LOAD DAILY SALES
  ======================================================= */

  const loadDailySales = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/daily-sales");

      const data =
        unwrapResponse<DailySale[]>(
          response
        );

      const list = Array.isArray(data)
        ? data
        : [];

      setSales(list);

      setCurrentPage(1);

      /*
       * Keep selected sale if it still exists.
       * Otherwise select active sale or first sale.
       */

      const currentSelectedId =
        selectedSale?.id;

      const nextSelected =
        list.find(
          (sale) =>
            sale.id ===
            currentSelectedId
        ) ??
        list.find(
          (sale) =>
            sale.status === "ACTIVE"
        ) ??
        list[0] ??
        null;

      /*
       * Do not automatically open preview modal.
       * Only keep the selected data internally.
       */

      if (nextSelected) {
        await loadDailySalesDetail(
          nextSelected.id
        );
      } else {
        setSelectedSale(null);
      }
    } catch (err: any) {
      console.error(
        "Daily sales loading error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load daily sales."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD DAILY SALES DETAIL
  ======================================================= */

  const loadDailySalesDetail = async (
    id: string
  ) => {
    try {
      setDetailLoading(true);
      setDetailError("");

      const response =
        await api.get(
          `/daily-sales/${id}`
        );

      const data =
        unwrapResponse<DailySalesDetail>(
          response
        );

      setSelectedSale(data);
    } catch (err: any) {
      console.error(
        "Daily sales detail error:",
        err
      );

      setDetailError(
        err?.response?.data?.message ||
          "Unable to load daily sales details."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadDailySales();
  }, []);

  /* =======================================================
     PREVIEW
  ======================================================= */

  const handlePreview = async (
    sale: DailySale
  ) => {
    setShowPreviewModal(true);

    await loadDailySalesDetail(
      sale.id
    );
  };

  /* =======================================================
     CLOSE PREVIEW MODAL
  ======================================================= */

  const closePreviewModal = () => {
    if (detailLoading) return;

    setShowPreviewModal(false);
  };

  /* =======================================================
     DOWNLOAD
  ======================================================= */

  const handleDownload = (
    sale: DailySale
  ) => {
    /*
     * Download API can be connected later.
     */

    console.log(
      "Download requested:",
      sale.id
    );
  };

  /* =======================================================
     CREATE MODAL
  ======================================================= */

  const openCreateModal = () => {
    setEditingSale(null);
    setFormError("");

    const today =
      getTodayDate();

    setForm({
      name: `Daily Sales - ${today
        .split("-")
        .reverse()
        .join("-")}`,
      businessDate: today,
    });

    setShowFormModal(true);
  };

  /* =======================================================
     EDIT MODAL
  ======================================================= */

  const openEditModal = (
    sale: DailySale
  ) => {
    /*
     * CLOSED daily sales should not be editable.
     * Backend also protects CLOSED records.
     */

    if (sale.status === "CLOSED") {
      return;
    }

    setEditingSale(sale);
    setFormError("");

    setForm({
      name: sale.name,
      businessDate:
        sale.businessDate.slice(
          0,
          10
        ),
    });

    setShowFormModal(true);
  };

  /* =======================================================
     CLOSE FORM MODAL
  ======================================================= */

  const closeFormModal = () => {
    if (saving) return;

    setShowFormModal(false);
    setEditingSale(null);
    setFormError("");
  };

  /* =======================================================
     CREATE / UPDATE
  ======================================================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setFormError("");

    if (!form.name.trim()) {
      setFormError(
        "Daily sales name is required."
      );
      return;
    }

    if (!form.businessDate) {
      setFormError(
        "Business date is required."
      );
      return;
    }

    try {
      setSaving(true);

      /* ===============================================
         UPDATE
      =============================================== */

      if (editingSale) {
        await api.patch(
          `/daily-sales/${editingSale.id}`,
          {
            name: form.name.trim(),
            businessDate:
              form.businessDate,
          }
        );
      } else {
        /* =============================================
           CREATE
        ============================================= */

        if (activeSale) {
          setFormError(
            "An active daily sales entry already exists. Close the current business day before opening another."
          );

          return;
        }

        await api.post(
          "/daily-sales",
          {
            name: form.name.trim(),
            businessDate:
              form.businessDate,
          }
        );
      }

      setShowFormModal(false);
      setEditingSale(null);

      await loadDailySales();
    } catch (err: any) {
      console.error(
        "Daily sales save error:",
        err
      );

      setFormError(
        err?.response?.data?.message ||
          "Unable to save daily sales."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     PAGINATION
  ======================================================= */

  const goToPage = (
    page: number
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(
        (page) => page - 1
      );
    }
  };

  const goToNextPage = () => {
    if (
      currentPage < totalPages
    ) {
      setCurrentPage(
        (page) => page + 1
      );
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-4">

      {/* =================================================
          MAIN DAILY SALES CARD
      ================================================= */}

      <div className="card overflow-hidden">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

          <div>
            <h2 className="text-base font-bold text-slate-800">
              Daily Sales
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Manage business day entries.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="text-xs text-slate-400">
              {sales.length}{" "}
              {sales.length === 1
                ? "Entry"
                : "Entries"}
            </div>

            {!activeSale &&
              !loading && (
                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-700"
                >
                  <Plus size={15} />
                  Open Daily Sales
                </button>
              )}
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mx-5 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <Loader2
              size={26}
              className="animate-spin text-brand-600"
            />
          </div>
        ) : sales.length === 0 ? (

          /* ===============================================
             EMPTY STATE
          =============================================== */

          <EmptyState
            icon={
              <CalendarDays
                size={30}
              />
            }
            title="No daily sales entry"
            message="Open a business day to start recording transactions."
            actionLabel="Open Daily Sales"
            onAction={
              openCreateModal
            }
          />

        ) : (

          <>
            {/* ===========================================
                TABLE
            =========================================== */}

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px] text-sm">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400">
                      Daily Sales
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400">
                      Business Date
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400">
                      Total Amount
                    </th>

                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-400">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {paginatedSales.map(
                    (sale) => {

                      const isSelected =
                        selectedSale?.id ===
                        sale.id;

                      return (
                        <tr
                          key={sale.id}
                          className={[
                            "border-t border-slate-100 transition",
                            isSelected
                              ? "bg-brand-50/40"
                              : "hover:bg-slate-50",
                          ].join(" ")}
                        >

                          {/* DAILY SALES */}

                          <td className="px-5 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                handlePreview(
                                  sale
                                )
                              }
                              className="text-left"
                            >

                              <p className="font-semibold text-slate-800">
                                {sale.name}
                              </p>

                              <p className="mt-1 max-w-[280px] truncate font-mono text-[11px] text-slate-400">
                                {sale.id}
                              </p>

                            </button>

                          </td>

                          {/* DATE */}

                          <td className="px-5 py-4 text-slate-600">
                            {formatDate(
                              sale.businessDate
                            )}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            {sale.status ===
                            "ACTIVE" ? (

                              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                                ACTIVE
                              </span>

                            ) : (

                              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                CLOSED
                              </span>

                            )}

                          </td>

                          {/* TOTAL */}

                          <td className="px-5 py-4 text-right font-bold text-slate-800">

                            ₹
                            {formatAmount(
                              sale.totalAmount
                            )}

                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-center gap-2">

                              {sale.status ===
                              "CLOSED" ? (

                                <>
                                  {/* DOWNLOAD */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDownload(
                                        sale
                                      )
                                    }
                                    className="rounded-lg bg-green-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-600"
                                    title="Download"
                                  >
                                    Download
                                  </button>

                                  {/* EDIT */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditModal(
                                        sale
                                      )
                                    }
                                    className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                                    title="Edit"
                                  >
                                    Edit
                                  </button>
                                </>

                              ) : (

                                <>
                                  {/* PREVIEW */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePreview(
                                        sale
                                      )
                                    }
                                    className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                                    title="Preview"
                                  >
                                    Preview
                                  </button>

                                  {/* EDIT */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditModal(
                                        sale
                                      )
                                    }
                                    className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                                    title="Edit"
                                  >
                                    Edit
                                  </button>
                                </>

                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

            {/* ===========================================
                PAGINATION
            =========================================== */}

            {sales.length >
              ITEMS_PER_PAGE && (

              <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                {/* RECORD INFO */}

                <p className="text-xs text-slate-400">

                  Showing{" "}

                  <span className="font-semibold text-slate-600">
                    {startRecord}
                  </span>

                  {" "}to{" "}

                  <span className="font-semibold text-slate-600">
                    {endRecord}
                  </span>

                  {" "}of{" "}

                  <span className="font-semibold text-slate-600">
                    {sales.length}
                  </span>

                  {" "}entries

                </p>

                {/* PAGINATION */}

                <div className="flex items-center gap-1">

                  {/* PREVIOUS */}

                  <button
                    type="button"
                    onClick={
                      goToPreviousPage
                    }
                    disabled={
                      currentPage === 1
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {/* PAGE NUMBERS */}

                  <div className="flex items-center gap-1">

                    {pageNumbers.map(
                      (page) => (

                        <button
                          key={page}
                          type="button"
                          onClick={() =>
                            goToPage(
                              page
                            )
                          }
                          className={[
                            "h-9 min-w-9 rounded-lg px-3 text-xs font-semibold transition",
                            currentPage ===
                            page
                              ? "bg-brand-600 text-white"
                              : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          {page}
                        </button>

                      )
                    )}

                  </div>

                  {/* NEXT */}

                  <button
                    type="button"
                    onClick={
                      goToNextPage
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
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

      {/* =================================================
          DAILY SALES PREVIEW MODAL
      ================================================= */}

      {showPreviewModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">

          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>

                <h2 className="text-base font-bold text-slate-800">
                  Daily Sales Preview
                </h2>

                {selectedSale && (
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedSale.name}
                  </p>
                )}

              </div>

              <button
                type="button"
                onClick={
                  closePreviewModal
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>

            </div>

            {/* BODY */}

            <div className="overflow-y-auto p-5">

              {detailLoading ? (

                <div className="grid min-h-64 place-items-center">

                  <Loader2
                    size={28}
                    className="animate-spin text-brand-600"
                  />

                </div>

              ) : detailError ? (

                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {detailError}
                </div>

              ) : selectedSale ? (

                <div className="space-y-5">

                  {/* BASIC DETAILS */}

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Daily Sales
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-800">
                          {selectedSale.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Business Date:{" "}
                          {formatDate(
                            selectedSale.businessDate
                          )}
                        </p>

                      </div>

                      {selectedSale.status ===
                      "ACTIVE" ? (

                        <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                          ACTIVE
                        </span>

                      ) : (

                        <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                          CLOSED
                        </span>

                      )}

                    </div>

                  </div>

                  {/* SUMMARY */}

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <PreviewCard
                      label="Total Amount"
                      value={`₹${formatAmount(
                        selectedSale.totalAmount
                      )}`}
                    />

                    <PreviewCard
                      label="Meter Readings"
                      value={String(
                        selectedSale
                          ._count
                          ?.meterReadings ??
                          selectedSale
                            .meterReadings
                            ?.length ??
                          0
                      )}
                    />

                    <PreviewCard
                      label="Credit Sales"
                      value={String(
                        selectedSale
                          ._count
                          ?.creditSales ??
                          selectedSale
                            .creditSales
                            ?.length ??
                          0
                      )}
                    />

                    <PreviewCard
                      label="Expenses"
                      value={String(
                        selectedSale
                          ._count
                          ?.expenses ??
                          selectedSale
                            .expenses
                            ?.length ??
                          0
                      )}
                    />

                  </div>

                  {/* TRANSACTION SUMMARY */}

                  <div className="rounded-xl border border-slate-100 bg-white">

                    <div className="border-b border-slate-100 px-4 py-3">

                      <h3 className="text-sm font-bold text-slate-800">
                        Transaction Summary
                      </h3>

                    </div>

                    <div className="divide-y divide-slate-100">

                      <SummaryRow
                        label="Meter Readings"
                        value={
                          selectedSale
                            ._count
                            ?.meterReadings ??
                          selectedSale
                            .meterReadings
                            ?.length ??
                          0
                        }
                      />

                      <SummaryRow
                        label="Sales Lines"
                        value={
                          selectedSale
                            ._count
                            ?.salesLines ??
                          selectedSale
                            .salesLines
                            ?.length ??
                          0
                        }
                      />

                      <SummaryRow
                        label="Credit Sales"
                        value={
                          selectedSale
                            ._count
                            ?.creditSales ??
                          selectedSale
                            .creditSales
                            ?.length ??
                          0
                        }
                      />

                      <SummaryRow
                        label="Oil Invoices"
                        value={
                          selectedSale
                            ._count
                            ?.invoices ??
                          selectedSale
                            .invoices
                            ?.length ??
                          0
                        }
                      />

                      <SummaryRow
                        label="Expenses"
                        value={
                          selectedSale
                            ._count
                            ?.expenses ??
                          selectedSale
                            .expenses
                            ?.length ??
                          0
                        }
                      />

                      <SummaryRow
                        label="Cash Receipts"
                        value={
                          selectedSale
                            ._count
                            ?.cashReceipts ??
                          selectedSale
                            .cashReceipts
                            ?.length ??
                          0
                        }
                      />

                    </div>

                  </div>

                  {/* CASH CLOSURE */}

                  {selectedSale.cashClosure && (

                    <div className="rounded-xl border border-slate-100 bg-white">

                      <div className="border-b border-slate-100 px-4 py-3">

                        <div className="flex items-center justify-between">

                          <h3 className="text-sm font-bold text-slate-800">
                            Cash Closure
                          </h3>

                          {selectedSale
                            .cashClosure
                            .status && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                              {
                                selectedSale
                                  .cashClosure
                                  .status
                              }
                            </span>
                          )}

                        </div>

                      </div>

                      <div className="grid gap-4 p-4 sm:grid-cols-3">

                        <PreviewCard
                          label="Expected Cash"
                          value={`₹${formatAmount(
                            selectedSale
                              .cashClosure
                              .expectedCash
                          )}`}
                        />

                        <PreviewCard
                          label="Actual Cash"
                          value={`₹${formatAmount(
                            selectedSale
                              .cashClosure
                              .actualCash
                          )}`}
                        />

                        <PreviewCard
                          label="Difference"
                          value={`₹${formatAmount(
                            selectedSale
                              .cashClosure
                              .difference
                          )}`}
                        />

                      </div>

                    </div>

                  )}

                </div>

              ) : null}

            </div>

            {/* FOOTER */}

            <div className="flex justify-end border-t border-slate-100 px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setShowPreviewModal(
                    false
                  )
                }
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          CREATE / EDIT MODAL
      ================================================= */}

      {showFormModal && (

        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>

                <h2 className="text-base font-bold text-slate-800">

                  {editingSale
                    ? "Edit Daily Sales"
                    : "Open Daily Sales"}

                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Create or update the business day entry.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeFormModal
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5 p-5"
            >

              {/* ERROR */}

              {formError && (

                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>

              )}

              {/* NAME */}

              <div>

                <label className="text-xs font-bold text-slate-600">
                  Daily Sales Name
                </label>

                <input
                  type="text"
                  value={
                    form.name
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        name:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Daily Sales - 28-09-2026"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />

              </div>

              {/* BUSINESS DATE */}

              <div>

                <label className="text-xs font-bold text-slate-600">
                  Business Date
                </label>

                <input
                  type="date"
                  value={
                    form.businessDate
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        businessDate:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />

              </div>

              {/* INFO */}

              {!editingSale && (

                <div className="rounded-lg bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">

                  Only one active business day
                  should exist for the account.
                  Transactions will be linked to
                  this Daily Sales entry.

                </div>

              )}

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">

                <button
                  type="button"
                  onClick={
                    closeFormModal
                  }
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

                  {saving && (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  {editingSale
                    ? "Update Daily Sales"
                    : "Open Daily Sales"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   PREVIEW CARD
========================================================= */

function PreviewCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-slate-800">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-semibold text-slate-800">
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

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
          {icon ?? (
            <CalendarDays
              size={30}
            />
          )}
        </div>

        <p className="mt-4 font-semibold text-slate-600">
          {title}
        </p>

        <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
          {message}
        </p>

        {actionLabel &&
          onAction && (

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