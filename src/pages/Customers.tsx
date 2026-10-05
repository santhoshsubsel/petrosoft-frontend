import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Eye, History, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import GenericPage from "./GenericPage";
import { api } from "../services/api";

/* =========================================================
   TYPES
========================================================= */

type Amount = string | number | null | undefined;

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  creditLimit?: Amount;
  creditOutstanding?: Amount;
  totalCreditAmount?: Amount; // optional - used when the backend returns it
  totalReceivedAmount?: Amount; // optional - used when the backend returns it
  address?: string | null;
  active?: boolean;
}

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  creditLimit: string;
  address: string;
}

interface PaymentHistoryItem {
  id: string;
  receiptNumber?: string;
  amount: Amount;
  paymentMethod?: string;
  referenceNumber?: string | null;
  comments?: string | null;
  receivedAt?: string;
  createdAt?: string;
}

interface CreditSaleRow {
  id: string;
  customerId: string;
  dailySalesId?: string;
  totalAmount: Amount;
  status?: string;
  saleDate?: string;
  cashReceipts?: Array<{ amount?: Amount; receivedAmount?: Amount }>;
}

/** Row of GET /cash-receipts */
interface CashReceiptRow extends PaymentHistoryItem {
  customerId?: string | null;
  creditSaleId?: string | null;
  dailySalesId?: string;
}

type CustomerAction = "OPTIONS" | "PAYMENT" | "RECEIPT" | "TIMELINE" | null;

interface CreditTimelineItem {
  id: string;
  type: "CREDIT" | "PAYMENT";
  date?: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  reference?: string | null;
  paymentMethod?: string | null;
}

/** Possible mount paths. The first one that responds is used. */
const CREDIT_ENDPOINTS = ["/credit", "/credits", "/credit-sales"];
const RECEIPT_ENDPOINTS = ["/cash-receipts", "/cash-receipt"];

const round2 = (v: number) => Math.round(v * 100) / 100;

async function fetchList<T>(
  endpoints: string[]
): Promise<{ rows: T[]; error: string; endpoint: string }> {
  let lastError = "";

  for (const endpoint of endpoints) {
    try {
      const res = await api.get(endpoint);
      const data = unwrap<T[]>(res.data);
      if (Array.isArray(data)) return { rows: data, error: "", endpoint };
      lastError = `Unexpected response from ${endpoint}`;
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } } | null)?.response?.status;
      lastError = `${errMsg(e, `Request to ${endpoint} failed`)}${status ? ` (HTTP ${status})` : ""}`;
      if (status !== 404) break; // 401 / 403 / 500 -> path is right, stop trying others
    }
  }

  return { rows: [], error: lastError, endpoint: endpoints[0] };
}

/** A cash receipt must be linked to the ACTIVE business day (backend rule). */
async function fetchActiveDay(): Promise<{ id: string } | null> {
  const res = await api.get("/daily-sales");
  const rows = unwrap<Array<{ id: string; status: string }>>(res.data);
  return (Array.isArray(rows) ? rows : []).find((d) => d.status === "ACTIVE") ?? null;
}

/* =========================================================
   HELPERS
========================================================= */

function unwrap<T>(payload: unknown): T {
  const p = payload as { data?: T } | undefined;
  return (p && typeof p === "object" && "data" in p ? p.data : payload) as T;
}

function errMsg(e: unknown, fallback: string) {
  const res = (e as { response?: { data?: { message?: unknown } } } | null)?.response;
  return typeof res?.data?.message === "string" ? res.data.message : fallback;
}

const num = (v: Amount) => Number(v || 0);

function formatAmount(value?: Amount) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const PAGE_SIZES = [10, 25, 50, 100];

/** 1 … 4 5 6 … 20  style page list */
function getPageNumbers(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: Array<number | "…"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);

  return pages;
}

const emptyForm: CustomerForm = { name: "", phone: "", email: "", creditLimit: "", address: "" };

