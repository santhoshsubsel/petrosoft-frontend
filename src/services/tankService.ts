import { api } from "./api";

export interface Tank {
  id: string;
  name: string;
  productId: string;
  capacity: number;
  minCapacity: number;
  availableStock: number;
  active: boolean;
  product?: {
    id: string;
    name: string;
    code?: string | null;
  };
}

export interface CreateTankPayload {
  name: string;
  productId: string;
  capacity: number;
  minCapacity: number;
  availableStock?: number;
  active?: boolean;
}

export interface UpdateTankPayload {
  name?: string;
  productId?: string;
  capacity?: number;
  minCapacity?: number;
  availableStock?: number;
  active?: boolean;
}

export interface AddTankStockPayload {
  quantity: number;
  reference?: string;
  comments?: string;
}

export async function getTanks(): Promise<Tank[]> {
  const response = await api.get("/tanks");

  return response.data.data ?? response.data;
}

export async function createTank(
  data: CreateTankPayload
): Promise<Tank> {
  const response = await api.post("/tanks", data);

  return response.data.data ?? response.data;
}

export async function updateTank(
  id: string,
  data: UpdateTankPayload
): Promise<Tank> {
  const response = await api.put(`/tanks/${id}`, data);

  return response.data.data ?? response.data;
}

export async function updateTankStatus(
  id: string,
  active: boolean
): Promise<Tank> {
  const response = await api.patch(
    `/tanks/${id}/status`,
    { active }
  );

  return response.data.data ?? response.data;
}

export async function addTankStock(
  tankId: string,
  data: AddTankStockPayload
): Promise<Tank> {
  const response = await api.post(
    `/tanks/${tankId}/stock-in`,
    data
  );

  return response.data.data ?? response.data;
}