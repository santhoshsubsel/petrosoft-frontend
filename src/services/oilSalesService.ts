import { api } from "./api";

export type PaymentMethod =
  | "CASH"
  | "PAYTM"
  | "CCMS_HP_PAY"
  | "BANK_TRANSFER"
  | "UPI"
  | "CARD"
  | "OTHER";

export interface OilSaleLineInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface CreateOilSaleInput {
  dailySalesId: string;
  invoiceNumber: string;
  customerId?: string | null;
  discount: number;
  paymentMethod: PaymentMethod;
  lines: OilSaleLineInput[];
}

export interface OilInvoiceLine {
  id: string;
  productId: string;
  product?: { id: string; name: string; code?: string | null };
  unitPrice: number | string;
  quantity: number | string;
  discount: number | string;
  totalAmount: number | string;
}

export interface OilInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  subtotal: number | string;
  discount: number | string;
  totalAmount: number | string;
  paymentMethod: PaymentMethod;
  status: string;
  lines: OilInvoiceLine[];
}

export async function getOilInvoices(): Promise<OilInvoice[]> {
  const response = await api.get("/oil-sales");
  const data = response.data.data ?? response.data;
  return Array.isArray(data) ? data : [];
}

export async function createOilSale(input: CreateOilSaleInput): Promise<OilInvoice> {
  const response = await api.post("/oil-sales", input);
  return response.data.data ?? response.data;
}

export async function downloadOilInvoice(invoiceId: string): Promise<Blob> {
  const response = await api.get(`/oil-sales/${invoiceId}/invoice`, {
    responseType: "blob",
  });
  return response.data;
}
