import { useEffect, useState } from "react";
import {
  Eye,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Trash2,
  X,
} from "lucide-react";

import GenericPage from "./GenericPage";
import { api } from "../services/api";

/* =========================================================
   TYPES
========================================================= */

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  creditLimit?: string | number | null;
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
  amount: string | number;
  paymentMethod?: string;
  referenceNumber?: string | null;
  comments?: string | null;
  receivedAt?: string;
  createdAt?: string;
}

type CustomerAction =
  | "OPTIONS"
  | "PAYMENT"
  | "RECEIPT"
  | null;

/* =========================================================
   HELPERS
========================================================= */

function unwrapResponse<T>(response: any): T {
  return response?.data?.data ?? response?.data;
}

function formatAmount(value?: string | number | null) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Customers() {
  /* =======================================================
     CUSTOMER STATE
  ======================================================= */

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [formError, setFormError] = useState("");

  /* =======================================================
     CUSTOMER MODAL
  ======================================================= */

  const [showCustomerModal, setShowCustomerModal] =
    useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [form, setForm] = useState<CustomerForm>({
    name: "",
    phone: "",
    email: "",
    creditLimit: "",
    address: "",
  });

  /* =======================================================
     ACTION / PAYMENT / RECEIPT
  ======================================================= */

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [customerAction, setCustomerAction] =
    useState<CustomerAction>(null);

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [referenceNumber, setReferenceNumber] =
    useState("");

  const [paymentComments, setPaymentComments] =
    useState("");

  const [paymentError, setPaymentError] =
    useState("");

  const [paymentSaving, setPaymentSaving] =
    useState(false);

  const [paymentHistory, setPaymentHistory] =
    useState<PaymentHistoryItem[]>([]);

  const [paymentHistoryLoading, setPaymentHistoryLoading] =
    useState(false);

  const [paymentHistoryError, setPaymentHistoryError] =
    useState("");

  /* =======================================================
     LOAD CUSTOMERS
  ======================================================= */

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers");

      const data = unwrapResponse<Customer[]>(response);

      setCustomers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Customer loading error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  /* =======================================================
     OPEN CREATE CUSTOMER
  ======================================================= */

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormError("");

    setForm({
      name: "",
      phone: "",
      email: "",
      creditLimit: "",
      address: "",
    });

    setShowCustomerModal(true);
  };

  /* =======================================================
     OPEN EDIT CUSTOMER
  ======================================================= */

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormError("");

    setForm({
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      creditLimit:
        customer.creditLimit !== undefined &&
        customer.creditLimit !== null
          ? String(customer.creditLimit)
          : "",
      address: customer.address ?? "",
    });

    setShowCustomerModal(true);
  };

  /* =======================================================
     CLOSE CUSTOMER MODAL
  ======================================================= */

  const closeCustomerModal = () => {
    if (saving) return;

    setShowCustomerModal(false);
    setEditingCustomer(null);
    setFormError("");
  };

  /* =======================================================
     CREATE / UPDATE CUSTOMER
  ======================================================= */

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setFormError("");

    if (!form.name.trim()) {
      setFormError("Customer name is required.");
      return;
    }

    if (!form.phone.trim()) {
      setFormError("Phone number is required.");
      return;
    }

    if (
      form.creditLimit !== "" &&
      Number(form.creditLimit) < 0
    ) {
      setFormError(
        "Credit limit cannot be negative."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        creditLimit:
          form.creditLimit === ""
            ? 0
            : Number(form.creditLimit),
        address: form.address.trim() || null,
      };

      if (editingCustomer) {
        await api.patch(
          `/customers/${editingCustomer.id}`,
          payload
        );
      } else {
        await api.post(
          "/customers",
          payload
        );
      }

      setShowCustomerModal(false);
      setEditingCustomer(null);

      await loadCustomers();
    } catch (err: any) {
      console.error("Customer save error:", err);

      setFormError(
        err?.response?.data?.message ||
          "Unable to save customer."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE CUSTOMER
  ======================================================= */

  const handleDelete = async (
    customer: Customer
  ) => {
    const confirmed = window.confirm(
      `Delete customer "${customer.name}"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/customers/${customer.id}`
      );

      await loadCustomers();
    } catch (err: any) {
      console.error(
        "Customer delete error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to delete customer."
      );
    }
  };

  /* =======================================================
     OPEN CUSTOMER ACTIONS
  ======================================================= */

  const openCustomerActions = (
    customer: Customer
  ) => {
    setSelectedCustomer(customer);
    setCustomerAction("OPTIONS");
    setPaymentError("");
  };

  /* =======================================================
     CLOSE CUSTOMER ACTION
  ======================================================= */

  const closeCustomerAction = () => {
    if (paymentSaving) return;

    setCustomerAction(null);
    setSelectedCustomer(null);

    setPaymentAmount("");
    setPaymentMethod("");
    setReferenceNumber("");
    setPaymentComments("");
    setPaymentError("");
  };

  /* =======================================================
     OPEN PAYMENT MODAL
  ======================================================= */

  const openPaymentModal = () => {
    if (!selectedCustomer) return;

    setPaymentError("");
    setPaymentAmount("");
    setPaymentMethod("");
    setReferenceNumber("");
    setPaymentComments("");

    setCustomerAction("PAYMENT");
  };

  /* =======================================================
     ADD PAYMENT
  ======================================================= */

  const handleAddPayment = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setPaymentError("");

    if (!selectedCustomer) {
      setPaymentError(
        "Customer not selected."
      );
      return;
    }

    if (!paymentAmount) {
      setPaymentError(
        "Received amount is required."
      );
      return;
    }

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError(
        "Enter a valid payment amount."
      );
      return;
    }

    if (!paymentMethod) {
      setPaymentError(
        "Payment method is required."
      );
      return;
    }

    try {
      setPaymentSaving(true);

      /*
       * Expected backend flow:
       *
       * POST /credits/:creditId/payments
       *
       * If your backend payment API uses a
       * different endpoint, change only this
       * API call.
       */

      await api.post(
        `/customers/${selectedCustomer.id}/payments`,
        {
          amount,
          paymentMethod,
          referenceNumber:
            referenceNumber.trim() || null,
          comments:
            paymentComments.trim() || null,
        }
      );

      setCustomerAction("OPTIONS");

      setPaymentAmount("");
      setPaymentMethod("");
      setReferenceNumber("");
      setPaymentComments("");

      await loadCustomers();
    } catch (err: any) {
      console.error(
        "Payment save error:",
        err
      );

      setPaymentError(
        err?.response?.data?.message ||
          "Unable to save payment."
      );
    } finally {
      setPaymentSaving(false);
    }
  };

  /* =======================================================
     LOAD PAYMENT HISTORY
  ======================================================= */

  const loadPaymentHistory = async () => {
    if (!selectedCustomer) return;

    try {
      setPaymentHistoryLoading(true);
      setPaymentHistoryError("");

      /*
       * Expected backend endpoint:
       *
       * GET /customers/:customerId/payments
       */

      const response = await api.get(
        `/customers/${selectedCustomer.id}/payments`
      );

      const data =
        unwrapResponse<PaymentHistoryItem[]>(
          response
        );

      setPaymentHistory(
        Array.isArray(data) ? data : []
      );
    } catch (err: any) {
      console.error(
        "Payment history error:",
        err
      );

      setPaymentHistoryError(
        err?.response?.data?.message ||
          "Unable to load payment history."
      );

      setPaymentHistory([]);
    } finally {
      setPaymentHistoryLoading(false);
    }
  };

  /* =======================================================
     OPEN RECEIPT HISTORY
  ======================================================= */

  const openReceiptModal = async () => {
    if (!selectedCustomer) return;

    setCustomerAction("RECEIPT");

    await loadPaymentHistory();
  };

  /* =======================================================
     PRINT PAYMENT
  ======================================================= */

  const handlePrintPayment = (
    payment: PaymentHistoryItem
  ) => {
    if (!selectedCustomer) return;

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=800,height=700"
      );

    if (!printWindow) {
      return;
    }

    const receiptNumber =
      payment.receiptNumber ||
      payment.id;

    const paymentDate =
      formatDate(
        payment.receivedAt ||
          payment.createdAt
      );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${receiptNumber}</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #222;
            }

            .receipt {
              max-width: 700px;
              margin: 0 auto;
              border: 1px solid #ddd;
              padding: 30px;
            }

            h1 {
              text-align: center;
              margin-bottom: 30px;
            }

            .row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }

            .label {
              font-weight: bold;
            }

            .amount {
              font-size: 24px;
              font-weight: bold;
              text-align: right;
              margin-top: 25px;
            }

            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>

        <body>
          <div class="receipt">

            <h1>Cash Receipt</h1>

            <div class="row">
              <span class="label">
                Receipt Number
              </span>

              <span>
                ${receiptNumber}
              </span>
            </div>

            <div class="row">
              <span class="label">
                Customer
              </span>

              <span>
                ${selectedCustomer.name}
              </span>
            </div>

            <div class="row">
              <span class="label">
                Phone
              </span>

              <span>
                ${selectedCustomer.phone || "-"}
              </span>
            </div>

            <div class="row">
              <span class="label">
                Created Date
              </span>

              <span>
                ${paymentDate}
              </span>
            </div>

            <div class="row">
              <span class="label">
                Payment Method
              </span>

              <span>
                ${payment.paymentMethod || "-"}
              </span>
            </div>

            ${
              payment.referenceNumber
                ? `
                  <div class="row">
                    <span class="label">
                      Reference Number
                    </span>

                    <span>
                      ${payment.referenceNumber}
                    </span>
                  </div>
                `
                : ""
            }

            <div class="amount">
              Amount Paid:
              ₹${formatAmount(payment.amount)}
            </div>

            ${
              payment.comments
                ? `
                  <div class="row">
                    <span class="label">
                      Comments
                    </span>

                    <span>
                      ${payment.comments}
                    </span>
                  </div>
                `
                : ""
            }

            <div class="footer">
              Thank you.
            </div>

          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <GenericPage
      title="Customer Credit Management"
      subtitle="Manage customers and customer payment receipts."
      action="New Customer"
      onAction={openCreateModal}
    >
      <div className="space-y-4">

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="card border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* =================================================
            CUSTOMER TABLE
        ================================================= */}

        <div className="card overflow-hidden">
          {loading ? (
            <div className="grid min-h-52 place-items-center">
              <Loader2
                className="animate-spin text-brand-600"
                size={24}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">

                <thead className="bg-slate-50 text-xs text-slate-400">
                  <tr>

                    <th className="px-5 py-3 text-left">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-left">
                      Phone
                    </th>

                    <th className="px-5 py-3 text-left">
                      Credit Limit
                    </th>

                    <th className="px-5 py-3 text-left">
                      Address
                    </th>

                    <th className="px-5 py-3 text-center">
                      Status
                    </th>

                    <th className="px-5 py-3 text-center">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {customers.map(
                    (customer) => (
                      <tr
                        key={customer.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >

                        {/* CUSTOMER */}

                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800">
                            {customer.name}
                          </p>

                          {customer.email && (
                            <p className="mt-1 text-xs text-slate-400">
                              {customer.email}
                            </p>
                          )}
                        </td>

                        {/* PHONE */}

                        <td className="px-5 py-4 text-slate-600">
                          {customer.phone || "-"}
                        </td>

                        {/* CREDIT LIMIT */}

                        <td className="px-5 py-4 font-semibold text-slate-700">
                          ₹
                          {formatAmount(
                            customer.creditLimit
                          )}
                        </td>

                        {/* ADDRESS */}

                        <td className="max-w-[250px] px-5 py-4 text-slate-500">
                          {customer.address || "-"}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4 text-center">
                          <span
                            className={
                              customer.active === false
                                ? "rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600"
                                : "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600"
                            }
                          >
                            {customer.active === false
                              ? "INACTIVE"
                              : "ACTIVE"}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-1">

                            {/* VIEW / ACTION */}

                            <button
                              type="button"
                              onClick={() =>
                                openCustomerActions(
                                  customer
                                )
                              }
                              className="rounded-lg p-2 text-brand-600 transition hover:bg-blue-50"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  customer
                                )
                              }
                              className="rounded-lg p-2 text-brand-600 transition hover:bg-blue-50"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  customer
                                )
                              }
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    )
                  )}

                  {!customers.length && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-10 text-center text-slate-400"
                      >
                        No customers found.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================
          CUSTOMER ACTION MODAL
      =================================================== */}

      {customerAction === "OPTIONS" &&
        selectedCustomer && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                <div>
                  <h2 className="font-bold text-slate-800">
                    {selectedCustomer.name}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Customer Credit Management
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeCustomerAction
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>

              </div>

              {/* CUSTOMER INFO */}

              <div className="grid grid-cols-2 gap-3 p-5">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Phone
                  </p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {selectedCustomer.phone ||
                      "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Credit Limit
                  </p>

                  <p className="mt-1 font-semibold text-slate-700">
                    ₹
                    {formatAmount(
                      selectedCustomer.creditLimit
                    )}
                  </p>
                </div>

              </div>

              {/* OPTIONS */}

              <div className="grid gap-3 px-5 pb-5">

                <button
                  type="button"
                  onClick={openPaymentModal}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:border-brand-500 hover:bg-blue-50"
                >
                  <div>
                    <p className="font-bold text-slate-800">
                      Add Payment
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Record customer payment
                    </p>
                  </div>

                  <Plus
                    size={18}
                    className="text-brand-600"
                  />
                </button>

                <button
                  type="button"
                  onClick={
                    openReceiptModal
                  }
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:border-brand-500 hover:bg-blue-50"
                >
                  <div>
                    <p className="font-bold text-slate-800">
                      View Receipt
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      View payment history
                    </p>
                  </div>

                  <Eye
                    size={18}
                    className="text-brand-600"
                  />
                </button>

              </div>

            </div>
          </div>
        )}

      {/* ===================================================
          ADD PAYMENT MODAL
      =================================================== */}

      {customerAction === "PAYMENT" &&
        selectedCustomer && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4">

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                <div>
                  <h2 className="font-bold text-slate-800">
                    Add Payment
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {selectedCustomer.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeCustomerAction
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>

              </div>

              {/* FORM */}

              <form
                onSubmit={
                  handleAddPayment
                }
                className="space-y-5 p-5"
              >

                {paymentError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {paymentError}
                  </div>
                )}

                {/* CUSTOMER */}

                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Customer
                  </label>

                  <input
                    value={
                      selectedCustomer.name
                    }
                    readOnly
                    className="input mt-2 w-full bg-slate-50"
                  />
                </div>

                {/* OUTSTANDING */}

                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Credit Limit
                  </label>

                  <input
                    value={`₹${formatAmount(
                      selectedCustomer.creditLimit
                    )}`}
                    readOnly
                    className="input mt-2 w-full bg-slate-50"
                  />
                </div>

                {/* PAYMENT AMOUNT */}

                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Received Amount
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      paymentAmount
                    }
                    onChange={(event) =>
                      setPaymentAmount(
                        event.target.value
                      )
                    }
                    placeholder="Enter amount"
                    className="input mt-2 w-full"
                  />
                </div>

                {/* PAYMENT METHOD */}

                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Payment Method
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      paymentMethod
                    }
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target.value
                      )
                    }
                    className="input mt-2 w-full"
                  >
                    <option value="">
                      Select payment method
                    </option>

                    <option value="CASH">
                      Cash
                    </option>

                    <option value="PAYTM">
                      Paytm
                    </option>

                    <option value="CCMS_HP_PAY">
                      CCMS / HP Pay
                    </option>

                    <option value="BANK_TRANSFER">
                      Bank Transfer
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="CARD">
                      Card
                    </option>

                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </div>

                {/* REFERENCE */}

                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Reference Number
                  </label>

                  <input
                    value={
                      referenceNumber
                    }
                    onChange={(event) =>
                      setReferenceNumber(
                        event.target.value
                      )
                    }
                    placeholder="Optional"
                    className="input mt-2 w-full"
                  />
                </div>

                {/* COMMENTS */}

                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Comments
                  </label>

                  <textarea
                    rows={3}
                    value={
                      paymentComments
                    }
                    onChange={(event) =>
                      setPaymentComments(
                        event.target.value
                      )
                    }
                    placeholder="Optional comments"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                {/* FOOTER */}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">

                  <button
                    type="button"
                    onClick={
                      closeCustomerAction
                    }
                    disabled={
                      paymentSaving
                    }
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      paymentSaving
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                  >
                    {paymentSaving && (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    )}

                    Save Payment
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

      {/* ===================================================
          PAYMENT HISTORY / RECEIPT MODAL
      =================================================== */}

      {customerAction === "RECEIPT" &&
        selectedCustomer && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4">

            <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                <div>
                  <h2 className="font-bold text-slate-800">
                    Cash Receipt
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Payment history -{" "}
                    {selectedCustomer.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeCustomerAction
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>

              </div>

              {/* BODY */}

              <div className="max-h-[70vh] overflow-y-auto p-5">

                {paymentHistoryError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {paymentHistoryError}
                  </div>
                )}

                {paymentHistoryLoading ? (
                  <div className="grid min-h-48 place-items-center">
                    <Loader2
                      size={24}
                      className="animate-spin text-brand-600"
                    />
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

                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                            Receipt No.
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                            Customer Name
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                            Created Date
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                            Payment Method
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">
                            Amount Paid
                          </th>

                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">
                            Action
                          </th>

                        </tr>
                      </thead>

                      <tbody>

                        {paymentHistory.map(
                          (payment) => (
                            <tr
                              key={
                                payment.id
                              }
                              className="border-b border-slate-100 hover:bg-slate-50"
                            >

                              <td className="px-4 py-4 font-medium text-brand-600">
                                {payment.receiptNumber ||
                                  payment.id}
                              </td>

                              <td className="px-4 py-4 text-slate-700">
                                {
                                  selectedCustomer.name
                                }
                              </td>

                              <td className="px-4 py-4 text-slate-600">
                                {formatDate(
                                  payment.receivedAt ||
                                    payment.createdAt
                                )}
                              </td>

                              <td className="px-4 py-4 text-slate-600">
                                {payment.paymentMethod ||
                                  "-"}
                              </td>

                              <td className="px-4 py-4 text-right font-bold text-slate-800">
                                ₹
                                {formatAmount(
                                  payment.amount
                                )}
                              </td>

                              <td className="px-4 py-4 text-center">

                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePrintPayment(
                                      payment
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                                >
                                  <Printer
                                    size={14}
                                  />

                                  Print
                                </button>

                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>

              {/* FOOTER */}

              <div className="flex justify-end border-t border-slate-100 px-5 py-4">

                <button
                  type="button"
                  onClick={
                    closeCustomerAction
                  }
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>

              </div>

            </div>
          </div>
        )}

      {/* ===================================================
          ADD / EDIT CUSTOMER MODAL
      =================================================== */}

      {showCustomerModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>
                <h2 className="font-bold text-slate-800">
                  {editingCustomer
                    ? "Edit Customer"
                    : "Add New Customer"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Customer master data used for credit transactions.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCustomerModal
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-5"
            >

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              {/* NAME */}

              <div>
                <label className="text-xs font-bold text-slate-600">
                  Customer Name
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        name: event.target.value,
                      })
                    )
                  }
                  className="input mt-2 w-full"
                  placeholder="Enter customer name"
                />
              </div>

              {/* PHONE + CREDIT */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Phone
                  </label>

                  <input
                    value={form.phone}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          phone: event.target.value,
                        })
                      )
                    }
                    className="input mt-2 w-full"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Credit Limit
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.creditLimit
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          creditLimit:
                            event.target.value,
                        })
                      )
                    }
                    className="input mt-2 w-full"
                    placeholder="0"
                  />
                </div>

              </div>

              {/* EMAIL */}

              <div>
                <label className="text-xs font-bold text-slate-600">
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        email: event.target.value,
                      })
                    )
                  }
                  className="input mt-2 w-full"
                  placeholder="Email address"
                />
              </div>

              {/* ADDRESS */}

              <div>
                <label className="text-xs font-bold text-slate-600">
                  Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        address:
                          event.target.value,
                      })
                    )
                  }
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  placeholder="Customer address"
                />
              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">

                <button
                  type="button"
                  onClick={
                    closeCustomerModal
                  }
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  {editingCustomer
                    ? "Update Customer"
                    : "Add Customer"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </GenericPage>
  );
}