import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  History,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { getOilProducts, type OilProduct } from "../services/oilProductService";
import {
  createOilSale,
  getOilInvoices,
  type OilInvoice,
  type PaymentMethod,
} from "../services/oilSalesService";
import { getActiveDailySales, type DailySalesRecord } from "../services/managerService";
import { downloadOilInvoicePdf } from "../utils/pdf";

interface CartItem {
  product: OilProduct;
  quantity: number;
}

const money = (value: number | string | undefined) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const invoiceNumber = () => {
  const d = new Date();
  return `DST-${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}-${Date.now().toString().slice(-4)}`;
};

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
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-5">
      <div
        className={`max-h-[92vh] w-full overflow-hidden rounded-3xl bg-white shadow-2xl ${
          wide ? "max-w-5xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-76px)] overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function LubricantSales() {
  const [products, setProducts] = useState<OilProduct[]>([]);
  const [invoices, setInvoices] = useState<OilInvoice[]>([]);
  const [dailySales, setDailySales] = useState<DailySalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [processedInvoice, setProcessedInvoice] = useState<OilInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [discount, setDiscount] = useState("0");
  const [downloading, setDownloading] = useState<string | null>(null);

  const activeDay = useMemo(
    () => dailySales.find((x) => x.status === "ACTIVE") ?? null,
    [dailySales]
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((p) =>
        `${p.name} ${p.code ?? ""}`.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.product.currentPrice) * item.quantity, 0),
    [cart]
  );

  const discountValue = Math.max(0, Number(discount || 0));
  const total = Math.max(0, subtotal - discountValue);

  async function load() {
    try {
      setError("");
      const [p, i, d] = await Promise.all([
        getOilProducts(),
        getOilInvoices(),
        getActiveDailySales(),
      ]);
      setProducts(p.filter((x) => x.active));
      setInvoices(i);
      setDailySales(d);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Unable to load lubricant sales.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function addToCart(product: OilProduct) {
    setCart((current) => {
      const found = current.find((x) => x.product.id === product.id);
      if (found) {
        return current.map((x) =>
          x.product.id === product.id ? { ...x, quantity: x.quantity + 1 } : x
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(id: string, delta: number) {
    setCart((current) =>
      current.map((x) =>
        x.product.id === id ? { ...x, quantity: Math.max(1, x.quantity + delta) } : x
      )
    );
  }

  function remove(id: string) {
    setCart((current) => current.filter((x) => x.product.id !== id));
  }

  async function processCheckout() {
    setError("");
    if (!activeDay) return setError("Open a business day before creating an oil invoice.");
    if (!cart.length) return setError("Add at least one oil product to the cart.");
    if (discountValue > subtotal) return setError("Discount cannot be greater than the subtotal.");

    setSaving(true);
    try {
      const invoice = await createOilSale({
        dailySalesId: activeDay.id,
        invoiceNumber: invoiceNumber(),
        customerId: null,
        discount: discountValue,
        paymentMethod,
        lines: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: Number(item.product.currentPrice),
          discount: 0,
        })),
      });
      setCart([]);
      setDiscount("0");
      setShowCheckout(false);
      setShowCart(false);
      setProcessedInvoice(invoice);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Unable to process oil invoice.");
    } finally {
      setSaving(false);
    }
  }

  function downloadInvoice(invoice: OilInvoice) {
    setDownloading(invoice.id);
    setError("");
    try {
      downloadOilInvoicePdf({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        paymentMethod: invoice.paymentMethod,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        totalAmount: invoice.totalAmount,
        businessUnit: "RAJ AGENCIES, HPCL DEALER",
        lines: invoice.lines.map((line) => ({
          productName: line.product?.name || line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          totalAmount: line.totalAmount,
        })),
      });
    } catch (e: any) {
      setError(e?.message || "Unable to generate invoice PDF.");
    } finally {
      setDownloading(null);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-72 place-items-center">
        <Loader2 className="animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="relative space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <span className="badge bg-emerald-50 text-emerald-600">MANAGER · OIL SALES</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Track Lubricant Oil Sales
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Select oil products, add to cart, and process checkout to generate the customer invoice.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button className="btn-secondary w-full sm:w-auto" onClick={() => setShowHistory(true)}>
            <History size={15} /> History
          </button>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm">
            <span className="text-slate-400">Business Day</span>
            <b className="ml-2 text-slate-800">
              {activeDay?.businessDate
                ? new Date(activeDay.businessDate).toLocaleDateString("en-IN")
                : "Not open"}
            </b>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <Search size={18} className="shrink-0 text-brand-600" />
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search oil product by name or code..."
          />
        </div>
      </div>

      {/* Product Grid - full width now */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => {
          const inCart = cart.find((x) => x.product.id === product.id);
          return (
            <article
              key={product.id}
              className="card flex min-w-0 flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-28 items-center justify-center rounded-2xl bg-slate-50 sm:h-32">
                <ShoppingCart size={30} className="text-brand-600" />
              </div>
              <span className="badge mt-4 w-fit bg-violet-50 text-violet-600">
                {product.unit}
              </span>
              <h3 className="mt-2 truncate font-bold text-slate-900" title={product.name}>
                {product.name}
              </h3>
              <p className="mt-1 truncate text-xs text-slate-400">
                {product.code || "Oil product"}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <b className="text-base sm:text-lg">{money(product.currentPrice)}</b>
                <button
                  className={`btn-primary px-3 py-2 text-xs ${
                    inCart ? "bg-emerald-600 hover:bg-emerald-700" : ""
                  }`}
                  onClick={() => addToCart(product)}
                >
                  <Plus size={14} />
                  {inCart ? `Add (${inCart.quantity})` : "Add"}
                </button>
              </div>
            </article>
          );
        })}
        {!filteredProducts.length && (
          <div className="card col-span-full p-10 text-center text-sm text-slate-400">
            No active oil products found.
          </div>
        )}
      </div>

      {/* ========== FLOATING CART BUTTON ========== */}
      <button
        type="button"
        onClick={() => setShowCart(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:scale-105 hover:bg-brand-700 active:scale-95"
        aria-label="Open cart"
      >
        <ShoppingCart size={22} />
        {cartCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white shadow">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </button>

      {/* ========== CART MODAL ========== */}
      {showCart && (
        <Modal
          title="Your Cart"
          subtitle={`${cartCount} item${cartCount === 1 ? "" : "s"} · ${money(subtotal)}`}
          onClose={() => setShowCart(false)}
        >
          {cart.length ? (
            <div className="space-y-4">
              <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="rounded-xl border border-slate-100 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{item.product.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {money(item.product.currentPrice)} / {item.product.unit}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.product.id)}
                        className="shrink-0 text-slate-300 hover:text-red-500"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.product.id, -1)}
                          className="p-2 text-slate-500 hover:bg-slate-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.product.id, 1)}
                          className="p-2 text-slate-500 hover:bg-slate-50"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <b>{money(Number(item.product.currentPrice) * item.quantity)}</b>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <b>{money(subtotal)}</b>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="font-bold">Total</span>
                  <b className="text-xl">{money(subtotal)}</b>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <button className="btn-secondary" onClick={() => setShowCart(false)}>
                  Continue Shopping
                </button>
                <button
                  className="btn-primary"
                  disabled={!activeDay}
                  onClick={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                >
                  <CheckCircle2 size={15} /> Proceed to Checkout
                </button>
              </div>
              {!activeDay && (
                <p className="text-center text-[11px] text-amber-600">
                  Open a Daily Sales business day first.
                </p>
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <ShoppingCart size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">Your cart is empty</p>
              <p className="mt-1 text-xs text-slate-400">Add an oil product to continue.</p>
              <button className="btn-primary mt-6" onClick={() => setShowCart(false)}>
                Browse Products
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* ========== CHECKOUT MODAL ========== */}
      {showCheckout && (
        <Modal
          title="Process Checkout"
          subtitle="Review the cart and payment method before creating the invoice."
          onClose={() => !saving && setShowCheckout(false)}
        >
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-start justify-between gap-4 py-1.5 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {item.product.name} × {item.quantity}
                  </span>
                  <b className="shrink-0">
                    {money(Number(item.product.currentPrice) * item.quantity)}
                  </b>
                </div>
              ))}
              <div className="mt-3 flex justify-between border-t pt-3">
                <span className="font-bold">Total</span>
                <b className="text-lg">{money(total)}</b>
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">Discount (₹)</span>
              <input
                className="input"
                type="number"
                min="0"
                max={subtotal}
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">Payment Method</span>
              <select
                className="input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="PAYTM">Paytm</option>
                <option value="CCMS_HP_PAY">CCMS / HP Pay</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="btn-secondary"
                disabled={saving}
                onClick={() => setShowCheckout(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" disabled={saving} onClick={processCheckout}>
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {saving ? "Processing..." : "Process Checkout"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========== SUCCESS MODAL ========== */}
      {processedInvoice && (
        <Modal
          title="Invoice Processed"
          subtitle={processedInvoice.invoiceNumber}
          onClose={() => setProcessedInvoice(null)}
        >
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={34} />
            </div>
            <span className="badge mt-4 bg-emerald-50 text-emerald-600">PROCESSED</span>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {money(processedInvoice.totalAmount)}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {new Date(processedInvoice.invoiceDate).toLocaleString("en-IN")} ·{" "}
              {processedInvoice.paymentMethod}
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                className="btn-secondary w-full"
                onClick={() => downloadInvoice(processedInvoice)}
              >
                <Download size={15} /> Download PDF
              </button>
              <button className="btn-primary w-full" onClick={() => setProcessedInvoice(null)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========== HISTORY MODAL ========== */}
      {showHistory && (
        <Modal
          title="Invoice History"
          subtitle="Completed lubricant invoices and PDF downloads."
          onClose={() => setShowHistory(false)}
          wide
        >
          {invoices.length ? (
            <div className="space-y-3">
              {invoices.slice(0, 25).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="shrink-0 text-brand-600" />
                      <b className="truncate">{invoice.invoiceNumber}</b>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")} ·{" "}
                      {invoice.paymentMethod}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <b>{money(invoice.totalAmount)}</b>
                    <button
                      className="btn-secondary px-3 py-2 text-xs"
                      disabled={downloading === invoice.id}
                      onClick={() => downloadInvoice(invoice)}
                    >
                      {downloading === invoice.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}{" "}
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-400">No invoices yet.</div>
          )}
        </Modal>
      )}
    </div>
  );
}