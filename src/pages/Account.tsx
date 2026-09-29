import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  Search,
  X,
  Trash2,
} from "lucide-react";

import GenericPage from "./GenericPage";
import {
  getAccount,
  updateAccount,
  type Account,
} from "../services/accountService";

type MainTab = "account" | "petrol" | "oil";
type PetrolSection = "products" | "tanks" | "nozzle";

interface PetrolProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
}

interface Tank {
  id: number;
  name: string;
  capacity: number;
  minimum: number;
  available: number;
  product: string;
}

interface Nozzle {
  id: number;
  name: string;
  tank: string;
  product: string;
  openingMeter: number;
}

interface OilProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  gst: number;
}

const initialAccount: Account = {
  accountName: "",
  phone: "",
  billingStreet: "",
  billingCity: "",
  postalCode: "",
  state: "",
  country: "",
  logoUrl: "",
  settings: {
    enableCustomerEmailForCreditPayment: false,
    enableWeeklyCreditReport: false,
    enableCustomer: false,
    onlyAdmin: false,
    configureEmail: false,
    enableMonthlyCreditReport: false,
  },
};

const initialPetrolProducts: PetrolProduct[] = [
  {
    id: 1,
    name: "HSD - Diesel",
    sku: "HSD",
    price: 93.53,
  },
  {
    id: 2,
    name: "MS - Petrol",
    sku: "MS",
    price: 103.26,
  },
  {
    id: 3,
    name: "Power - Petrol",
    sku: "Power",
    price: 112.87,
  },
];

const initialTanks: Tank[] = [
  {
    id: 1,
    name: "HSD Tank 1",
    capacity: 22000,
    minimum: 500,
    available: 6322.83,
    product: "HSD - Diesel",
  },
  {
    id: 2,
    name: "MS Tank 1",
    capacity: 15000,
    minimum: 500,
    available: 4200,
    product: "MS - Petrol",
  },
  {
    id: 3,
    name: "Power Tank 1",
    capacity: 10000,
    minimum: 300,
    available: 1800,
    product: "Power - Petrol",
  },
];

const initialNozzles: Nozzle[] = [
  {
    id: 1,
    name: "Nozzle 1",
    tank: "HSD Tank 1",
    product: "HSD - Diesel",
    openingMeter: 0,
  },
  {
    id: 2,
    name: "Nozzle 2",
    tank: "HSD Tank 1",
    product: "HSD - Diesel",
    openingMeter: 0,
  },
  {
    id: 3,
    name: "Nozzle 3",
    tank: "MS Tank 1",
    product: "MS - Petrol",
    openingMeter: 0,
  },
  {
    id: 4,
    name: "Nozzle 4",
    tank: "Power Tank 1",
    product: "Power - Petrol",
    openingMeter: 0,
  },
];

const initialOilProducts: OilProduct[] = [
  {
    id: 1,
    name: "20 / 40 - 1 Lit",
    sku: "OIL",
    price: 250,
    stock: 1,
    gst: 0,
  },
  {
    id: 2,
    name: "20 / 40 - 1/2 Lit",
    sku: "OIL",
    price: 150,
    stock: 35,
    gst: 0,
  },
  {
    id: 3,
    name: "20 / 40 - 5 Lit",
    sku: "OIL",
    price: 1250,
    stock: 4,
    gst: 0,
  },
  {
    id: 4,
    name: "2T Oil",
    sku: "OIL",
    price: 300,
    stock: 47,
    gst: 0,
  },
  {
    id: 5,
    name: "Acid",
    sku: "OIL",
    price: 60,
    stock: 62,
    gst: 0,
  },
  {
    id: 6,
    name: "AD Blue - 20 Lit (HP)",
    sku: "OIL",
    price: 1300,
    stock: 0,
    gst: 0,
  },
  {
    id: 7,
    name: "AD Blue - 20 Lit (TATA)",
    sku: "OIL",
    price: 1850,
    stock: 3,
    gst: 0,
  },
  {
    id: 8,
    name: "AD Blue - 5 Lit",
    sku: "OIL",
    price: 325,
    stock: 0,
    gst: 0,
  },
  {
    id: 9,
    name: "ATF - 5 Lit",
    sku: "OIL",
    price: 1500,
    stock: 1,
    gst: 0,
  },
];

