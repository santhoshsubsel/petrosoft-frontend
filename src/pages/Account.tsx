import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ComponentType, ReactNode } from "react";
import {
  Pencil,
  Plus,
  Search,
  X,
  Trash2,
  Package,
  Fuel,
  Gauge,
  Droplet,
  Camera,
  ReceiptText,
  Truck,
} from "lucide-react";

import {
  getAccount,
  updateAccount,
  type Account,
} from "../services/accountService";
import {
  getProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
  type Product,
  type ProductType,
  type ProductUnit,
} from "../services/productService";
import {
  getTanks,
  createTank,
  updateTank,
  updateTankStatus,
} from "../services/tankService";
import {
  getNozzles,
  createNozzle,
  updateNozzle,
  updateNozzleStatus,
} from "../services/nozzleService";
import {
  getResource,
  createResource,
  updateResource,
} from "../services/resourceService";
import {
  getOilProducts,
  createOilProduct,
  updateOilProduct,
  updateOilProductStatus,
  type OilProduct,
  type OilProductUnit,
} from "../services/oilProductService";

type MainTab = "account" | "petrol" | "oil" | "expense-types" | "vehicles";
type PetrolSection = "products" | "tanks" | "nozzle";

type TankView = {
  id: string;
  name: string;
  productId: string;
  product: string;
  capacity: number;
  minimum: number;
  available: number;
  active: boolean;
};

type NozzleView = {
  id: string;
  name: string;
  tankId: string;
  tank: string;
  product: string;
  openingMeter: number;
  currentMeter: number;
  active: boolean;
};

type SelectOption = {
  label: string;
  value: string;
};

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

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Unable to convert image to Base64"));
    };

    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });

const toNumber = (value: unknown) => Number(value ?? 0);

const relationName = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name?: unknown }).name ?? "");
  }
  return "";
};

const normalizeTank = (raw: any, products: Product[]): TankView => {
  const productId = String(raw.productId ?? raw.product?.id ?? "");
  const product =
    relationName(raw.product) ||
    products.find((item) => item.id === productId)?.name ||
    productId;

  return {
    id: String(raw.id),
    name: String(raw.name ?? ""),
    productId,
    product,
    capacity: toNumber(raw.capacity),
    minimum: toNumber(raw.minCapacity ?? raw.minimum),
    available: toNumber(raw.availableStock ?? raw.available),
    active: raw.active !== false,
  };
};

const normalizeNozzle = (
  raw: any,
  tanks: TankView[],
  products: Product[],
): NozzleView => {
  const tankId = String(raw.tankId ?? raw.tank?.id ?? "");
  const tank =
    relationName(raw.tank) ||
    tanks.find((item) => item.id === tankId)?.name ||
    tankId;
  const productId = String(
    raw.productId ??
      raw.product?.id ??
      tanks.find((item) => item.id === tankId)?.productId ??
      "",
  );

  const product =
    relationName(raw.product) ||
    products.find((item) => item.id === productId)?.name ||
    tanks.find((item) => item.id === tankId)?.product ||
    productId;

  return {
    id: String(raw.id),
    name: String(raw.name ?? ""),
    tankId,
    tank,
    product,
    openingMeter: toNumber(raw.openingMeter),
    currentMeter: toNumber(raw.currentMeter ?? raw.openingMeter),
    active: raw.active !== false,
  };
};

