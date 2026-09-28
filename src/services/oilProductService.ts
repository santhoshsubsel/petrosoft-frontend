import { api } from "./api";
export type OilProductUnit = "LITRE" | "PIECE" | "BOTTLE";

export interface OilProduct {
  id: string;
  accountId: string;
  name: string;
  code: string | null;
  productType: "OIL";
  unit: "LITRE" | "PIECE" | "BOTTLE";
  currentPrice: number | string;
  minStock: number | string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOilProductPayload {
  name: string;
  code?: string;
  unit: "LITRE" | "PIECE" | "BOTTLE";
  currentPrice: number;
  minStock: number;
  active?: boolean;
}

export interface UpdateOilProductPayload {
  name?: string;
  code?: string;
  unit?: "LITRE" | "PIECE" | "BOTTLE";
  currentPrice?: number;
  minStock?: number;
  active?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const getOilProducts = async (): Promise<OilProduct[]> => {
  const response = await api.get<ApiResponse<OilProduct[]>>(
    "/oil-products"
  );

  return response.data.data;
};

export const getOilProduct = async (
  id: string
): Promise<OilProduct> => {
  const response = await api.get<ApiResponse<OilProduct>>(
    `/oil-products/${id}`
  );

  return response.data.data;
};

export const createOilProduct = async (
  data: CreateOilProductPayload
): Promise<OilProduct> => {
  const response = await api.post<ApiResponse<OilProduct>>(
    "/oil-products",
    {
      ...data,
      active: data.active ?? true,
    }
  );

  return response.data.data;
};

export const updateOilProduct = async (
  id: string,
  data: UpdateOilProductPayload
): Promise<OilProduct> => {
  const response = await api.patch<ApiResponse<OilProduct>>(
    `/oil-products/${id}`,
    data
  );

  return response.data.data;
};

export const updateOilProductStatus = async (
  id: string,
  active: boolean
): Promise<OilProduct> => {
  const response = await api.patch<ApiResponse<OilProduct>>(
    `/oil-products/${id}/status`,
    {
      active,
    }
  );

  return response.data.data;
};