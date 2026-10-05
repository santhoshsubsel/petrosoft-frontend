import { api } from "./api";
import type { Nozzle } from "./nozzleService";
import type { Product } from "./productService";
import type { Tank } from "./tankService";

export interface DailySalesRecord {
  id: string;
  name?: string;
  businessDate: string;
  status: string;
  totalAmount?: number | string;
}

export interface AddStockInput {
  productId: string;
  tankId: string;
  beforeDipping: number;
  quantity: number;
  reference?: string;
  comments?: string;
}

export interface CreditSaleInput {
  dailySalesId: string;
  customerId: string;
  productId: string;
  quantity: number;
  invoiceNumber?: string;
  comments?: string;
}

export interface ExpenseInput {
  dailySalesId: string;
  expenseTypeId: string;
  amount: number;
  comment?: string;
  expenseDate: string;
}

export async function getManagerProducts(): Promise<Product[]> {
  const response = await api.get("/products");
  return response.data.data ?? response.data;
}

export async function getManagerTanks(): Promise<Tank[]> {
  const response = await api.get("/tanks");
  return response.data.data ?? response.data;
}

export async function getManagerNozzles(): Promise<Nozzle[]> {
  const response = await api.get("/nozzles");
  return response.data.data ?? response.data;
}

export async function getActiveDailySales(): Promise<DailySalesRecord[]> {
  const response = await api.get("/daily-sales");
  const data = response.data.data ?? response.data;
  return Array.isArray(data) ? data : [];
}

export async function addManagerStock(input: AddStockInput) {
  const response = await api.post(`/tanks/${input.tankId}/stock-in`, {
    quantity: input.quantity,
    reference: input.reference,
    comments: input.comments,
    beforeDipping: input.beforeDipping,
    productId: input.productId,
  });
  return response.data.data ?? response.data;
}

export async function createMeterSale(input: {
  dailySalesId: string;
  nozzleId: string;
  currentMeter: number;
}) {
  const response = await api.post(`/daily-sales/${input.dailySalesId}/meter-sale`, {
    nozzleId: input.nozzleId,
    currentMeter: input.currentMeter,
  });
  return response.data.data ?? response.data;
}

export async function createCreditSale(input: CreditSaleInput) {
  const response = await api.post("/credits", input);
  return response.data.data ?? response.data;
}

export async function createExpense(input: ExpenseInput) {
  const response = await api.post("/expenses", input);
  return response.data.data ?? response.data;
}

export async function getExpenseTypes() {
  const response = await api.get("/expense-types");
  return response.data.data ?? response.data;
}
export async function createSampleReading(payload: {
  dailySalesId: string;
  readings: Array<{
    nozzleId: string;
    quantity: number;
    notes?: string;
  }>;
}) {
  // POST /api/v1/inventory/sample-readings
  const { data } = await api.post(
    "/inventory/sample-readings",
    payload
  );
  return data;
}

export async function createVehicleStock(payload: {
  vehicleId: string;
  productId: string;
  tankId: string;
  newStock: number;
  notes?: string;
}) {
  // POST /api/v1/inventory/vehicle-stock
  const { data } = await api.post(
    "/inventory/vehicle-stock",
    payload
  );
  return data;
}