export default function Account() {
  const [account, setAccount] = useState<Account>(initialAccount);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<MainTab>("account");

  const loadAccount = async () => {
    try {
      setLoading(true);
      setError("");
      setAccount(await getAccount());
    } catch (err) {
      console.error("Account GET error:", err);
      setError("Unable to load account details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccount();
  }, []);

  return (
    <div className="space-y-5 pt-10">
      {/* Plain header: no Add New / Search / Filter / Export */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Account Setup</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage business unit details and station settings.
        </p>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-200">
        <MainTabButton label="Account Details" active={activeTab === "account"} onClick={() => setActiveTab("account")} />
        <MainTabButton label="Petrol" active={activeTab === "petrol"} onClick={() => setActiveTab("petrol")} />
        <MainTabButton label="Oil" active={activeTab === "oil"} onClick={() => setActiveTab("oil")} />
        <MainTabButton label="Expense Types" active={activeTab === "expense-types"} onClick={() => setActiveTab("expense-types")} />
        <MainTabButton label="Vehicles" active={activeTab === "vehicles"} onClick={() => setActiveTab("vehicles")} />
      </div>

      {/* Account loading/error only blocks this tab; Petrol and Oil load independently */}
      {activeTab === "account" &&
        (loading ? (
          <AccountSkeleton />
        ) : error ? (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {error}
            <button type="button" onClick={() => void loadAccount()} className="font-medium underline">
              Retry
            </button>
          </div>
        ) : (
          <AccountDetails account={account} onAccountUpdated={setAccount} />
        ))}
      {activeTab === "petrol" && <PetrolTab />}
      {activeTab === "oil" && <OilTab />}
      {activeTab === "expense-types" && <ExpenseTypesTab />}
      {activeTab === "vehicles" && <VehiclesTab />}
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="mt-4 grid animate-pulse gap-4 lg:grid-cols-2">
      <div className="h-80 rounded-xl bg-slate-100" />
      <div className="h-80 rounded-xl bg-slate-100" />
    </div>
  );
}

function AccountDetails({
  account,
  onAccountUpdated,
}: {
  account: Account;
  onAccountUpdated: (account: Account) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modal, setModal] = useState<"business" | "settings" | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");

  const address = useMemo(
    () =>
      [
        account.billingStreet,
        account.billingCity,
        [account.state, account.postalCode].filter(Boolean).join(" "),
        account.country,
      ]
        .filter(Boolean)
        .join(", "),
    [account.billingStreet, account.billingCity, account.state, account.postalCode, account.country],
  );

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoError("");

    if (!file.type.startsWith("image/")) {
      setLogoError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo image must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    try {
      setLogoUploading(true);
      const base64 = await fileToBase64(file);
      onAccountUpdated(await updateAccount({ ...account, logoUrl: base64 }));
    } catch (err) {
      console.error("Logo update error:", err);
      setLogoError("Unable to update logo.");
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <DetailCard title="Business Details" onEdit={() => setModal("business")}>
          <div className="mb-2 flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="relative shrink-0">
              {account.logoUrl ? (
                <img
                  src={account.logoUrl}
                  alt="Account Logo"
                  className={`h-20 w-20 rounded-full border border-slate-200 bg-white object-contain shadow-sm transition-opacity ${logoUploading ? "opacity-50" : ""}`}
                />
              ) : (
                <div
                  className={`grid h-20 w-20 place-items-center rounded-full border-2 border-red-600 bg-white text-2xl font-black text-red-600 shadow-sm transition-opacity ${logoUploading ? "opacity-50" : ""}`}
                >
                  HP
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
              <button
                type="button"
                disabled={logoUploading}
                onClick={() => fileInputRef.current?.click()}
                aria-label={account.logoUrl ? "Change logo" : "Upload logo"}
                title={account.logoUrl ? "Change logo" : "Upload logo"}
                className={`absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-brand-600 text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed ${logoUploading ? "animate-pulse" : ""}`}
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">Business Logo</p>
              {logoError ? (
                <p className="mt-1 text-xs text-red-500">{logoError}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  {logoUploading ? "Uploading..." : "PNG, JPG or WEBP · Max 2 MB"}
                </p>
              )}
            </div>
          </div>

          <dl className="divide-y divide-slate-100">
            <DetailRow label="Account Name" value={account.accountName} />
            <DetailRow label="Phone" value={account.phone} />
            <DetailRow label="Billing Address" value={address} />
          </dl>
        </DetailCard>

        {/* <DetailCard title="Notification Settings" onEdit={() => setModal("settings")}>
          <NotificationFields settings={account.settings} />
        </DetailCard> */}
      </div>

      {modal === "business" && (
        <BusinessEditModal
          account={account}
          onClose={() => setModal(null)}
          onSaved={(updated) => {
            onAccountUpdated(updated);
            setModal(null);
          }}
        />
      )}
      {modal === "settings" && (
        <SettingsEditModal
          account={account}
          onClose={() => setModal(null)}
          onSaved={(updated) => {
            onAccountUpdated(updated);
            setModal(null);
          }}
        />
      )}
    </>
  );
}

function DetailCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm text-brand-600 transition hover:bg-slate-50"
        >
          <Pencil size={14} /> Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-words font-medium text-slate-800">
        {value || <span className="font-normal text-slate-400">—</span>}
      </dd>
    </div>
  );
}

// One layout for both the read-only card and the edit modal.
// Weekly/Monthly reports share the same three options in the data model,
// so they are shown once instead of twice.
function NotificationFields({
  settings,
  onToggle,
}: {
  settings: Account["settings"];
  onToggle?: (key: keyof Account["settings"]) => void;
}) {
  const editable = Boolean(onToggle);
  const change = (key: keyof Account["settings"]) => (onToggle ? () => onToggle(key) : undefined);
  const reportsOn = settings.enableWeeklyCreditReport || settings.enableMonthlyCreditReport;

  return (
    <div className="space-y-4">
      {/* <Toggle
        label="Enable Customer Email for Credit Payment"
        checked={settings.enableCustomerEmailForCreditPayment}
        editable={editable}
        onChange={change("enableCustomerEmailForCreditPayment")}
      />

      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <div className="mb-1 text-sm font-bold text-slate-700">Credit Reports</div>
        <Toggle label="Weekly Credit Report" checked={settings.enableWeeklyCreditReport} editable={editable} onChange={change("enableWeeklyCreditReport")} />
        <Toggle label="Monthly Credit Report" checked={settings.enableMonthlyCreditReport} editable={editable} onChange={change("enableMonthlyCreditReport")} />

        <div className={`ml-2 mt-3 space-y-1 border-l border-slate-200 pl-4 transition-opacity ${reportsOn ? "opacity-100" : "opacity-40"}`}>
          <Toggle label="Enable Customer" checked={settings.enableCustomer} editable={editable} subtle onChange={change("enableCustomer")} />
          <Toggle label="Only Admin" checked={settings.onlyAdmin} editable={editable} subtle onChange={change("onlyAdmin")} />
          <Toggle label="Configure Email" checked={settings.configureEmail} editable={editable} subtle onChange={change("configureEmail")} />
        </div>
      </div> */}
    </div>
  );
}

function SettingsEditModal({
  account,
  onClose,
  onSaved,
}: {
  account: Account;
  onClose: () => void;
  onSaved: (account: Account) => void;
}) {
  const [form, setForm] = useState<Account["settings"]>(account.settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (key: keyof Account["settings"]) =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      onSaved(await updateAccount({ ...account, settings: form }));
    } catch (err) {
      console.error(err);
      setError("Unable to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit Settings" onClose={onClose}>
      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {/* <NotificationFields settings={form} onToggle={toggle} /> */}
      <ModalFooter saving={saving} onCancel={onClose} onSave={save} />
    </Modal>
  );
}

type BusinessForm = {
  accountName: string;
  phone: string;
  billingStreet: string;
  billingCity: string;
  postalCode: string;
  state: string;
  country: string;
};

function BusinessEditModal({
  account,
  onClose,
  onSaved,
}: {
  account: Account;
  onClose: () => void;
  onSaved: (account: Account) => void;
}) {
  const [form, setForm] = useState<BusinessForm>({
    accountName: account.accountName ?? "",
    phone: account.phone ?? "",
    billingStreet: account.billingStreet ?? "",
    billingCity: account.billingCity ?? "",
    postalCode: account.postalCode ?? "",
    state: account.state ?? "",
    country: account.country ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof BusinessForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!form.accountName.trim()) {
      setError("Account name is required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      onSaved(await updateAccount({ ...account, ...form, accountName: form.accountName.trim() }));
    } catch (err) {
      console.error(err);
      setError("Unable to update business details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit Business Details" onClose={onClose}>
      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <Field label="Account Name" required value={form.accountName} onChange={set("accountName")} />
        <Field label="Phone" value={form.phone} onChange={set("phone")} />
        <div className="sm:col-span-2">
          <Field label="Billing Street" value={form.billingStreet} onChange={set("billingStreet")} />
        </div>
        <Field label="Billing City" value={form.billingCity} onChange={set("billingCity")} />
        <Field label="Billing State/Province" value={form.state} onChange={set("state")} />
        <Field label="Billing Zip/Postal Code" value={form.postalCode} onChange={set("postalCode")} />
        <Field label="Billing Country" value={form.country} onChange={set("country")} />
      </div>
      <ModalFooter saving={saving} onCancel={onClose} onSave={save} />
    </Modal>
  );
}

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
      className={`shrink-0 whitespace-nowrap px-5 py-3 text-sm font-medium transition ${
        active
          ? "border-b-2 border-brand-600 text-brand-600"
          : "text-slate-600 hover:text-brand-600"
      }`}
    >
      {label}
    </button>
  );
}

function PetrolTab() {
  const [section, setSection] = useState<PetrolSection>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [tanks, setTanks] = useState<TankView[]>([]);
  const [nozzles, setNozzles] = useState<NozzleView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [productModal, setProductModal] = useState(false);
  const [tankModal, setTankModal] = useState(false);
  const [nozzleModal, setNozzleModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingTank, setEditingTank] = useState<TankView | null>(null);
  const [editingNozzle, setEditingNozzle] = useState<NozzleView | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const productData = await getProducts();
      const fuelProducts = productData.filter(
        (item) => item.active && (item.productType === "PETROL" || item.productType === "DIESEL"),
      );
      const [tankData, nozzleData] = await Promise.all([getTanks(), getNozzles()]);
      const normalizedTanks = (tankData as any[]).map((item) => normalizeTank(item, fuelProducts));
      setProducts(productData);
      setTanks(normalizedTanks);
      setNozzles((nozzleData as any[]).map((item) => normalizeNozzle(item, normalizedTanks, fuelProducts)));
    } catch (err) {
      console.error("Petrol master-data GET error:", err);
      setError("Unable to load petrol master data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const fuelProducts = useMemo(
    () => products.filter((item) => item.active && (item.productType === "PETROL" || item.productType === "DIESEL")),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const value = search.toLowerCase();
    return fuelProducts.filter((item) => item.name.toLowerCase().includes(value) || (item.code ?? "").toLowerCase().includes(value));
  }, [fuelProducts, search]);

  const filteredTanks = useMemo(() => {
    const value = search.toLowerCase();
    return tanks.filter((item) => item.name.toLowerCase().includes(value) || item.product.toLowerCase().includes(value));
  }, [tanks, search]);

  const filteredNozzles = useMemo(() => {
    const value = search.toLowerCase();
    return nozzles.filter((item) => item.name.toLowerCase().includes(value) || item.tank.toLowerCase().includes(value) || item.product.toLowerCase().includes(value));
  }, [nozzles, search]);

  const saveTank = async (data: TankView) => {
    const payload = {
      name: data.name,
      productId: data.productId,
      capacity: data.capacity,
      minCapacity: data.minimum,
      availableStock: data.available,
      active: data.active,
    };
    const saved = editingTank
      ? await updateTank(editingTank.id, payload as any)
      : await createTank(payload as any);
    const normalized = normalizeTank(saved, fuelProducts);
    setTanks((prev) => (editingTank ? prev.map((item) => (item.id === editingTank.id ? normalized : item)) : [normalized, ...prev]));
    setTankModal(false);
    setEditingTank(null);
  };

  const saveNozzle = async (data: NozzleView) => {
    const payload = {
      name: data.name,
      tankId: data.tankId,
      openingMeter: data.openingMeter,
      currentMeter: data.currentMeter,
      active: data.active,
    };
    const saved = editingNozzle
      ? await updateNozzle(editingNozzle.id, payload as any)
      : await createNozzle(payload as any);
    const normalized = normalizeNozzle(saved, tanks, fuelProducts);
    setNozzles((prev) => (editingNozzle ? prev.map((item) => (item.id === editingNozzle.id ? normalized : item)) : [normalized, ...prev]));
    setNozzleModal(false);
    setEditingNozzle(null);
  };

  return (
    <div className="mt-4 grid grid-cols-1 rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-[200px_1fr]">
      <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r md:p-6">
        <h3 className="mb-4 hidden text-base font-bold text-slate-900 md:block">Data Setup</h3>
        <div className="flex gap-2 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
          <SideItem icon={Package} label="Products" active={section === "products"} onClick={() => { setSection("products"); setSearch(""); }} />
          <SideItem icon={Fuel} label="Tanks" active={section === "tanks"} onClick={() => { setSection("tanks"); setSearch(""); }} />
          <SideItem icon={Gauge} label="Nozzle" active={section === "nozzle"} onClick={() => { setSection("nozzle"); setSearch(""); }} />
        </div>
      </div>

      <div className="min-w-0 p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${section === "products" ? "products" : section === "tanks" ? "tanks" : "nozzles"}...`} className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <button type="button" onClick={() => { if (section === "products") { setEditingProduct(null); setProductModal(true); } else if (section === "tanks") { setEditingTank(null); setTankModal(true); } else { setEditingNozzle(null); setNozzleModal(true); } }} className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"><Plus size={16} />Add New</button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {loading ? (
          <TableWrapper><div className="p-8 text-center text-sm text-slate-500">Loading master data...</div></TableWrapper>
        ) : section === "products" ? (
          <PetrolProductsTable products={filteredProducts} onEdit={(item) => { setEditingProduct(item); setProductModal(true); }} onDelete={async (id) => { try { await updateProductStatus(id, false); setProducts((prev) => prev.map((item) => item.id === id ? { ...item, active: false } : item)); } catch (err) { console.error(err); setError("Unable to deactivate product."); } }} />
        ) : section === "tanks" ? (
          <TanksTable tanks={filteredTanks} onEdit={(item) => { setEditingTank(item); setTankModal(true); }} onDelete={async (id) => { try { await updateTankStatus(id, false); setTanks((prev) => prev.filter((item) => item.id !== id)); } catch (err) { console.error(err); setError("Unable to deactivate tank."); } }} />
        ) : (
          <NozzleTable nozzles={filteredNozzles} onEdit={(item) => { setEditingNozzle(item); setNozzleModal(true); }} onDelete={async (id) => { try { await updateNozzleStatus(id, false); setNozzles((prev) => prev.filter((item) => item.id !== id)); } catch (err) { console.error(err); setError("Unable to deactivate nozzle."); } }} />
        )}
      </div>

      {productModal && <ProductModal title={editingProduct ? "Edit Product" : "Add New Product"} product={editingProduct} onClose={() => { setProductModal(false); setEditingProduct(null); }} onSave={async (data) => { try { const saved = editingProduct ? await updateProduct(editingProduct.id, data) : await createProduct(data); setProducts((prev) => editingProduct ? prev.map((item) => item.id === editingProduct.id ? saved : item) : [saved, ...prev]); setProductModal(false); setEditingProduct(null); } catch (err) { console.error(err); setError("Unable to save product."); throw err; } }} />}
      {tankModal && <TankModal title={editingTank ? "Edit Tank" : "Add New Tank"} tank={editingTank} products={fuelProducts} onClose={() => { setTankModal(false); setEditingTank(null); }} onSave={saveTank} />}
      {nozzleModal && <NozzleModal title={editingNozzle ? "Edit Nozzle" : "Add New Nozzle"} nozzle={editingNozzle} tanks={tanks} onClose={() => { setNozzleModal(false); setEditingNozzle(null); }} onSave={saveNozzle} />}
    </div>
  );
}

function PetrolProductsTable({
  products,
  onEdit,
  onDelete,
}: {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <TableWrapper>
      <table className="w-full border-collapse">
        <thead><tr className="text-left text-sm font-bold text-slate-900"><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Product Name</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Product SKU</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Price</th><th className="sticky top-0 z-10 w-32 bg-[#d9ad50] px-3 py-3 text-right">Action</th></tr></thead>
        <tbody>
          {products.map((product) => <tr key={product.id} className="border-t border-slate-200 odd:bg-white even:bg-slate-50 transition-colors hover:bg-amber-50/60"><td className="px-3 py-3 text-sm font-bold">{product.name}</td><td className="px-3 py-3 text-sm">{product.code ?? "-"}</td><td className="px-3 py-3 text-sm">₹{Number(product.currentPrice).toFixed(2)}</td><td className="px-3 py-3"><ActionButtons onEdit={() => onEdit(product)} onDelete={() => onDelete(product.id)} /></td></tr>)}
          {products.length === 0 && <EmptyRow colSpan={4} />}
        </tbody>
      </table>
    </TableWrapper>
  );
}

function TanksTable({ tanks, onEdit, onDelete }: { tanks: TankView[]; onEdit: (tank: TankView) => void; onDelete: (id: string) => void }) {
  return (
    <TableWrapper>
      <table className="w-full border-collapse">
        <thead><tr className="text-left text-sm font-bold text-slate-900"><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Tank Name</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Product</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Capacity</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Minimum</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Available Stock</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3 text-right">Action</th></tr></thead>
        <tbody>
          {tanks.map((tank) => <tr key={tank.id} className="border-t border-slate-200 odd:bg-white even:bg-slate-50 transition-colors hover:bg-amber-50/60"><td className="px-3 py-3 text-sm font-bold">{tank.name}</td><td className="px-3 py-3 text-sm">{tank.product}</td><td className="px-3 py-3 text-sm">{tank.capacity.toLocaleString()}</td><td className="px-3 py-3 text-sm">{tank.minimum.toLocaleString()}</td><td className="px-3 py-3 text-sm">{tank.available.toLocaleString()}</td><td className="px-3 py-3"><ActionButtons onEdit={() => onEdit(tank)} onDelete={() => onDelete(tank.id)} /></td></tr>)}
          {tanks.length === 0 && <EmptyRow colSpan={6} />}
        </tbody>
      </table>
    </TableWrapper>
  );
}

function NozzleTable({ nozzles, onEdit, onDelete }: { nozzles: NozzleView[]; onEdit: (nozzle: NozzleView) => void; onDelete: (id: string) => void }) {
  return (
    <TableWrapper>
      <table className="w-full border-collapse">
        <thead><tr className="text-left text-sm font-bold text-slate-900"><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Nozzle</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Tank</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Product</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Opening Meter</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3 text-right">Action</th></tr></thead>
        <tbody>
          {nozzles.map((nozzle) => <tr key={nozzle.id} className="border-t border-slate-200 odd:bg-white even:bg-slate-50 transition-colors hover:bg-amber-50/60"><td className="px-3 py-3 text-sm font-bold">{nozzle.name}</td><td className="px-3 py-3 text-sm">{nozzle.tank}</td><td className="px-3 py-3 text-sm">{nozzle.product}</td><td className="px-3 py-3 text-sm">{nozzle.openingMeter.toFixed(2)}</td><td className="px-3 py-3"><ActionButtons onEdit={() => onEdit(nozzle)} onDelete={() => onDelete(nozzle.id)} /></td></tr>)}
          {nozzles.length === 0 && <EmptyRow colSpan={5} />}
        </tbody>
      </table>
    </TableWrapper>
  );
}

function OilTab() {
  const [products, setProducts] = useState<OilProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<OilProduct | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      setProducts(await getOilProducts());
    } catch (err) {
      console.error("Oil products GET error:", err);
      setError("Unable to load oil products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const value = search.toLowerCase();
    return products.filter(
      (product) =>
        product.active &&
        (product.name.toLowerCase().includes(value) ||
          (product.code ?? "").toLowerCase().includes(value)),
    );
  }, [products, search]);

  const save = async (data: {
    name: string;
    code?: string;
    unit: OilProductUnit;
    currentPrice: number;
    minStock: number;
    active: boolean;
  }) => {
    try {
      const saved = editingProduct
        ? await updateOilProduct(editingProduct.id, data)
        : await createOilProduct(data);
      setProducts((prev) =>
        editingProduct
          ? prev.map((item) => (item.id === editingProduct.id ? saved : item))
          : [saved, ...prev],
      );
      setModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error("Oil product save error:", err);
      setError("Unable to save oil product.");
      throw err;
    }
  };

  return (
    <div className="mt-4 grid grid-cols-1 rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-[200px_1fr]">
      <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r md:p-6">
        <h3 className="mb-4 hidden text-base font-bold text-slate-900 md:block">Data Setup</h3>
        <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          <SideItem icon={Droplet} label="Oil Products" active onClick={() => undefined} />
        </div>
      </div>

      <div className="min-w-0 p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search oil products..." className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <button type="button" onClick={() => { setEditingProduct(null); setModalOpen(true); }} className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"><Plus size={16} />Add New</button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        {loading ? (
          <TableWrapper><div className="p-8 text-center text-sm text-slate-500">Loading oil products...</div></TableWrapper>
        ) : (
          <TableWrapper>
            <table className="w-full border-collapse">
              <thead><tr className="text-left text-sm font-bold text-slate-900"><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Oil Product Name</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Product SKU</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Price</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Minimum Stock</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Unit</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3 text-right">Action</th></tr></thead>
              <tbody>
                {filteredProducts.map((product) => <tr key={product.id} className="border-t border-slate-200 odd:bg-white even:bg-slate-50 transition-colors hover:bg-amber-50/60"><td className="px-3 py-3 text-sm font-bold">{product.name}</td><td className="px-3 py-3 text-sm">{product.code ?? "-"}</td><td className="px-3 py-3 text-sm">₹{Number(product.currentPrice).toFixed(2)}</td><td className="px-3 py-3 text-sm">{Number(product.minStock).toLocaleString()}</td><td className="px-3 py-3 text-sm">{product.unit}</td><td className="px-3 py-3"><ActionButtons onEdit={() => { setEditingProduct(product); setModalOpen(true); }} onDelete={async () => { try { await updateOilProductStatus(product.id, false); setProducts((prev) => prev.filter((item) => item.id !== product.id)); } catch (err) { console.error(err); setError("Unable to deactivate oil product."); } }} /></td></tr>)}
                {filteredProducts.length === 0 && <EmptyRow colSpan={6} />}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </div>

      {modalOpen && <OilProductModal title={editingProduct ? "Edit Oil Product" : "Add New Oil Product"} product={editingProduct} onClose={() => { setModalOpen(false); setEditingProduct(null); }} onSave={save} />}
    </div>
  );
}

type ExpenseType = {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function ExpenseTypesTab() {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpenseType, setEditingExpenseType] = useState<ExpenseType | null>(null);

  const loadExpenseTypes = async () => {
    try {
      setLoading(true); setError("");
      const data = await getResource<ExpenseType[]>("/expense-types");
      setExpenseTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Expense types GET error:", err);
      setError("Unable to load expense types.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadExpenseTypes(); }, []);

  const filteredExpenseTypes = useMemo(() => {
    const value = search.trim().toLowerCase();
    return expenseTypes.filter((item) => item.active && (!value || item.name.toLowerCase().includes(value)));
  }, [expenseTypes, search]);

  const saveExpenseType = async (name: string) => {
    setError("");
    if (editingExpenseType) {
      const saved = await updateResource<ExpenseType, { name: string }>(`/expense-types/${editingExpenseType.id}`, { name });
      setExpenseTypes((prev) => prev.map((item) => item.id === editingExpenseType.id ? saved : item));
    } else {
      const saved = await createResource<ExpenseType, { name: string }>("/expense-types", { name });
      setExpenseTypes((prev) => [saved, ...prev]);
    }
    setModalOpen(false); setEditingExpenseType(null);
  };

  const deactivateExpenseType = async (id: string) => {
    try {
      setError("");
      const saved = await updateResource<ExpenseType, { active: boolean }>(`/expense-types/${id}`, { active: false });
      setExpenseTypes((prev) => prev.map((item) => item.id === id ? saved : item));
    } catch (err) {
      console.error("Expense type deactivate error:", err);
      setError("Unable to deactivate expense type.");
    }
  };

  return (
    <div className="mt-4 grid grid-cols-1 rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-[200px_1fr]">
      <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r md:p-6">
        <h3 className="mb-4 hidden text-base font-bold text-slate-900 md:block">Data Setup</h3>
        <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          <SideItem icon={ReceiptText} label="Expense Types" active onClick={() => undefined} />
        </div>
      </div>
      <div className="min-w-0 p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expense types..." className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <button type="button" onClick={() => { setEditingExpenseType(null); setModalOpen(true); }} className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"><Plus size={16} />Add New</button>
        </div>
        {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {loading ? (
          <TableWrapper><div className="p-8 text-center text-sm text-slate-500">Loading expense types...</div></TableWrapper>
        ) : (
          <TableWrapper><table className="w-full border-collapse">
            <thead><tr className="text-left text-sm font-bold text-slate-900"><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Expense Type</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Status</th><th className="sticky top-0 z-10 w-32 bg-[#d9ad50] px-3 py-3 text-right">Action</th></tr></thead>
            <tbody>
              {filteredExpenseTypes.map((item) => <tr key={item.id} className="border-t border-slate-200 odd:bg-white even:bg-slate-50 transition-colors hover:bg-amber-50/60">
                <td className="px-3 py-3 text-sm font-bold text-slate-800">{item.name}</td>
                <td className="px-3 py-3 text-sm"><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span></td>
                <td className="px-3 py-3"><div className="flex justify-end gap-1.5">
                  <button type="button" title="Edit" onClick={() => { setEditingExpenseType(item); setModalOpen(true); }} className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-brand-600"><Pencil size={14} /></button>
                  <button type="button" title="Deactivate" onClick={() => void deactivateExpenseType(item.id)} className="rounded-md border border-red-100 bg-white p-2 text-red-500 transition hover:bg-red-50"><Trash2 size={14} /></button>
                </div></td>
              </tr>)}
              {filteredExpenseTypes.length === 0 && <EmptyRow colSpan={3} />}
            </tbody>
          </table></TableWrapper>
        )}
      </div>
      {modalOpen && <ExpenseTypeModal title={editingExpenseType ? "Edit Expense Type" : "Add New Expense Type"} expenseType={editingExpenseType} onClose={() => { setModalOpen(false); setEditingExpenseType(null); }} onSave={saveExpenseType} />}
    </div>
  );
}

function ExpenseTypeModal({ title, expenseType, onClose, onSave }: { title: string; expenseType: ExpenseType | null; onClose: () => void; onSave: (name: string) => Promise<void> }) {
  const [name, setName] = useState(expenseType?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    const value = name.trim();
    if (!value) { setError("Expense type name is required."); return; }
    try { setSaving(true); setError(""); await onSave(value); }
    catch (err) { console.error(err); setError("Unable to save expense type."); }
    finally { setSaving(false); }
  };
  return <Modal title={title} onClose={onClose}>
    {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
    <Field label="Expense Type Name" required value={name} onChange={setName} />
    <ModalFooter saving={saving} onCancel={onClose} onSave={submit} />
  </Modal>;
}

/* =========================================================
   VEHICLES
   Backend: /vehicles  (GET list, POST create, PATCH/PUT :id)
========================================================= */

type Vehicle = {
  id: string;
  vehicleNumber: string;
  vehicleType?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type VehiclePayload = {
  vehicleNumber: string;
  vehicleType?: string;
};

const VEHICLES_ENDPOINT = "/vehicles";

const apiErrorMessage = (err: unknown, fallback: string) => {
  const message = (err as { response?: { data?: { message?: unknown } } } | null)?.response?.data
    ?.message;
  return typeof message === "string" && message ? message : fallback;
};

function VehiclesTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getResource<Vehicle[]>(VEHICLES_ENDPOINT);
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Vehicles GET error:", err);
      setError(apiErrorMessage(err, "Unable to load vehicles."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    const value = search.trim().toLowerCase();
    return vehicles.filter(
      (item) =>
        item.active !== false &&
        (!value ||
          item.vehicleNumber.toLowerCase().includes(value) ||
          (item.vehicleType ?? "").toLowerCase().includes(value)),
    );
  }, [vehicles, search]);

  const saveVehicle = async (payload: VehiclePayload) => {
    setError("");
    if (editingVehicle) {
      const saved = await updateResource<Vehicle, VehiclePayload>(
        `${VEHICLES_ENDPOINT}/${editingVehicle.id}`,
        payload,
      );
      setVehicles((prev) => prev.map((item) => (item.id === editingVehicle.id ? saved : item)));
    } else {
      const saved = await createResource<Vehicle, VehiclePayload>(VEHICLES_ENDPOINT, payload);
      setVehicles((prev) => [saved, ...prev]);
    }
    setModalOpen(false);
    setEditingVehicle(null);
  };

  const deactivateVehicle = async (id: string) => {
    try {
      setError("");
      const saved = await updateResource<Vehicle, { active: boolean }>(
        `${VEHICLES_ENDPOINT}/${id}`,
        { active: false },
      );
      setVehicles((prev) => prev.map((item) => (item.id === id ? saved : item)));
    } catch (err) {
      console.error("Vehicle deactivate error:", err);
      setError(apiErrorMessage(err, "Unable to deactivate vehicle."));
    }
  };

  return (
    <div className="mt-4 grid grid-cols-1 rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-[200px_1fr]">
      <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r md:p-6">
        <h3 className="mb-4 hidden text-base font-bold text-slate-900 md:block">Data Setup</h3>
        <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          <SideItem icon={Truck} label="Vehicles" active onClick={() => undefined} />
        </div>
      </div>

      <div className="min-w-0 p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vehicles..." className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <button type="button" onClick={() => { setEditingVehicle(null); setModalOpen(true); }} className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"><Plus size={16} />Add New</button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        {loading ? (
          <TableWrapper><div className="p-8 text-center text-sm text-slate-500">Loading vehicles...</div></TableWrapper>
        ) : (
          <TableWrapper>
            <table className="w-full border-collapse">
              <thead><tr className="text-left text-sm font-bold text-slate-900"><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Vehicle Number</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Vehicle Type</th><th className="sticky top-0 z-10 bg-[#d9ad50] px-3 py-3">Status</th><th className="sticky top-0 z-10 w-32 bg-[#d9ad50] px-3 py-3 text-right">Action</th></tr></thead>
              <tbody>
                {filteredVehicles.map((item) => <tr key={item.id} className="border-t border-slate-200 odd:bg-white even:bg-slate-50 transition-colors hover:bg-amber-50/60">
                  <td className="px-3 py-3 text-sm font-bold text-slate-800">{item.vehicleNumber}</td>
                  <td className="px-3 py-3 text-sm">{item.vehicleType || "-"}</td>
                  <td className="px-3 py-3 text-sm"><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span></td>
                  <td className="px-3 py-3"><ActionButtons onEdit={() => { setEditingVehicle(item); setModalOpen(true); }} onDelete={() => void deactivateVehicle(item.id)} /></td>
                </tr>)}
                {filteredVehicles.length === 0 && <EmptyRow colSpan={4} />}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </div>

      {modalOpen && <VehicleModal title={editingVehicle ? "Edit Vehicle" : "Add New Vehicle"} vehicle={editingVehicle} onClose={() => { setModalOpen(false); setEditingVehicle(null); }} onSave={saveVehicle} />}
    </div>
  );
}

function VehicleModal({ title, vehicle, onClose, onSave }: { title: string; vehicle: Vehicle | null; onClose: () => void; onSave: (payload: VehiclePayload) => Promise<void> }) {
  const [vehicleNumber, setVehicleNumber] = useState(vehicle?.vehicleNumber ?? "");
  const [vehicleType, setVehicleType] = useState(vehicle?.vehicleType ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const number = vehicleNumber.trim().toUpperCase();
    if (!number) { setError("Vehicle number is required."); return; }
    try {
      setSaving(true);
      setError("");
      await onSave({ vehicleNumber: number, vehicleType: vehicleType.trim() || undefined });
    } catch (err) {
      console.error("Vehicle save error:", err);
      setError(apiErrorMessage(err, "Unable to save vehicle."));
    } finally {
      setSaving(false);
    }
  };

  return <Modal title={title} onClose={onClose}>
    {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      <Field label="Vehicle Number" required value={vehicleNumber} onChange={setVehicleNumber} />
      <Field label="Vehicle Type" value={vehicleType} onChange={setVehicleType} />
    </div>
    <ModalFooter saving={saving} onCancel={onClose} onSave={submit} />
  </Modal>;
}

function ProductModal({
  title,
  product,
  onClose,
  onSave,
}: {
  title: string;
  product: Product | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    code?: string;
    productType: ProductType;
    unit: ProductUnit;
    currentPrice: number;
    minStock: number;
    active: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [code, setCode] = useState(product?.code ?? "");
  const [productType, setProductType] = useState<ProductType>(product?.productType ?? "PETROL");
  const [unit, setUnit] = useState<ProductUnit>(product?.unit ?? "LITRE");
  const [price, setPrice] = useState(product ? String(product.currentPrice) : "");
  const [minStock, setMinStock] = useState(product ? String(product.minStock) : "500");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !price || Number(price) < 0) return;
    try {
      setSaving(true);
      await onSave({ name: name.trim(), code: code.trim() || undefined, productType, unit, currentPrice: Number(price), minStock: Number(minStock || 0), active: product?.active ?? true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <Field label="Product Name" required value={name} onChange={setName} />
        <Field label="Product SKU" value={code} onChange={setCode} />
        <SelectField label="Product Type" value={productType} options={["PETROL", "DIESEL", "OIL", "OTHER"]} onChange={(value) => setProductType(value as ProductType)} />
        <SelectField label="Unit" value={unit} options={["LITRE", "PIECE", "BOTTLE"]} onChange={(value) => setUnit(value as ProductUnit)} />
        <Field label="Unit Price" required type="number" value={price} onChange={setPrice} />
        <Field label="Minimum Stock" type="number" value={minStock} onChange={setMinStock} />
      </div>
      <ModalFooter saving={saving} onCancel={onClose} onSave={submit} />
    </Modal>
  );
}

function TankModal({
  title,
  tank,
  products,
  onClose,
  onSave,
}: {
  title: string;
  tank: TankView | null;
  products: Product[];
  onClose: () => void;
  onSave: (tank: TankView) => Promise<void>;
}) {
  const [name, setName] = useState(tank?.name ?? "");
  const [productId, setProductId] = useState(tank?.productId ?? products[0]?.id ?? "");
  const [capacity, setCapacity] = useState(tank ? String(tank.capacity) : "");
  const [minimum, setMinimum] = useState(tank ? String(tank.minimum) : "");
  const [available, setAvailable] = useState(tank ? String(tank.available) : "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !productId || !capacity) return;
    const selectedProduct = products.find((item) => item.id === productId);
    try {
      setSaving(true);
      await onSave({ id: tank?.id ?? "", name: name.trim(), productId, product: selectedProduct?.name ?? "", capacity: Number(capacity), minimum: Number(minimum || 0), available: Number(available || 0), active: tank?.active ?? true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <Field label="Tank Name" required value={name} onChange={setName} />
        <SelectField label="Product" value={productId} options={products.map((item) => ({ label: item.name, value: item.id }))} onChange={setProductId} />
        <Field label="Capacity" required type="number" value={capacity} onChange={setCapacity} />
        <Field label="Minimum Level" type="number" value={minimum} onChange={setMinimum} />
        <Field label="Available Stock" type="number" value={available} onChange={setAvailable} />
      </div>
      <ModalFooter saving={saving} onCancel={onClose} onSave={submit} />
    </Modal>
  );
}

function NozzleModal({
  title,
  nozzle,
  tanks,
  onClose,
  onSave,
}: {
  title: string;
  nozzle: NozzleView | null;
  tanks: TankView[];
  onClose: () => void;
  onSave: (nozzle: NozzleView) => Promise<void>;
}) {
  const [name, setName] = useState(nozzle?.name ?? "");
  const [tankId, setTankId] = useState(nozzle?.tankId ?? tanks[0]?.id ?? "");
  const [openingMeter, setOpeningMeter] = useState(nozzle ? String(nozzle.openingMeter) : "");
  const [currentMeter, setCurrentMeter] = useState(nozzle ? String(nozzle.currentMeter) : "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !tankId) return;
    const selectedTank = tanks.find((item) => item.id === tankId);
    try {
      setSaving(true);
      await onSave({ id: nozzle?.id ?? "", name: name.trim(), tankId, tank: selectedTank?.name ?? "", product: selectedTank?.product ?? "", openingMeter: Number(openingMeter || 0), currentMeter: Number(currentMeter || openingMeter || 0), active: nozzle?.active ?? true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <Field label="Nozzle Name" required value={name} onChange={setName} />
        <SelectField label="Tank" value={tankId} options={tanks.map((item) => ({ label: item.name, value: item.id }))} onChange={setTankId} />
        <Field label="Opening Meter" type="number" value={openingMeter} onChange={setOpeningMeter} />
        <Field label="Current Meter" type="number" value={currentMeter} onChange={setCurrentMeter} />
      </div>
      <ModalFooter saving={saving} onCancel={onClose} onSave={submit} />
    </Modal>
  );
}

function OilProductModal({
  title,
  product,
  onClose,
  onSave,
}: {
  title: string;
  product: OilProduct | null;
  onClose: () => void;
  onSave: (product: {
    name: string;
    code?: string;
    unit: OilProductUnit;
    currentPrice: number;
    minStock: number;
    active: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [code, setCode] = useState(product?.code ?? "");
  const [unit, setUnit] = useState<OilProductUnit>((product?.unit as OilProductUnit) ?? "PIECE");
  const [price, setPrice] = useState(product ? String(product.currentPrice) : "");
  const [minStock, setMinStock] = useState(product ? String(product.minStock) : "0");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !price || Number(price) < 0) return;
    try {
      setSaving(true);
      await onSave({ name: name.trim(), code: code.trim() || undefined, unit, currentPrice: Number(price), minStock: Number(minStock || 0), active: product?.active ?? true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <Field label="Product Name" required value={name} onChange={setName} />
        <Field label="Product Code / SKU" value={code} onChange={setCode} />
        <SelectField label="Unit" value={unit} options={["LITRE", "PIECE", "BOTTLE"]} onChange={(value) => setUnit(value as OilProductUnit)} />
        <Field label="Unit Price" required type="number" value={price} onChange={setPrice} />
        <Field label="Minimum Stock" type="number" value={minStock} onChange={setMinStock} />
      </div>
      <p className="mt-4 text-xs text-slate-400">Oil quantity is tracked through inventory transactions. This master form stores the minimum-stock threshold.</p>
      <ModalFooter saving={saving} onCancel={onClose} onSave={submit} />
    </Modal>
  );
}

function SideItem({ icon: Icon, label, active, onClick }: { icon: ComponentType<{ size?: number }>; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2.5 text-left text-sm transition md:w-full ${active ? "bg-slate-100 font-semibold text-brand-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
      <Icon size={16} /> {label}
    </button>
  );
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1.5">
      <button type="button" onClick={onEdit} title="Edit" className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-brand-600"><Pencil size={14} /></button>
      <button type="button" onClick={onDelete} title="Delete" className="rounded-md border border-red-100 bg-white p-2 text-red-500 transition hover:bg-red-50"><Trash2 size={14} /></button>
    </div>
  );
}

function Toggle({ label, checked, editable = false, subtle = false, onChange }: { label: string; checked: boolean; editable?: boolean; subtle?: boolean; onChange?: () => void }) {
  return <div className="flex items-center justify-between gap-3 py-1"><span className={subtle ? "text-sm text-slate-600" : "text-sm font-medium text-slate-800"}>{label}</span><button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={!editable} onClick={editable ? onChange : undefined} className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-brand-600" : "bg-slate-300"} ${editable ? "cursor-pointer" : "cursor-default"}`}><span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-1"}`} /></button></div>;
}

function TableWrapper({ children }: { children: ReactNode }) {
  return <div className="max-h-[560px] overflow-auto rounded-lg border border-[#c99f43]">{children}</div>;
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-slate-400"><div className="flex flex-col items-center gap-2"><Search size={20} className="text-slate-300" /><span>No records found.</span></div></td></tr>;
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return <div onClick={onClose} className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity duration-150 ${visible ? "opacity-100" : "opacity-0"}`}><div onClick={(event) => event.stopPropagation()} className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl transition-all duration-150 ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}><div className="flex items-center justify-between border-b border-slate-200 px-6 py-4"><h2 className="text-lg font-semibold text-slate-900">{title}</h2><button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div><div className="p-6">{children}</div></div></div>;
}

function ModalFooter({ onCancel, onSave, saving = false }: { onCancel: () => void; onSave: () => void; saving?: boolean }) {
  return <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm text-slate-700">Cancel</button><button type="button" onClick={onSave} disabled={saving} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>;
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-600">{required && <span className="mr-1 text-red-500">*</span>}{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" /></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[] | SelectOption[]; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">{options.map((option) => typeof option === "string" ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}