export default function Account() {
  const [account, setAccount] =
    useState<Account>(initialAccount);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] =
    useState<MainTab>("account");

  const loadAccount = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAccount();

      console.log("ACCOUNT GET RESPONSE:", response);

      setAccount(response);
    } catch (err) {
      console.error("Account GET error:", err);
      setError("Unable to load account details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  if (loading) {
    return (
      <GenericPage
        title="Account Setup"
        subtitle="Manage business unit details and station settings."
      >
        <div className="card p-8 text-center text-sm text-slate-500">
          Loading account details...
        </div>
      </GenericPage>
    );
  }

  return (
    <GenericPage
      title="Account Setup"
      subtitle="Manage business unit details and station settings."
    >
      {/* SITE NAME */}
      <div className="mb-8 flex items-center gap-2">
        <span className="text-sm text-slate-600">
          Site Name :
        </span>

        {account.logoUrl ? (
          <img
            src={account.logoUrl}
            alt="Site Logo"
            className="h-7 w-7 rounded-full object-contain"
          />
        ) : (
          <div className="grid h-7 w-7 place-items-center rounded-full border border-red-300 bg-white text-xs font-bold text-red-600">
            HP
          </div>
        )}

        <span className="text-lg font-bold text-slate-900">
          {account.accountName ||
            "RAJ AGENCIES, HPCL DEALER"}
        </span>
      </div>

      {/* MAIN TABS */}
      <div className="flex border-b border-slate-200">
        <MainTabButton
          label="Account Details"
          active={activeTab === "account"}
          onClick={() => setActiveTab("account")}
        />

        <MainTabButton
          label="Petrol"
          active={activeTab === "petrol"}
          onClick={() => setActiveTab("petrol")}
        />

        <MainTabButton
          label="Oil"
          active={activeTab === "oil"}
          onClick={() => setActiveTab("oil")}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {activeTab === "account" && (
        <AccountDetails
          account={account}
          onAccountUpdated={setAccount}
        />
      )}

      {activeTab === "petrol" && <PetrolTab />}

      {activeTab === "oil" && <OilTab />}
    </GenericPage>
  );
}

/* =========================================================
   MAIN TAB BUTTON
========================================================= */

function MainTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-3 text-sm font-medium transition ${
        active
          ? "border-b-2 border-brand-600 text-brand-600"
          : "text-slate-600 hover:text-brand-600"
      }`}
    >
      {label}
    </button>
  );
}

/* =========================================================
   ACCOUNT DETAILS
========================================================= */

function AccountDetails({
  account,
  onAccountUpdated,
}: {
  account: Account;
  onAccountUpdated: (account: Account) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="mt-3 border border-slate-200 bg-white">
        <div className="grid lg:grid-cols-2">

          {/* LEFT */}
          <div className="border-r border-slate-200 p-5">

            <div className="mb-8 flex justify-center">
              {account.logoUrl ? (
                <img
                  src={account.logoUrl}
                  alt="Account Logo"
                  className="h-28 w-28 rounded-full object-contain"
                />
              ) : (
                <div className="grid h-28 w-28 place-items-center rounded-full border-2 border-red-600 bg-white text-4xl font-black text-red-600">
                  HP
                </div>
              )}
            </div>

            <InfoRow
              label="Account Name"
              value={account.accountName}
              required
            />

            <InfoRow
              label="Phone"
              value={account.phone}
            />

            <InfoRow
              label="Logo"
              value={account.logoUrl}
            />

            <div className="mb-3 mt-6 text-sm font-bold text-slate-700">
              Billing Address
            </div>

            <InfoRow
              label="Billing Street"
              value={account.billingStreet}
              textarea
            />

            <InfoRow
              label="Billing City"
              value={account.billingCity}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                label="Billing Zip/Postal Code"
                value={account.postalCode}
              />

              <InfoRow
                label="Billing State/Province"
                value={account.state}
              />
            </div>

            <InfoRow
              label="Billing Country"
              value={account.country}
            />
          </div>

          {/* RIGHT */}
          <div className="p-5">

            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Settings
              </h3>

              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-brand-600 hover:bg-slate-50"
              >
                <Pencil size={14} />
                Edit
              </button>
            </div>

            <Setting
              label="Enable Customer Email for Credit Payment"
              checked={
                account.settings
                  .enableCustomerEmailForCreditPayment
              }
            />

            <Setting
              label="Enable Weekly Credit Report"
              checked={
                account.settings
                  .enableWeeklyCreditReport
              }
            />

            <div className="ml-6 space-y-3">
              <Setting
                label="Enable Customer"
                checked={
                  account.settings.enableCustomer
                }
              />

              <Setting
                label="Only Admin"
                checked={
                  account.settings.onlyAdmin
                }
              />

              <Setting
                label="Configure Email"
                checked={
                  account.settings.configureEmail
                }
              />
            </div>

            <div className="mt-7">
              <Setting
                label="Enable Monthly Credit Report"
                checked={
                  account.settings
                    .enableMonthlyCreditReport
                }
              />

              <div className="ml-6 mt-3 space-y-3">
                <Setting
                  label="Enable Customer"
                  checked={
                    account.settings.enableCustomer
                  }
                />

                <Setting
                  label="Only Admin"
                  checked={
                    account.settings.onlyAdmin
                  }
                />

                <Setting
                  label="Configure Email"
                  checked={
                    account.settings.configureEmail
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <SettingsEditModal
          account={account}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            onAccountUpdated(updated);
            setEditOpen(false);
          }}
        />
      )}
    </>
  );
}

/* =========================================================
   SETTINGS EDIT MODAL
========================================================= */

function SettingsEditModal({
  account,
  onClose,
  onSaved,
}: {
  account: Account;
  onClose: () => void;
  onSaved: (account: Account) => void;
}) {
  const [form, setForm] = useState<Account["settings"]>(
    account.settings
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (
    key: keyof Account["settings"]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");

      const updatedAccount: Account = {
        ...account,
        settings: form,
      };

      const response =
        await updateAccount(updatedAccount);

      onSaved(response);
    } catch (err) {
      console.error("Settings update error:", err);
      setError("Unable to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Edit Settings"
      onClose={onClose}
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Setting
          label="Enable Customer Email for Credit Payment"
          checked={
            form.enableCustomerEmailForCreditPayment
          }
          editable
          onChange={() =>
            toggle(
              "enableCustomerEmailForCreditPayment"
            )
          }
        />

        <Setting
          label="Enable Weekly Credit Report"
          checked={
            form.enableWeeklyCreditReport
          }
          editable
          onChange={() =>
            toggle("enableWeeklyCreditReport")
          }
        />

        <div className="ml-6 space-y-3">
          <Setting
            label="Enable Customer"
            checked={form.enableCustomer}
            editable
            onChange={() =>
              toggle("enableCustomer")
            }
          />

          <Setting
            label="Only Admin"
            checked={form.onlyAdmin}
            editable
            onChange={() =>
              toggle("onlyAdmin")
            }
          />

          <Setting
            label="Configure Email"
            checked={form.configureEmail}
            editable
            onChange={() =>
              toggle("configureEmail")
            }
          />
        </div>

        <div className="pt-3">
          <Setting
            label="Enable Monthly Credit Report"
            checked={
              form.enableMonthlyCreditReport
            }
            editable
            onChange={() =>
              toggle(
                "enableMonthlyCreditReport"
              )
            }
          />
        </div>
      </div>

      <ModalFooter
        saving={saving}
        onCancel={onClose}
        onSave={save}
      />
    </Modal>
  );
}

/* =========================================================
   PETROL
========================================================= */

function PetrolTab() {
  const [section, setSection] =
    useState<PetrolSection>("products");

  const [products, setProducts] =
    useState<PetrolProduct[]>(
      initialPetrolProducts
    );

  const [tanks, setTanks] =
    useState<Tank[]>(initialTanks);

  const [nozzles, setNozzles] =
    useState<Nozzle[]>(initialNozzles);

  const [search, setSearch] = useState("");

  const [productModal, setProductModal] =
    useState(false);

  const [tankModal, setTankModal] =
    useState(false);

  const [nozzleModal, setNozzleModal] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<PetrolProduct | null>(null);

  const [editingTank, setEditingTank] =
    useState<Tank | null>(null);

  const [editingNozzle, setEditingNozzle] =
    useState<Nozzle | null>(null);

  const filteredProducts = useMemo(() => {
    const value = search.toLowerCase();

    return products.filter(
      (item) =>
        item.name.toLowerCase().includes(value) ||
        item.sku.toLowerCase().includes(value)
    );
  }, [products, search]);

  const filteredTanks = useMemo(() => {
    const value = search.toLowerCase();

    return tanks.filter(
      (item) =>
        item.name.toLowerCase().includes(value) ||
        item.product.toLowerCase().includes(value)
    );
  }, [tanks, search]);

  const filteredNozzles = useMemo(() => {
    const value = search.toLowerCase();

    return nozzles.filter(
      (item) =>
        item.name.toLowerCase().includes(value) ||
        item.tank.toLowerCase().includes(value) ||
        item.product.toLowerCase().includes(value)
    );
  }, [nozzles, search]);

  return (
    <div className="mt-3 grid grid-cols-[220px_1fr] border border-slate-200 bg-white">

      {/* SIDE */}
      <div className="border-r border-slate-200 p-6">
        <h3 className="mb-6 text-base font-bold text-slate-900">
          Data Setup
        </h3>

        <div className="space-y-1">
          <SideItem
            label="Products"
            active={section === "products"}
            onClick={() => {
              setSection("products");
              setSearch("");
            }}
          />

          <SideItem
            label="Tanks"
            active={section === "tanks"}
            onClick={() => {
              setSection("tanks");
              setSearch("");
            }}
          />

          <SideItem
            label="Nozzle"
            active={section === "nozzle"}
            onClick={() => {
              setSection("nozzle");
              setSearch("");
            }}
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="min-w-0 p-5">

        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={`Search ${
                section === "products"
                  ? "products"
                  : section === "tanks"
                    ? "tanks"
                    : "nozzles"
              }...`}
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (section === "products") {
                setEditingProduct(null);
                setProductModal(true);
              }

              if (section === "tanks") {
                setEditingTank(null);
                setTankModal(true);
              }

              if (section === "nozzle") {
                setEditingNozzle(null);
                setNozzleModal(true);
              }
            }}
            className="flex shrink-0 items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={16} />
            Add New
          </button>
        </div>

        {section === "products" && (
          <PetrolProductsTable
            products={filteredProducts}
            onEdit={(item) => {
              setEditingProduct(item);
              setProductModal(true);
            }}
            onDelete={(id) =>
              setProducts((prev) =>
                prev.filter(
                  (item) => item.id !== id
                )
              )
            }
          />
        )}

        {section === "tanks" && (
          <TanksTable
            tanks={filteredTanks}
            onEdit={(item) => {
              setEditingTank(item);
              setTankModal(true);
            }}
            onDelete={(id) =>
              setTanks((prev) =>
                prev.filter(
                  (item) => item.id !== id
                )
              )
            }
          />
        )}

        {section === "nozzle" && (
          <NozzleTable
            nozzles={filteredNozzles}
            onEdit={(item) => {
              setEditingNozzle(item);
              setNozzleModal(true);
            }}
            onDelete={(id) =>
              setNozzles((prev) =>
                prev.filter(
                  (item) => item.id !== id
                )
              )
            }
          />
        )}
      </div>

      {productModal && (
        <ProductModal
          title={
            editingProduct
              ? "Edit Product"
              : "Add New Product"
          }
          product={editingProduct}
          onClose={() => {
            setProductModal(false);
            setEditingProduct(null);
          }}
          onSave={(product) => {
            setProducts((prev) => {
              if (editingProduct) {
                return prev.map((item) =>
                  item.id === product.id
                    ? product
                    : item
                );
              }

              return [
                ...prev,
                {
                  ...product,
                  id:
                    Math.max(
                      0,
                      ...prev.map(
                        (item) => item.id
                      )
                    ) + 1,
                },
              ];
            });

            setProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {tankModal && (
        <TankModal
          title={
            editingTank
              ? "Edit Tank"
              : "Add New Tank"
          }
          tank={editingTank}
          products={products}
          onClose={() => {
            setTankModal(false);
            setEditingTank(null);
          }}
          onSave={(tank) => {
            setTanks((prev) => {
              if (editingTank) {
                return prev.map((item) =>
                  item.id === tank.id
                    ? tank
                    : item
                );
              }

              return [
                ...prev,
                {
                  ...tank,
                  id:
                    Math.max(
                      0,
                      ...prev.map(
                        (item) => item.id
                      )
                    ) + 1,
                },
              ];
            });

            setTankModal(false);
            setEditingTank(null);
          }}
        />
      )}

      {nozzleModal && (
        <NozzleModal
          title={
            editingNozzle
              ? "Edit Nozzle"
              : "Add New Nozzle"
          }
          nozzle={editingNozzle}
          tanks={tanks}
          products={products}
          onClose={() => {
            setNozzleModal(false);
            setEditingNozzle(null);
          }}
          onSave={(nozzle) => {
            setNozzles((prev) => {
              if (editingNozzle) {
                return prev.map((item) =>
                  item.id === nozzle.id
                    ? nozzle
                    : item
                );
              }

              return [
                ...prev,
                {
                  ...nozzle,
                  id:
                    Math.max(
                      0,
                      ...prev.map(
                        (item) => item.id
                      )
                    ) + 1,
                },
              ];
            });

            setNozzleModal(false);
            setEditingNozzle(null);
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   PETROL PRODUCT TABLE
========================================================= */

function PetrolProductsTable({
  products,
  onEdit,
  onDelete,
}: {
  products: PetrolProduct[];
  onEdit: (product: PetrolProduct) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <TableWrapper>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#d9ad50] text-left text-sm font-bold text-slate-900">
            <th className="px-3 py-3">
              Product Name
            </th>

            <th className="px-3 py-3">
              Product SKU
            </th>

            <th className="px-3 py-3">
              Price
            </th>

            <th className="w-32 px-3 py-3">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-t border-[#c99f43] bg-slate-100"
            >
              <td className="px-3 py-3 text-sm font-bold">
                {product.name}
              </td>

              <td className="px-3 py-3 text-sm">
                {product.sku}
              </td>

              <td className="px-3 py-3 text-sm">
                ₹{product.price.toFixed(2)}
              </td>

              <td className="px-3 py-3">
                <ActionButtons
                  onEdit={() => onEdit(product)}
                  onDelete={() =>
                    onDelete(product.id)
                  }
                />
              </td>
            </tr>
          ))}

          {products.length === 0 && (
            <EmptyRow colSpan={4} />
          )}
        </tbody>
      </table>
    </TableWrapper>
  );
}

/* =========================================================
   TANK TABLE
========================================================= */

function TanksTable({
  tanks,
  onEdit,
  onDelete,
}: {
  tanks: Tank[];
  onEdit: (tank: Tank) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <TableWrapper>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#d9ad50] text-left text-sm font-bold text-slate-900">
            <th className="px-3 py-3">Tank Name</th>
            <th className="px-3 py-3">Product</th>
            <th className="px-3 py-3">Capacity</th>
            <th className="px-3 py-3">Minimum</th>
            <th className="px-3 py-3">Available Stock</th>
            <th className="px-3 py-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {tanks.map((tank) => (
            <tr
              key={tank.id}
              className="border-t border-[#c99f43] bg-slate-100"
            >
              <td className="px-3 py-3 text-sm font-bold">
                {tank.name}
              </td>

              <td className="px-3 py-3 text-sm">
                {tank.product}
              </td>

              <td className="px-3 py-3 text-sm">
                {tank.capacity.toLocaleString()}
              </td>

              <td className="px-3 py-3 text-sm">
                {tank.minimum.toLocaleString()}
              </td>

              <td className="px-3 py-3 text-sm">
                {tank.available.toLocaleString()}
              </td>

              <td className="px-3 py-3">
                <ActionButtons
                  onEdit={() => onEdit(tank)}
                  onDelete={() =>
                    onDelete(tank.id)
                  }
                />
              </td>
            </tr>
          ))}

          {tanks.length === 0 && (
            <EmptyRow colSpan={6} />
          )}
        </tbody>
      </table>
    </TableWrapper>
  );
}

/* =========================================================
   NOZZLE TABLE
========================================================= */

function NozzleTable({
  nozzles,
  onEdit,
  onDelete,
}: {
  nozzles: Nozzle[];
  onEdit: (nozzle: Nozzle) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <TableWrapper>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#d9ad50] text-left text-sm font-bold text-slate-900">
            <th className="px-3 py-3">Nozzle</th>
            <th className="px-3 py-3">Tank</th>
            <th className="px-3 py-3">Product</th>
            <th className="px-3 py-3">Opening Meter</th>
            <th className="px-3 py-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {nozzles.map((nozzle) => (
            <tr
              key={nozzle.id}
              className="border-t border-[#c99f43] bg-slate-100"
            >
              <td className="px-3 py-3 text-sm font-bold">
                {nozzle.name}
              </td>

              <td className="px-3 py-3 text-sm">
                {nozzle.tank}
              </td>

              <td className="px-3 py-3 text-sm">
                {nozzle.product}
              </td>

              <td className="px-3 py-3 text-sm">
                {nozzle.openingMeter.toFixed(2)}
              </td>

              <td className="px-3 py-3">
                <ActionButtons
                  onEdit={() => onEdit(nozzle)}
                  onDelete={() =>
                    onDelete(nozzle.id)
                  }
                />
              </td>
            </tr>
          ))}

          {nozzles.length === 0 && (
            <EmptyRow colSpan={5} />
          )}
        </tbody>
      </table>
    </TableWrapper>
  );
}

/* =========================================================
   OIL TAB
========================================================= */

function OilTab() {
  const [products, setProducts] =
    useState<OilProduct[]>(initialOilProducts);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<OilProduct | null>(null);

  const filteredProducts = useMemo(() => {
    const value = search.toLowerCase();

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(value) ||
        product.sku.toLowerCase().includes(value)
    );
  }, [products, search]);

  return (
    <div className="mt-3 grid grid-cols-[220px_1fr] border border-slate-200 bg-white">

      {/* SIDE */}
      <div className="border-r border-slate-200 p-6">
        <h3 className="mb-6 text-base font-bold text-slate-900">
          Data Setup
        </h3>

        <SideItem
          label="Oil Products"
          active
          onClick={() => undefined}
        />
      </div>

      {/* CONTENT */}
      <div className="min-w-0 p-5">

        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search oil products..."
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
            className="flex shrink-0 items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={16} />
            Add New
          </button>
        </div>

        <TableWrapper>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#d9ad50] text-left text-sm font-bold text-slate-900">
                <th className="px-3 py-3">
                  Oil Product Name
                </th>

                <th className="px-3 py-3">
                  Product SKU
                </th>

                <th className="px-3 py-3">
                  Price
                </th>

                <th className="px-3 py-3">
                  Available Stocks
                </th>

                <th className="px-3 py-3">
                  GST %
                </th>

                <th className="px-3 py-3">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map(
                (product) => (
                  <tr
                    key={product.id}
                    className="border-t border-[#c99f43] bg-slate-100"
                  >
                    <td className="px-3 py-3 text-sm font-bold">
                      {product.name}
                    </td>

                    <td className="px-3 py-3 text-sm">
                      {product.sku}
                    </td>

                    <td className="px-3 py-3 text-sm">
                      ₹{product.price.toFixed(2)}
                    </td>

                    <td className="px-3 py-3 text-sm">
                      {product.stock}
                    </td>

                    <td className="px-3 py-3 text-sm">
                      {product.gst}%
                    </td>

                    <td className="px-3 py-3">
                      <ActionButtons
                        onEdit={() => {
                          setEditingProduct(
                            product
                          );
                          setModalOpen(true);
                        }}
                        onDelete={() =>
                          setProducts(
                            (prev) =>
                              prev.filter(
                                (item) =>
                                  item.id !==
                                  product.id
                              )
                          )
                        }
                      />
                    </td>
                  </tr>
                )
              )}

              {filteredProducts.length === 0 && (
                <EmptyRow colSpan={6} />
              )}
            </tbody>
          </table>
        </TableWrapper>
      </div>

      {modalOpen && (
        <OilProductModal
          title={
            editingProduct
              ? "Edit Oil Product"
              : "Add New Product"
          }
          product={editingProduct}
          onClose={() => {
            setModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={(product) => {
            setProducts((prev) => {
              if (editingProduct) {
                return prev.map((item) =>
                  item.id === product.id
                    ? product
                    : item
                );
              }

              return [
                ...prev,
                {
                  ...product,
                  id:
                    Math.max(
                      0,
                      ...prev.map(
                        (item) => item.id
                      )
                    ) + 1,
                },
              ];
            });

            setModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   PRODUCT MODAL
========================================================= */

function ProductModal({
  title,
  product,
  onClose,
  onSave,
}: {
  title: string;
  product: PetrolProduct | null;
  onClose: () => void;
  onSave: (product: PetrolProduct) => void;
}) {
  const [name, setName] = useState(
    product?.name ?? ""
  );

  const [sku, setSku] = useState(
    product?.sku ?? ""
  );

  const [price, setPrice] = useState(
    product?.price?.toString() ?? ""
  );

  const submit = () => {
    if (!name.trim() || !sku.trim() || !price) {
      return;
    }

    onSave({
      id: product?.id ?? 0,
      name: name.trim(),
      sku: sku.trim(),
      price: Number(price),
    });
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Product Name"
          required
          value={name}
          onChange={setName}
        />

        <Field
          label="Product SKU"
          required
          value={sku}
          onChange={setSku}
        />

        <Field
          label="Unit Price"
          required
          type="number"
          value={price}
          onChange={setPrice}
        />
      </div>

      <ModalFooter
        onCancel={onClose}
        onSave={submit}
      />
    </Modal>
  );
}

/* =========================================================
   TANK MODAL
========================================================= */

function TankModal({
  title,
  tank,
  products,
  onClose,
  onSave,
}: {
  title: string;
  tank: Tank | null;
  products: PetrolProduct[];
  onClose: () => void;
  onSave: (tank: Tank) => void;
}) {
  const [name, setName] = useState(
    tank?.name ?? ""
  );

  const [product, setProduct] = useState(
    tank?.product ??
      products[0]?.name ??
      ""
  );

  const [capacity, setCapacity] = useState(
    tank?.capacity?.toString() ?? ""
  );

  const [minimum, setMinimum] = useState(
    tank?.minimum?.toString() ?? ""
  );

  const [available, setAvailable] = useState(
    tank?.available?.toString() ?? ""
  );

  const submit = () => {
    if (!name.trim() || !capacity) {
      return;
    }

    onSave({
      id: tank?.id ?? 0,
      name: name.trim(),
      product,
      capacity: Number(capacity),
      minimum: Number(minimum || 0),
      available: Number(available || 0),
    });
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Tank Name"
          required
          value={name}
          onChange={setName}
        />

        <SelectField
          label="Product"
          value={product}
          options={products.map(
            (item) => item.name
          )}
          onChange={setProduct}
        />

        <Field
          label="Capacity"
          required
          type="number"
          value={capacity}
          onChange={setCapacity}
        />

        <Field
          label="Minimum Level"
          type="number"
          value={minimum}
          onChange={setMinimum}
        />

        <Field
          label="Available Stock"
          type="number"
          value={available}
          onChange={setAvailable}
        />
      </div>

      <ModalFooter
        onCancel={onClose}
        onSave={submit}
      />
    </Modal>
  );
}

/* =========================================================
   NOZZLE MODAL
========================================================= */

function NozzleModal({
  title,
  nozzle,
  tanks,
  products,
  onClose,
  onSave,
}: {
  title: string;
  nozzle: Nozzle | null;
  tanks: Tank[];
  products: PetrolProduct[];
  onClose: () => void;
  onSave: (nozzle: Nozzle) => void;
}) {
  const [name, setName] = useState(
    nozzle?.name ?? ""
  );

  const [tank, setTank] = useState(
    nozzle?.tank ??
      tanks[0]?.name ??
      ""
  );

  const [product, setProduct] = useState(
    nozzle?.product ??
      products[0]?.name ??
      ""
  );

  const [openingMeter, setOpeningMeter] =
    useState(
      nozzle?.openingMeter?.toString() ?? ""
    );

  const submit = () => {
    if (!name.trim() || !tank || !product) {
      return;
    }

    onSave({
      id: nozzle?.id ?? 0,
      name: name.trim(),
      tank,
      product,
      openingMeter: Number(
        openingMeter || 0
      ),
    });
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nozzle Name"
          required
          value={name}
          onChange={setName}
        />

        <SelectField
          label="Tank"
          value={tank}
          options={tanks.map(
            (item) => item.name
          )}
          onChange={setTank}
        />

        <SelectField
          label="Product"
          value={product}
          options={products.map(
            (item) => item.name
          )}
          onChange={setProduct}
        />

        <Field
          label="Opening Meter"
          type="number"
          value={openingMeter}
          onChange={setOpeningMeter}
        />
      </div>

      <ModalFooter
        onCancel={onClose}
        onSave={submit}
      />
    </Modal>
  );
}

/* =========================================================
   OIL PRODUCT MODAL
========================================================= */

function OilProductModal({
  title,
  product,
  onClose,
  onSave,
}: {
  title: string;
  product: OilProduct | null;
  onClose: () => void;
  onSave: (product: OilProduct) => void;
}) {
  const [name, setName] = useState(
    product?.name ?? ""
  );

  const [sku, setSku] = useState(
    product?.sku ?? "OIL"
  );

  const [price, setPrice] = useState(
    product?.price?.toString() ?? ""
  );

  const [stock, setStock] = useState(
    product?.stock?.toString() ?? ""
  );

  const [gst, setGst] = useState(
    product?.gst?.toString() ?? "0"
  );

  const submit = () => {
    if (!name.trim() || !price) {
      return;
    }

    onSave({
      id: product?.id ?? 0,
      name: name.trim(),
      sku: sku.trim() || "OIL",
      price: Number(price),
      stock: Number(stock || 0),
      gst: Number(gst || 0),
    });
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Product Name"
          required
          value={name}
          onChange={setName}
        />

        <Field
          label="Product Code"
          value={sku}
          onChange={setSku}
        />

        <Field
          label="Unit Price"
          required
          type="number"
          value={price}
          onChange={setPrice}
        />

        <Field
          label="Available Stocks"
          type="number"
          value={stock}
          onChange={setStock}
        />

        <Field
          label="GST Tax"
          type="number"
          value={gst}
          onChange={setGst}
        />
      </div>

      <ModalFooter
        onCancel={onClose}
        onSave={submit}
      />
    </Modal>
  );
}

/* =========================================================
   SIDE ITEM
========================================================= */

function SideItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-md px-3 py-2.5 text-left text-sm transition ${
        active
          ? "bg-slate-100 font-semibold text-brand-600"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

/* =========================================================
   ACTION BUTTONS
========================================================= */

function ActionButtons({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-brand-600 hover:bg-slate-50"
      >
        Edit
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="rounded-md border border-red-100 bg-white p-2 text-red-500 hover:bg-red-50"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
  required = false,
  textarea = false,
}: {
  label: string;
  value?: string | null;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 text-xs font-medium text-slate-600">
        {required && (
          <span className="mr-1 text-red-500">
            *
          </span>
        )}

        {label}
      </div>

      <div
        className={`w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 ${
          textarea ? "min-h-[65px]" : "min-h-[40px]"
        }`}
      >
        {value || "—"}
      </div>
    </div>
  );
}

/* =========================================================
   SETTING
========================================================= */

function Setting({
  label,
  checked,
  editable = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  editable?: boolean;
  onChange?: () => void;
}) {
  return (
    <label
      className={`mb-4 flex items-center gap-3 text-sm text-slate-700 ${
        editable ? "cursor-pointer" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        readOnly={!editable}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300"
      />

      <span>{label}</span>
    </label>
  );
}

/* =========================================================
   TABLE WRAPPER
========================================================= */

function TableWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto border border-[#c99f43]">
      {children}
    </div>
  );
}

/* =========================================================
   EMPTY ROW
========================================================= */

function EmptyRow({
  colSpan,
}: {
  colSpan: number;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-10 text-center text-sm text-slate-400"
      >
        No records found.
      </td>
    </tr>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL FOOTER
========================================================= */

function ModalFooter({
  onCancel,
  onSave,
  saving = false,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
}) {
  return (
    <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm text-slate-700 hover:bg-slate-50"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">
        {required && (
          <span className="mr-1 text-red-500">
            *
          </span>
        )}

        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
      />
    </label>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}