function ModalFrame({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4 backdrop-blur-[2px]">
      <div className={`flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Customers() {
  /* ---------------------------- customers ---------------------------- */
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [credits, setCredits] = useState<CreditSaleRow[]>([]);
  const [creditsLoaded, setCreditsLoaded] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [receipts, setReceipts] = useState<CashReceiptRow[]>([]);
  const [receiptsLoaded, setReceiptsLoaded] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [receiptBase, setReceiptBase] = useState(RECEIPT_ENDPOINTS[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ------------------------- customer modal -------------------------- */
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);

  /* ---------------------- payment / receipt state -------------------- */
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerAction, setCustomerAction] = useState<CustomerAction>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentComments, setPaymentComments] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [paymentHistoryError, setPaymentHistoryError] = useState("");

  /* ------------------------ credit timeline state ---------------------- */
  const [creditTimeline, setCreditTimeline] = useState<CreditTimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState("");

  /* ---------------------------- load data ---------------------------- */

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const [response, creditResult, receiptResult] = await Promise.all([
        api.get("/customers"),
        fetchList<CreditSaleRow>(CREDIT_ENDPOINTS),
        fetchList<CashReceiptRow>(RECEIPT_ENDPOINTS),
      ]);

      const data = unwrap<Customer[]>(response.data);
      setCustomers(Array.isArray(data) ? data : []);
      setCredits(creditResult.rows);
      setCreditsLoaded(!creditResult.error);
      setCreditError(creditResult.error);
      setReceipts(receiptResult.rows);
      setReceiptsLoaded(!receiptResult.error);
      setReceiptError(receiptResult.error);
      if (!receiptResult.error) setReceiptBase(receiptResult.endpoint);
    } catch (err: unknown) {
      console.error("Customer loading error:", err);
      setError(errMsg(err, "Unable to load customers."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  /* ---------------- credit totals per customer (table) --------------- */

  const creditTotals = useMemo(() => {
    const map = new Map<string, { credit: number; received: number }>();
    const rowFor = (id: string) => map.get(id) ?? { credit: 0, received: 0 };

    credits
      .filter((c) => c.status !== "CANCELLED")
      .forEach((c) => {
        const row = rowFor(c.customerId);
        row.credit += num(c.totalAmount);
        // fallback when /cash-receipts is not reachable
        if (!receiptsLoaded) {
          row.received += (c.cashReceipts ?? []).reduce(
            (sum, r) => sum + num(r.amount ?? r.receivedAmount),
            0
          );
        }
        map.set(c.customerId, row);
      });

    // received = every cash receipt of the customer (linked to a credit sale or not)
    if (receiptsLoaded) {
      receipts.forEach((r) => {
        if (!r.customerId) return;
        const row = rowFor(r.customerId);
        row.received += num(r.amount);
        map.set(r.customerId, row);
      });
    }

    return map;
  }, [credits, receipts, receiptsLoaded]);

  const tableRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return customers
      .filter(
        (c) =>
          !term ||
          `${c.name} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase().includes(term)
      )
      .map((c) => {
        const local = creditTotals.get(c.id);
        const totalCredit =
          c.totalCreditAmount != null ? num(c.totalCreditAmount) : local?.credit ?? 0;
        const totalReceived =
          c.totalReceivedAmount != null ? num(c.totalReceivedAmount) : local?.received ?? 0;
        const outstanding =
          c.creditOutstanding != null
            ? num(c.creditOutstanding)
            : Math.max(0, totalCredit - totalReceived);

        return { customer: c, totalCredit, totalReceived, outstanding };
      })
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [customers, creditTotals, search]);

  const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedRows = tableRows.slice(pageStart, pageStart + pageSize);
  const showingFrom = tableRows.length ? pageStart + 1 : 0;
  const showingTo = Math.min(pageStart + pageSize, tableRows.length);

  /* -------------------------- customer modal ------------------------- */

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormError("");
    setForm(emptyForm);
    setShowCustomerModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormError("");
    setForm({
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      creditLimit:
        customer.creditLimit !== undefined && customer.creditLimit !== null
          ? String(customer.creditLimit)
          : "",
      address: customer.address ?? "",
    });
    setShowCustomerModal(true);
  };

  const closeCustomerModal = () => {
    if (saving) return;
    setShowCustomerModal(false);
    setEditingCustomer(null);
    setFormError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim()) return setFormError("Customer name is required.");
    if (!form.phone.trim()) return setFormError("Phone number is required.");
    if (form.creditLimit !== "" && Number(form.creditLimit) < 0) {
      return setFormError("Credit limit cannot be negative.");
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        creditLimit: form.creditLimit === "" ? 0 : Number(form.creditLimit),
        address: form.address.trim() || null,
      };

      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, payload);
      } else {
        await api.post("/customers", payload);
      }

      setShowCustomerModal(false);
      setEditingCustomer(null);
      await loadCustomers();
    } catch (err: unknown) {
      console.error("Customer save error:", err);
      setFormError(errMsg(err, "Unable to save customer."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Deactivate customer "${customer.name}"?`)) return;

    try {
      await api.delete(`/customers/${customer.id}`);
      await loadCustomers();
    } catch (err: unknown) {
      console.error("Customer delete error:", err);
      setError(errMsg(err, "Unable to delete customer."));
    }
  };

  /* ----------------------- payment / receipt ------------------------- */

  const resetPaymentForm = () => {
    setPaymentAmount("");
    setPaymentMethod("");
    setReferenceNumber("");
    setPaymentComments("");
    setPaymentError("");
  };

  const closeCustomerAction = () => {
    if (paymentSaving) return;
    setCustomerAction(null);
    setSelectedCustomer(null);
    resetPaymentForm();
  };

  /** Eye icon in the table row -> options popup (Add Payment / View Receipt) */
  const openCustomerActions = (
    customer: Customer,
    t: { totalCredit: number; totalReceived: number; outstanding: number }
  ) => {
    resetPaymentForm();
    // keep the same figures that are shown in the table
    setSelectedCustomer({
      ...customer,
      creditOutstanding: t.outstanding,
      totalCreditAmount: t.totalCredit,
      totalReceivedAmount: t.totalReceived,
    });
    setCustomerAction("OPTIONS");
  };

  const openPaymentModal = () => {
    if (!selectedCustomer) return;
    resetPaymentForm();
    setCustomerAction("PAYMENT");
  };

  const handleAddPayment = async (event: FormEvent) => {
    event.preventDefault();
    setPaymentError("");

    if (!selectedCustomer) return setPaymentError("Customer not selected.");
    if (!paymentAmount) return setPaymentError("Received amount is required.");

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return setPaymentError("Enter a valid payment amount.");
    }
    if (!paymentMethod) return setPaymentError("Payment method is required.");

    const outstanding = num(selectedCustomer.creditOutstanding);
    if (outstanding <= 0) return setPaymentError("This customer has no outstanding amount.");
    if (amount > outstanding + 0.005) {
      return setPaymentError(
        `Payment cannot exceed outstanding amount of ₹${formatAmount(outstanding)}.`
      );
    }

    try {
      setPaymentSaving(true);

      const day = await fetchActiveDay();
      if (!day) {
        setPaymentError("Open a business day in Daily Sales before recording a payment.");
        return;
      }

      const common = {
        dailySalesId: day.id,
        customerId: selectedCustomer.id,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || null,
        comments: paymentComments.trim() || null,
      };

      // amount already received against each credit sale
      const paidByCredit = new Map<string, number>();
      receipts.forEach((r) => {
        if (r.creditSaleId) {
          paidByCredit.set(r.creditSaleId, (paidByCredit.get(r.creditSaleId) ?? 0) + num(r.amount));
        }
      });

      // settle the oldest open credit sales of the ACTIVE day first (updates PAID / PARTIALLY_PAID)
      const openCredits = credits
        .filter(
          (c) =>
            c.customerId === selectedCustomer.id &&
            c.dailySalesId === day.id &&
            c.status !== "CANCELLED" &&
            c.status !== "PAID"
        )
        .sort((a, b) => String(a.saleDate).localeCompare(String(b.saleDate)));

      let remaining = amount;

      for (const credit of openCredits) {
        if (remaining <= 0.004) break;
        const due = num(credit.totalAmount) - (paidByCredit.get(credit.id) ?? 0);
        if (due <= 0.004) continue;

        const part = round2(Math.min(due, remaining));
        await api.post(receiptBase, { ...common, creditSaleId: credit.id, amount: part });
        remaining = round2(remaining - part);
      }

      // balance (older-day credits / no linkable credit sale) is saved as a customer receipt
      if (remaining > 0.004) {
        await api.post(receiptBase, { ...common, amount: remaining });
      }

      setCustomerAction(null);
      setSelectedCustomer(null);
      resetPaymentForm();
      await loadCustomers();
    } catch (err: unknown) {
      console.error("Payment save error:", err);
      setPaymentError(errMsg(err, "Unable to save payment."));
    } finally {
      setPaymentSaving(false);
    }
  };

  const loadPaymentHistory = async (customer: Customer) => {
    setPaymentHistoryLoading(true);
    setPaymentHistoryError("");

    const result = await fetchList<CashReceiptRow>(RECEIPT_ENDPOINTS);

    if (result.error) {
      setPaymentHistoryError(result.error);
      setPaymentHistory([]);
    } else {
      setPaymentHistory(
        result.rows
          .filter((r) => r.customerId === customer.id)
          .sort((a, b) =>
            String(b.receivedAt ?? b.createdAt).localeCompare(String(a.receivedAt ?? a.createdAt))
          )
      );
    }

    setPaymentHistoryLoading(false);
  };

  const openReceiptModal = async () => {
    if (!selectedCustomer) return;
    setPaymentHistory([]);
    setCustomerAction("RECEIPT");
    await loadPaymentHistory(selectedCustomer);
  };

  /** Build the customer's complete credit/payment running-balance timeline. */
  const openCreditTimeline = async () => {
    if (!selectedCustomer) return;

    setTimelineLoading(true);
    setTimelineError("");
    setCreditTimeline([]);
    setCustomerAction("TIMELINE");

    try {
      // Use the already loaded credit/receipt data when available.
      // If either list was unavailable, refresh it before building the timeline.
      let creditRows = credits;
      let receiptRows = receipts;

      if (!creditsLoaded) {
        const result = await fetchList<CreditSaleRow>(CREDIT_ENDPOINTS);
        if (result.error) {
          throw new Error(result.error);
        }
        creditRows = result.rows;
      }

      if (!receiptsLoaded) {
        const result = await fetchList<CashReceiptRow>(RECEIPT_ENDPOINTS);
        if (result.error) {
          throw new Error(result.error);
        }
        receiptRows = result.rows;
      }

      const transactions: Array<{
        id: string;
        type: "CREDIT" | "PAYMENT";
        date?: string;
        amount: number;
        reference?: string | null;
        paymentMethod?: string | null;
      }> = [];

      creditRows
        .filter(
          (credit) =>
            credit.customerId === selectedCustomer.id &&
            credit.status !== "CANCELLED"
        )
        .forEach((credit) => {
          transactions.push({
            id: `credit-${credit.id}`,
            type: "CREDIT",
            date: credit.saleDate,
            amount: num(credit.totalAmount),
            reference: credit.id,
          });
        });

      receiptRows
        .filter((receipt) => receipt.customerId === selectedCustomer.id)
        .forEach((receipt) => {
          transactions.push({
            id: `payment-${receipt.id}`,
            type: "PAYMENT",
            date: receipt.receivedAt ?? receipt.createdAt,
            amount: num(receipt.amount),
            reference: receipt.receiptNumber ?? receipt.id,
            paymentMethod: receipt.paymentMethod ?? null,
          });
        });

      transactions.sort((a, b) => {
        const dateA = new Date(a.date ?? 0).getTime();
        const dateB = new Date(b.date ?? 0).getTime();

        if (dateA !== dateB) return dateA - dateB;

        // Keep credits before payments when they have the same timestamp.
        if (a.type !== b.type) return a.type === "CREDIT" ? -1 : 1;
        return a.id.localeCompare(b.id);
      });

      let runningBalance = 0;

      const timeline = transactions.map((transaction) => {
        const previousBalance = round2(runningBalance);

        runningBalance =
          transaction.type === "CREDIT"
            ? round2(runningBalance + transaction.amount)
            : round2(runningBalance - transaction.amount);

        return {
          ...transaction,
          previousBalance,
          newBalance: runningBalance,
        };
      });

      setCreditTimeline(timeline);
    } catch (err: unknown) {
      console.error("Credit timeline loading error:", err);
      setTimelineError(errMsg(err, "Unable to load customer credit timeline."));
    } finally {
      setTimelineLoading(false);
    }
  };

   const handlePrintPayment = (payment: PaymentHistoryItem) => {
    if (!selectedCustomer) return;

    const printWindow = window.open("", "_blank", "width=860,height=900");
    if (!printWindow) return;

    const receiptNumber = esc(payment.receiptNumber || payment.id);
    const paymentDate = esc(formatDate(payment.receivedAt || payment.createdAt));
    const customerName = esc(selectedCustomer.name);
    const customerPhone = esc(selectedCustomer.phone || "-");
    const method = esc(payment.paymentMethod || "-");

    const item = (label: string, value: string) =>
      `<div class="item">
        <div class="item-label">${label}</div>
        <div class="item-value">${value}</div>
      </div>`;

    printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Payment Receipt - ${receiptNumber}</title>
    <style>
      @page { size: A4; margin: 14mm; }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background: #f1f5f9;
        color: #0f172a;
        padding: 32px 16px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .receipt {
        max-width: 640px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
      }

      /* ---------- Header ---------- */
      .header {
        background: #0f172a;
        color: #ffffff;
        padding: 28px 32px 24px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 4px solid #f59e0b;
      }
      .brand { font-size: 22px; font-weight: 700; letter-spacing: 0.3px; }
      .brand-sub { font-size: 12px; color: #94a3b8; margin-top: 4px; letter-spacing: 1.5px; text-transform: uppercase; }
      .header-right { text-align: right; }
      .doc-title { font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #f59e0b; }
      .doc-number { font-size: 15px; font-weight: 600; margin-top: 6px; }

      /* ---------- Body ---------- */
      .body { padding: 28px 32px 8px; }

      .status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 22px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #dcfce7;
        color: #166534;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1.2px;
        padding: 6px 14px;
        border-radius: 999px;
      }
      .badge::before {
        content: "";
        width: 7px; height: 7px;
        border-radius: 50%;
        background: #16a34a;
      }
      .date { font-size: 13px; color: #64748b; }

      /* ---------- Amount card ---------- */
      .amount-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-left: 5px solid #f59e0b;
        border-radius: 12px;
        padding: 20px 24px;
        margin-bottom: 26px;
      }
      .amount-label { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #64748b; }
      .amount-value { font-size: 36px; font-weight: 800; margin-top: 6px; color: #0f172a; letter-spacing: -0.5px; }

      /* ---------- Details grid ---------- */
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px 24px;
        padding-bottom: 24px;
      }
      .item-label { font-size: 11px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: #94a3b8; }
      .item-value { font-size: 15px; font-weight: 600; margin-top: 5px; color: #1e293b; word-break: break-word; }
      .item.full { grid-column: 1 / -1; }

      .comments {
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 10px;
        padding: 14px 16px;
        margin-bottom: 24px;
      }
      .comments .item-label { color: #b45309; }
      .comments .item-value { font-weight: 500; font-size: 14px; color: #78350f; }

      /* ---------- Signature ---------- */
      .sign-row {
        display: flex;
        justify-content: space-between;
        margin: 36px 0 28px;
      }
      .sign {
        width: 40%;
        border-top: 1px dashed #cbd5e1;
        padding-top: 8px;
        text-align: center;
        font-size: 11px;
        color: #94a3b8;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      /* ---------- Footer ---------- */
      .footer {
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        text-align: center;
        padding: 18px 32px;
        font-size: 12px;
        color: #64748b;
      }
      .footer strong { color: #0f172a; }

      @media print {
        body { background: #ffffff; padding: 0; }
        .receipt { box-shadow: none; border-radius: 0; max-width: 100%; }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="header">
        <div>
          <div class="brand">PetroSoft</div>
          <div class="brand-sub">Payment Receipt</div>
        </div>
        <div class="header-right">
          <div class="doc-title">Cash Receipt</div>
          <div class="doc-number">#${receiptNumber}</div>
        </div>
      </div>

      <div class="body">
        <div class="status-row">
          <span class="badge">PAID</span>
          <span class="date">${paymentDate}</span>
        </div>

        <div class="amount-card">
          <div class="amount-label">Amount Paid</div>
          <div class="amount-value">₹${formatAmount(payment.amount)}</div>
        </div>

        <div class="grid">
          ${item("Received From", customerName)}
          ${item("Phone", customerPhone)}
          ${item("Payment Method", method)}
          ${item("Receipt Date", paymentDate)}
          ${
            payment.referenceNumber
              ? `<div class="item full">
                  <div class="item-label">Reference Number</div>
                  <div class="item-value">${esc(payment.referenceNumber)}</div>
                </div>`
              : ""
          }
        </div>

        ${
          payment.comments
            ? `<div class="comments">
                <div class="item-label">Comments</div>
                <div class="item-value">${esc(payment.comments)}</div>
              </div>`
            : ""
        }

        <div class="sign-row">
          <div class="sign">Customer Signature</div>
          <div class="sign">Authorized Signature</div>
        </div>
      </div>

      <div class="footer">
        <strong>Thank you for your payment.</strong><br />
        This is a computer-generated receipt.
      </div>
    </div>
  </body>
</html>`);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  /* ----------------------------- render ------------------------------ */

  const th = "px-4 py-3 text-xs font-bold text-slate-500";
  const thc = "px-3 py-3 text-[11px] font-bold leading-tight text-slate-500";

  return (
    <GenericPage
      title="Customer Credit Management"
      subtitle="Manage customers and customer payment receipts."
      action="New Customer"
      onAction={openCreateModal}
      showDefaultFilters={false}
    >
      <div className="space-y-4 ">
        {/* SEARCH */}
        <div className="card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">Customer List</p>
              <p className="mt-1 text-xs text-slate-400">
                Search customers and manage outstanding credit payments.
              </p>
            </div>
            <input
              className="input sm:max-w-sm"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search customer, phone or email..."
            />
          </div>
        </div>

        {error && (
          <div className="card border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {creditError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-bold">Credit totals could not be loaded</p>
            <p className="mt-1 text-xs">
              {creditError}. Check the credit route path and that the manager role has the
              credit_sales:read permission.
            </p>
          </div>
        )}

        {receiptError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-bold">Received amounts could not be loaded</p>
            <p className="mt-1 text-xs">
              {receiptError}. Check that the cash-receipt route is mounted (e.g. /cash-receipts) and
              the manager role has the cash-receipts:read permission.
            </p>
          </div>
        )}

        {/* CUSTOMER TABLE */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="grid min-h-52 place-items-center">
              <Loader2 className="animate-spin text-brand-600" size={24} />
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] table-fixed text-[13px]">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[11%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[13%]" />
                  <col className="w-[13%]" />
                  <col className="w-[13%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="bg-slate-50">
                  <tr>
                    <th className={`${thc} text-left`}>Customer Name</th>
                    <th className={`${thc} text-left`}>Phone</th>
                    <th className={`${thc} text-left`}>Status</th>
                    <th className={`${thc} text-right`}>Credit Limit</th>
                    <th className={`${thc} text-right`}>Total Credit Amount</th>
                    <th className={`${thc} text-right`}>Total Received Amount</th>
                    <th className={`${thc} text-right`}>Out Standing Balance</th>
                    <th className={`${thc} text-center`}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedRows.map(({ customer, totalCredit, totalReceived, outstanding }) => {
                    const inactive = customer.active === false;
                    const overDue = outstanding > 0;

                    return (
                      <tr
                        key={customer.id}
                        className="border-t border-slate-100 transition-colors hover:bg-slate-50"
                      >
                        <td className="px-3 py-3">
                          <p className="break-words font-bold leading-snug text-brand-600">
                            {customer.name}
                          </p>
                          {customer.email && (
                            <p className="mt-0.5 truncate text-[11px] text-slate-400" title={customer.email}>
                              {customer.email}
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-3 text-slate-600">{customer.phone || "-"}</td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              inactive
                                ? "bg-slate-100 text-slate-500"
                                : overDue
                                  ? "bg-red-50 text-red-600"
                                  : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {inactive ? "INACTIVE" : overDue ? "OVER DUE" : "CLEAR"}
                          </span>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-right font-semibold tabular-nums text-slate-700">
                          ₹{formatAmount(customer.creditLimit)}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-right tabular-nums text-slate-700">
                          {creditsLoaded || customer.totalCreditAmount != null
                            ? `₹${formatAmount(totalCredit)}`
                            : "—"}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-right tabular-nums text-emerald-600">
                          {creditsLoaded || customer.totalReceivedAmount != null
                            ? `₹${formatAmount(totalReceived)}`
                            : "—"}
                        </td>

                        <td
                          className={`px-3 py-3 whitespace-nowrap text-right font-extrabold tabular-nums ${
                            overDue ? "text-amber-700" : "text-emerald-600"
                          }`}
                        >
                          ₹{formatAmount(outstanding)}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                openCustomerActions(customer, { totalCredit, totalReceived, outstanding })
                              }
                              className="rounded-lg p-1.5 text-brand-600 transition hover:bg-blue-50"
                              title="View"
                              aria-label={`View ${customer.name}`}
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(customer)}
                              className="rounded-lg p-1.5 text-brand-600 transition hover:bg-blue-50"
                              title="Edit"
                              aria-label={`Edit ${customer.name}`}
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDelete(customer)}
                              className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                              title="Deactivate"
                              aria-label={`Deactivate ${customer.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!tableRows.length && (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">
                        {search ? "No customers match your search." : "No customers found."}
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>

            {tableRows.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span>
                    Showing{" "}
                    <b className="text-slate-700">
                      {showingFrom}–{showingTo}
                    </b>{" "}
                    of <b className="text-slate-700">{tableRows.length}</b> customers
                  </span>

                  <label className="flex items-center gap-1.5">
                    Rows per page
                    <select
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setPage(1);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-brand-500"
                    >
                      {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <nav aria-label="Pagination" className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {getPageNumbers(currentPage, totalPages).map((item, index) =>
                    item === "…" ? (
                      <span key={`gap-${index}`} className="px-1 text-xs text-slate-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        aria-current={item === currentPage ? "page" : undefined}
                        className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-semibold transition ${
                          item === currentPage
                            ? "bg-brand-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* CUSTOMER OPTIONS MODAL (Eye) */}
      {customerAction === "OPTIONS" && selectedCustomer && (
        <ModalFrame
          title={selectedCustomer.name}
          subtitle="Customer Credit Management"
          onClose={closeCustomerAction}
          maxWidth="max-w-md"
        >
          <div className="overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 p-5">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Phone</p>
                <p className="mt-1 font-semibold text-slate-700">{selectedCustomer.phone || "-"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Credit Limit</p>
                <p className="mt-1 font-semibold tabular-nums text-slate-700">
                  ₹{formatAmount(selectedCustomer.creditLimit)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Total Credit</p>
                <p className="mt-1 font-semibold tabular-nums text-slate-700">
                  {creditsLoaded ? `₹${formatAmount(selectedCustomer.totalCreditAmount)}` : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs text-emerald-600">Total Received</p>
                <p className="mt-1 font-semibold tabular-nums text-emerald-700">
                  {creditsLoaded ? `₹${formatAmount(selectedCustomer.totalReceivedAmount)}` : "—"}
                </p>
              </div>
              <div className="col-span-2 rounded-xl bg-amber-50 p-4">
                <p className="text-xs text-amber-600">Outstanding</p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-amber-700">
                  ₹{formatAmount(selectedCustomer.creditOutstanding)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 px-5 pb-5">
              <button
                type="button"
                onClick={openPaymentModal}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:border-brand-500 hover:bg-blue-50"
              >
                <div>
                  <p className="font-bold text-slate-800">Add Payment</p>
                  <p className="mt-1 text-xs text-slate-400">Record customer payment</p>
                </div>
                <Plus size={18} className="text-brand-600" />
              </button>

              <button
                type="button"
                onClick={() => void openReceiptModal()}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:border-brand-500 hover:bg-blue-50"
              >
                <div>
                  <p className="font-bold text-slate-800">View Receipt</p>
                  <p className="mt-1 text-xs text-slate-400">View payment history</p>
                </div>
                <Eye size={18} className="text-brand-600" />
              </button>

              <button
                type="button"
                onClick={() => void openCreditTimeline()}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:border-brand-500 hover:bg-blue-50"
              >
                <div>
                  <p className="font-bold text-slate-800">Customer Credit Timeline</p>
                  <p className="mt-1 text-xs text-slate-400">View credit and payment balance history</p>
                </div>
                <History size={18} className="text-brand-600" />
              </button>
            </div>
          </div>
        </ModalFrame>
      )}

      {/* ADD PAYMENT MODAL */}
      {customerAction === "PAYMENT" && selectedCustomer && (
        <ModalFrame title="Add Payment" subtitle={selectedCustomer.name} onClose={closeCustomerAction}>
          <form
            onSubmit={handleAddPayment}
            className="space-y-5 overflow-y-auto p-4 sm:p-5"
          >
            {paymentError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {paymentError}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-600">Customer</label>
              <input value={selectedCustomer.name} readOnly className="input mt-2 w-full bg-slate-50" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-600">Credit Limit</label>
                <input
                  value={`₹${formatAmount(selectedCustomer.creditLimit)}`}
                  readOnly
                  className="input mt-2 w-full bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-amber-700">Outstanding Amount</label>
                <input
                  value={`₹${formatAmount(selectedCustomer.creditOutstanding)}`}
                  readOnly
                  className="input mt-2 w-full bg-amber-50 font-extrabold text-amber-700"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">
                Received Amount<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max={num(selectedCustomer.creditOutstanding)}
                step="0.01"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                placeholder="Enter amount"
                className="input mt-2 w-full"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">
                Payment Method<span className="ml-1 text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="input mt-2 w-full"
              >
                <option value="">Select payment method</option>
                <option value="CASH">Cash</option>
                <option value="PAYTM">Paytm</option>
                <option value="CCMS_HP_PAY">CCMS / HP Pay</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Reference Number</label>
              <input
                value={referenceNumber}
                onChange={(event) => setReferenceNumber(event.target.value)}
                placeholder="Optional"
                className="input mt-2 w-full"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Comments</label>
              <textarea
                rows={3}
                value={paymentComments}
                onChange={(event) => setPaymentComments(event.target.value)}
                placeholder="Optional comments"
                className="input mt-2 w-full"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={closeCustomerAction}
                disabled={paymentSaving}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" disabled={paymentSaving} className="btn-primary text-xs">
                {paymentSaving && <Loader2 size={15} className="animate-spin" />}
                Save Payment
              </button>
            </div>
          </form>
        </ModalFrame>
      )}

      {/* VIEW RECEIPT MODAL */}
      {customerAction === "RECEIPT" && selectedCustomer && (
        <ModalFrame
          title="Cash Receipt"
          subtitle={`Payment history - ${selectedCustomer.name}`}
          onClose={closeCustomerAction}
          maxWidth="max-w-5xl"
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {paymentHistoryError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {paymentHistoryError}
              </div>
            )}

            {paymentHistoryLoading ? (
              <div className="grid min-h-48 place-items-center">
                <Loader2 size={24} className="animate-spin text-brand-600" />
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">
                No payment history found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-sm">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className={`${th} text-left`}>Receipt No.</th>
                      <th className={`${th} text-left`}>Customer Name</th>
                      <th className={`${th} text-left`}>Created Date</th>
                      <th className={`${th} text-left`}>Payment Method</th>
                      <th className={`${th} text-right`}>Amount Paid</th>
                      <th className={`${th} text-center`}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-4 font-medium text-brand-600">
                          {payment.receiptNumber || payment.id}
                        </td>
                        <td className="px-4 py-4 text-slate-700">{selectedCustomer.name}</td>
                        <td className="px-4 py-4 text-slate-600">
                          {formatDate(payment.receivedAt || payment.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-slate-600">{payment.paymentMethod || "-"}</td>
                        <td className="px-4 py-4 text-right font-bold tabular-nums text-slate-800">
                          ₹{formatAmount(payment.amount)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handlePrintPayment(payment)}
                            className="btn-primary px-4 py-2 text-xs"
                          >
                            Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-slate-100 px-5 py-4">
            <button type="button" onClick={closeCustomerAction} className="btn-secondary text-xs">
              Close
            </button>
          </div>
        </ModalFrame>
      )}

      {/* CUSTOMER CREDIT TIMELINE MODAL */}
      {customerAction === "TIMELINE" && selectedCustomer && (
        <ModalFrame
          title="Customer Credit Timeline"
          subtitle={`Credit and payment history - ${selectedCustomer.name}`}
          onClose={closeCustomerAction}
          maxWidth="max-w-5xl"
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Credit Limit</p>
                <p className="mt-1 font-semibold tabular-nums text-slate-700">
                  ₹{formatAmount(selectedCustomer.creditLimit)}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs text-brand-600">Total Credit</p>
                <p className="mt-1 font-semibold tabular-nums text-brand-700">
                  ₹{formatAmount(selectedCustomer.totalCreditAmount)}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-xs text-amber-600">Current Outstanding</p>
                <p className="mt-1 font-extrabold tabular-nums text-amber-700">
                  ₹{formatAmount(selectedCustomer.creditOutstanding)}
                </p>
              </div>
            </div>

            {timelineError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {timelineError}
              </div>
            )}

            {timelineLoading ? (
              <div className="grid min-h-48 place-items-center">
                <Loader2 size={24} className="animate-spin text-brand-600" />
              </div>
            ) : creditTimeline.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">
                No credit or payment history found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className={`${th} text-left`}>Date</th>
                      <th className={`${th} text-left`}>Transaction</th>
                      <th className={`${th} text-left`}>Reference</th>
                      <th className={`${th} text-right`}>Amount</th>
                      <th className={`${th} text-right`}>Previous Balance</th>
                      <th className={`${th} text-right`}>New Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...creditTimeline].reverse().map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-4 text-slate-600">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold ${
                              item.type === "CREDIT"
                                ? "bg-red-50 text-red-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {item.type === "CREDIT" ? "CREDIT ADDED" : "PAYMENT RECEIVED"}
                          </span>
                          {item.type === "PAYMENT" && item.paymentMethod && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              {item.paymentMethod}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {item.reference || "-"}
                        </td>
                        <td
                          className={`px-4 py-4 text-right font-bold tabular-nums ${
                            item.type === "CREDIT"
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {item.type === "CREDIT" ? "+" : "-"}₹{formatAmount(item.amount)}
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums text-slate-600">
                          ₹{formatAmount(item.previousBalance)}
                        </td>
                        <td className="px-4 py-4 text-right font-extrabold tabular-nums text-slate-800">
                          ₹{formatAmount(item.newBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-slate-100 px-5 py-4">
            <button type="button" onClick={closeCustomerAction} className="btn-secondary text-xs">
              Close
            </button>
          </div>
        </ModalFrame>
      )}

      {/* ADD / EDIT CUSTOMER MODAL */}
      {showCustomerModal && (
        <ModalFrame
          title={editingCustomer ? "Edit Customer" : "Add New Customer"}
          subtitle="Customer master data used for credit transactions."
          onClose={closeCustomerModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-4 sm:p-5">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-600">Customer Name</label>
              <input
                value={form.name}
                onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
                className="input mt-2 w-full"
                placeholder="Enter customer name"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-600">Phone</label>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((c) => ({ ...c, phone: event.target.value }))}
                  className="input mt-2 w-full"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Credit Limit</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.creditLimit}
                  onChange={(event) => setForm((c) => ({ ...c, creditLimit: event.target.value }))}
                  className="input mt-2 w-full"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((c) => ({ ...c, email: event.target.value }))}
                className="input mt-2 w-full"
                placeholder="Email address"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Address</label>
              <textarea
                value={form.address}
                onChange={(event) => setForm((c) => ({ ...c, address: event.target.value }))}
                rows={3}
                className="input mt-2 w-full"
                placeholder="Customer address"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={closeCustomerModal}
                disabled={saving}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary text-xs">
                {saving && <Loader2 size={15} className="animate-spin" />}
                {editingCustomer ? "Update Customer" : "Add Customer"}
              </button>
            </div>
          </form>
        </ModalFrame>
      )}
    </GenericPage>
  );
}