import { useEffect, useMemo, useState } from "react";
import GenericPage from "./GenericPage";
import {
  getResource,
  createResource,
} from "../services/resourceService";
import {
  Eye,
  Loader2,
  Plus,
  X,
  Clock3,
  PackagePlus,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

interface Props {
  title: string;
  endpoint: string;
}

interface ProductRow {
  id?: string;
  accountId?: string;
  name?: string;
  code?: string;
  productType?: string;
  unit?: string;
  currentPrice?: string | number;
  minStock?: string | number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Frontend calculated stock
  currentStock?: number;
}

interface InventoryTransaction {
  id?: string;
  accountId?: string;
  productId?: string;
  tankId?: string | null;
  vehicleId?: string | null;
  transactionType?: string;
  quantity?: string | number;
  beforeStock?: string | number;
  afterStock?: string | number;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  createdAt?: string;

  product?: {
    id?: string;
    name?: string;
    code?: string;
    productType?: string;
  };
}

const text = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "object") {
    const item = value as Record<string, unknown>;

    return String(
      item.name ??
        item.code ??
        item.id ??
        "-"
    );
  }

  return String(value);
};

const numberValue = (value: unknown): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SimpleTable({
  title,
  endpoint,
}: Props) {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [inventory, setInventory] = useState<
    InventoryTransaction[]
  >([]);

  const [inventoryLoading, setInventoryLoading] =
    useState(false);

  const [inventoryError, setInventoryError] =
    useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<ProductRow | null>(null);

  const [showProductModal, setShowProductModal] =
    useState(false);

  const [showStockModal, setShowStockModal] =
    useState(false);

  const [showTimelineModal, setShowTimelineModal] =
    useState(false);

  const [stockQuantity, setStockQuantity] =
    useState("");

  const [stockNotes, setStockNotes] =
    useState("");

  const [stockSaving, setStockSaving] =
    useState(false);

  const [stockError, setStockError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [page, setPage] = useState(1);

  const pageSize = 5;

  // --------------------------------------------------
  // Load Oil Products
  // --------------------------------------------------

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getResource<unknown[]>(
        endpoint
      );

      const validRows: ProductRow[] =
        Array.isArray(data)
          ? data.filter(
              (
                item
              ): item is ProductRow =>
                Boolean(
                  item &&
                    typeof item === "object"
                )
            )
          : [];

      setRows(validRows);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          `Unable to load ${title.toLowerCase()}.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [endpoint]);

  // --------------------------------------------------
  // Load Inventory Transactions
  // --------------------------------------------------

  const loadInventory = async () => {
    try {
      setInventoryLoading(true);
      setInventoryError("");

      const data =
        await getResource<unknown[]>(
          "/inventory"
        );

      const validRows: InventoryTransaction[] =
        Array.isArray(data)
          ? data.filter(
              (
                item
              ): item is InventoryTransaction =>
                Boolean(
                  item &&
                    typeof item ===
                      "object"
                )
            )
          : [];

      setInventory(validRows);
    } catch (err: any) {
      setInventoryError(
        err?.response?.data?.message ||
          "Unable to load stock history."
      );
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // --------------------------------------------------
  // Only Oil Products
  // --------------------------------------------------

  const oilProducts = useMemo(() => {
    return rows
      .filter(
        (row) =>
          String(
            row.productType ?? ""
          ).toUpperCase() === "OIL"
      )
      .map((product) => {
        const transactions =
          inventory
            .filter(
              (item) =>
                item.productId ===
                  product.id &&
                !item.tankId
            )
            .sort(
              (a, b) =>
                new Date(
                  b.createdAt ?? 0
                ).getTime() -
                new Date(
                  a.createdAt ?? 0
                ).getTime()
            );

        const latest =
          transactions[0];

        return {
          ...product,
          currentStock: numberValue(
            latest?.afterStock
          ),
        };
      });
  }, [rows, inventory]);

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  const filteredProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return oilProducts;
    }

    return oilProducts.filter(
      (product) =>
        String(
          product.name ?? ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          product.code ?? ""
        )
          .toLowerCase()
          .includes(query)
    );
  }, [oilProducts, search]);

  // --------------------------------------------------
  // Pagination
  // --------------------------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredProducts.length /
        pageSize
    )
  );

  const paginatedProducts =
    useMemo(() => {
      const start =
        (page - 1) * pageSize;

      return filteredProducts.slice(
        start,
        start + pageSize
      );
    }, [
      filteredProducts,
      page,
    ]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // --------------------------------------------------
  // Selected Product Timeline
  // --------------------------------------------------

  const selectedTransactions =
    useMemo(() => {
      if (!selectedProduct?.id) {
        return [];
      }

      return inventory
        .filter(
          (item) =>
            item.productId ===
              selectedProduct.id &&
            !item.tankId
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt ?? 0
            ).getTime() -
            new Date(
              a.createdAt ?? 0
            ).getTime()
        );
    }, [
      inventory,
      selectedProduct,
    ]);

  // --------------------------------------------------
  // Open Product
  // --------------------------------------------------

  const openProduct = (
    product: ProductRow
  ) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // --------------------------------------------------
  // Open Add Stock
  // --------------------------------------------------

  const openStockModal = (
    product?: ProductRow
  ) => {
    if (product) {
      setSelectedProduct(product);
    }

    setStockQuantity("");
    setStockNotes("");
    setStockError("");

    setShowProductModal(false);
    setShowTimelineModal(false);
    setShowStockModal(true);
  };

  // --------------------------------------------------
  // Add Stock
  // --------------------------------------------------

  const handleAddStock = async () => {
    if (!selectedProduct?.id) {
      setStockError(
        "Please select an oil product."
      );
      return;
    }

    const quantity =
      Number(stockQuantity);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setStockError(
        "Enter a valid stock quantity."
      );
      return;
    }

    try {
      setStockSaving(true);
      setStockError("");

      await createResource(
  "/inventory",
  {
    productId: selectedProduct.id,
    transactionType: "STOCK_IN",
    quantity,
    notes:
      stockNotes.trim() ||
      "Oil stock added",
  }

      );

      await loadInventory();

      setShowStockModal(false);
      setStockQuantity("");
      setStockNotes("");
    } catch (err: any) {
      setStockError(
        err?.response?.data?.message ||
          "Unable to add stock."
      );
    } finally {
      setStockSaving(false);
    }
  };

  // --------------------------------------------------
  // Timeline
  // --------------------------------------------------

  const openTimeline = (
    product: ProductRow
  ) => {
    setSelectedProduct(product);
    setShowProductModal(false);
    setShowTimelineModal(true);
  };

  // --------------------------------------------------
  // Table Columns
  // --------------------------------------------------

  const columns = [
    "name",
    "code",
    "currentPrice",
    "unit",
    "currentStock",
  ];

  return (
    <GenericPage
      title={title}
      action="Add Stock"
      onAction={() =>
        openStockModal()
      }
    >
      <div className="space-y-4">


        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="grid min-h-40 place-items-center text-sm text-slate-500">
              <Loader2
                className="animate-spin"
                size={18}
              />
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">
              {error}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-400">
                    <tr>
                      {columns.map(
                        (column) => (
                          <th
                            key={column}
                            className="px-5 py-3 text-left"
                          >
                            {column ===
                            "currentPrice"
                              ? "PRICE"
                              : column ===
                                "currentStock"
                              ? "CURRENT STOCK"
                              : column
                                  .replace(
                                    /[A-Z]/g,
                                    (m) =>
                                      ` ${m}`
                                  )
                                  .toUpperCase()}
                          </th>
                        )
                      )}

                      <th className="px-5 py-3 text-center">
                        ACTION
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedProducts.length ? (
                      paginatedProducts.map(
                        (
                          row,
                          index
                        ) => {
                          const stock =
                            numberValue(
                              row.currentStock
                            );

                          const minStock =
                            numberValue(
                              row.minStock
                            );

                          const lowStock =
                            stock <=
                              minStock &&
                            minStock > 0;

                          return (
                            <tr
                              key={String(
                                row.id ??
                                  index
                              )}
                              className="border-t border-slate-100"
                            >
                              <td className="px-5 py-4 font-semibold text-slate-800">
                                {text(
                                  row.name
                                )}
                              </td>

                              <td className="px-5 py-4 text-slate-500">
                                {text(
                                  row.code
                                )}
                              </td>

                              <td className="px-5 py-4 font-medium">
                                ₹
                                {text(
                                  row.currentPrice
                                )}
                              </td>

                              <td className="px-5 py-4 text-slate-500">
                                {text(
                                  row.unit
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`font-bold ${
                                    lowStock
                                      ? "text-red-600"
                                      : "text-emerald-600"
                                  }`}
                                >
                                  {stock}
                                </span>

                                <span className="ml-1 text-xs text-slate-400">
                                  / Min{" "}
                                  {minStock}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center justify-center gap-2">

                                  {/* Eye */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openProduct(
                                        row
                                      )
                                    }
                                    title="View"
                                    className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                                  >
                                    <Eye
                                      size={
                                        16
                                      }
                                    />
                                  </button>

                                  {/* Add Stock */}
                                  {/* <button
                                    type="button"
                                    onClick={() =>
                                      openStockModal(
                                        row
                                      )
                                    }
                                    title="Add Stock"
                                    className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 transition hover:bg-brand-100"
                                  >
                                    <Plus
                                      size={
                                        16
                                      }
                                    />
                                  </button> */}

                                  {/* Timeline */}
                                  {/* <button
                                    type="button"
                                    onClick={() =>
                                      openTimeline(
                                        row
                                      )
                                    }
                                    title="Stock Timeline"
                                    className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                  >
                                    <Clock3
                                      size={
                                        16
                                      }
                                    />
                                  </button> */}
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={
                            columns.length +
                            1
                          }
                          className="px-5 py-10 text-center text-sm text-slate-400"
                        >
                          No oil products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredProducts.length >
                0 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                  <p className="text-xs text-slate-400">
                    Showing{" "}
                    {Math.min(
                      (page - 1) *
                        pageSize +
                        1,
                      filteredProducts.length
                    )}{" "}
                    -{" "}
                    {Math.min(
                      page *
                        pageSize,
                      filteredProducts.length
                    )}{" "}
                    of{" "}
                    {
                      filteredProducts.length
                    }
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={
                        page === 1
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            Math.max(
                              1,
                              current -
                                1
                            )
                        )
                      }
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft
                        size={16}
                      />
                    </button>

                    <span className="text-xs font-semibold text-slate-600">
                      {page} /{" "}
                      {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={
                        page ===
                        totalPages
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            Math.min(
                              totalPages,
                              current +
                                1
                            )
                        )
                      }
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight
                        size={16}
                      />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------ */}
      {/* Product View Modal */}
      {/* ------------------------------------------------ */}

      {showProductModal &&
        selectedProduct && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedProduct.name}
                  </h2>

                  <p className="text-xs text-slate-400">
                    Oil Product Details
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowProductModal(
                      false
                    )
                  }
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 p-6">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Product Code
                  </p>

                  <p className="mt-1 font-semibold">
                    {text(
                      selectedProduct.code
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Unit
                  </p>

                  <p className="mt-1 font-semibold">
                    {text(
                      selectedProduct.unit
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Selling Price
                  </p>

                  <p className="mt-1 font-semibold">
                    ₹
                    {text(
                      selectedProduct.currentPrice
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Current Stock
                  </p>

                  <p className="mt-1 font-semibold text-emerald-600">
                    {numberValue(
                      selectedProduct.currentStock
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Minimum Stock
                  </p>

                  <p className="mt-1 font-semibold">
                    {numberValue(
                      selectedProduct.minStock
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Status
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedProduct.active
                      ? "Active"
                      : "Inactive"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() =>
                    openTimeline(
                      selectedProduct
                    )
                  }
                  className="btn-secondary"
                >
                  <Clock3 size={15} />
                  Stock Timeline
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openStockModal(
                      selectedProduct
                    )
                  }
                  className="btn-primary"
                >
                  <PackagePlus
                    size={15}
                  />
                  Add Stock
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ------------------------------------------------ */}
      {/* Add Stock Modal */}
      {/* ------------------------------------------------ */}

      {showStockModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add Oil Stock
                </h2>

                <p className="text-xs text-slate-400">
                  Add stock without Tank / Nozzle
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowStockModal(
                    false
                  )
                }
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Product */}
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Oil Product
                </label>

                <select
                  value={
                    selectedProduct?.id ??
                    ""
                  }
                  onChange={(e) => {
                    const product =
                      oilProducts.find(
                        (item) =>
                          item.id ===
                          e.target.value
                      );

                    setSelectedProduct(
                      product ??
                        null
                    );
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                >
                  <option value="">
                    Select oil product
                  </option>

                  {oilProducts.map(
                    (product) => (
                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }
                      >
                        {product.name} (
                        {product.code})
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Current Stock */}
              {selectedProduct && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Current Stock
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-800">
                    {numberValue(
                      selectedProduct.currentStock
                    )}
                  </p>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={
                    stockQuantity
                  }
                  onChange={(e) =>
                    setStockQuantity(
                      e.target.value
                    )
                  }
                  placeholder="Enter quantity"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Notes
                </label>

                <textarea
                  value={stockNotes}
                  onChange={(e) =>
                    setStockNotes(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Supplier stock"
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
                />
              </div>

              {stockError && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {stockError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setShowStockModal(
                    false
                  )
                }
                className="btn-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  stockSaving ||
                  !selectedProduct
                }
                onClick={
                  handleAddStock
                }
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {stockSaving ? (
                  <>
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <PackagePlus
                      size={15}
                    />
                    Add Stock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* Stock Timeline Modal */}
      {/* ------------------------------------------------ */}

      {showTimelineModal &&
        selectedProduct && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
            <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Stock Timeline
                  </h2>

                  <p className="text-xs text-slate-400">
                    {selectedProduct.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowTimelineModal(
                      false
                    )
                  }
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              {inventoryLoading ? (
                <div className="grid min-h-48 place-items-center">
                  <Loader2
                    size={20}
                    className="animate-spin text-slate-400"
                  />
                </div>
              ) : inventoryError ? (
                <div className="p-6 text-sm text-red-600">
                  {inventoryError}
                </div>
              ) : selectedTransactions.length ===
                0 ? (
                <div className="p-10 text-center text-sm text-slate-400">
                  No stock transactions found.
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-auto">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-xs text-slate-400">
                      <tr>
                        <th className="px-5 py-3 text-left">
                          DATE
                        </th>

                        <th className="px-5 py-3 text-left">
                          TRANSACTION
                        </th>

                        <th className="px-5 py-3 text-right">
                          BEFORE STOCK
                        </th>

                        <th className="px-5 py-3 text-right">
                          ADDED
                        </th>

                        <th className="px-5 py-3 text-right">
                          TOTAL STOCK
                        </th>

                        <th className="px-5 py-3 text-left">
                          NOTES
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedTransactions.map(
                        (
                          transaction,
                          index
                        ) => {
                          const quantity =
                            numberValue(
                              transaction.quantity
                            );

                          const before =
                            numberValue(
                              transaction.beforeStock
                            );

                          const after =
                            numberValue(
                              transaction.afterStock
                            );

                          return (
                            <tr
                              key={
                                String(
                                  transaction.id ??
                                    index
                                )
                              }
                              className="border-t border-slate-100"
                            >
                              <td className="px-5 py-4">
                                <div className="font-medium">
                                  {formatDate(
                                    transaction.createdAt
                                  )}
                                </div>

                                <div className="text-xs text-slate-400">
                                  {formatDateTime(
                                    transaction.createdAt
                                  )}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                  {
                                    transaction.transactionType
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-4 text-right font-medium">
                                {before}
                              </td>

                              <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                                +
                                {quantity}
                              </td>

                              <td className="px-5 py-4 text-right font-bold text-slate-800">
                                {after}
                              </td>

                              <td className="px-5 py-4 text-slate-500">
                                {text(
                                  transaction.notes
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() =>
                    openStockModal(
                      selectedProduct
                    )
                  }
                  className="btn-primary"
                >
                  <Plus size={15} />
                  Add Stock
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowTimelineModal(
                      false
                    )
                  }
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </GenericPage>
  );
}