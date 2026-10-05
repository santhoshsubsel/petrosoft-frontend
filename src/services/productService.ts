import {
  apiGet,
  apiPost,
  apiPatch,
} from "./api";

export type ProductType =
  | "PETROL"
  | "DIESEL"
  | "OIL"
  | "WATER"
  | "OTHER";

export type ProductUnit =
  | "LITRE"
  | "PIECE"
  | "BOTTLE";

export interface Product {
  id: string;
  name: string;
  code: string | null;
  productType: ProductType;
  unit: ProductUnit;
  currentPrice: number | string;
  minStock: number | string;
  active: boolean;
}

export interface CreateProductInput {
  name: string;
  code?: string;
  productType: ProductType;
  unit: ProductUnit;
  currentPrice: number;
  minStock: number;
  active: boolean;
}

export interface UpdateProductInput {
  name?: string;
  code?: string;
  productType?: ProductType;
  unit?: ProductUnit;
  currentPrice?: number;
  minStock?: number;
  active?: boolean;
}

// GET /products
export const getProducts = async (): Promise<Product[]> => {
  const response = await apiGet<{
    success: boolean;
    data: Product[];
  }>("/products");

  return response.data;
};

// POST /products
export const createProduct = async (
  data: CreateProductInput
): Promise<Product> => {
  const response = await apiPost<
    {
      success: boolean;
      data: Product;
    },
    CreateProductInput
  >("/products", data);

  return response.data;
};

// PATCH /products/:id
export const updateProduct = async (
  id: string,
  data: UpdateProductInput
): Promise<Product> => {
  const response = await apiPatch<
    {
      success: boolean;
      data: Product;
    },
    UpdateProductInput
  >(`/products/${id}`, data);

  return response.data;
};

// PATCH /products/:id/status
export const updateProductStatus = async (
  id: string,
  active: boolean
): Promise<Product> => {
  const response = await apiPatch<
    {
      success: boolean;
      data: Product;
    },
    { active: boolean }
  >(`/products/${id}/status`, {
    active,
  });

  return response.data;
};