import { api } from "./api";

export interface Nozzle {
  id: string;
  name: string;
  tankId: string;
  tank?: {
    id: string;
    name: string;
  };
  openingMeter: number;
  currentMeter: number;
  active: boolean;
}

export interface CreateNozzlePayload {
  name: string;
  tankId: string;
  openingMeter: number;
  currentMeter?: number;
}

export interface UpdateNozzlePayload {
  name: string;
  tankId: string;
  openingMeter: number;
  currentMeter?: number;
}

export async function getNozzles(): Promise<Nozzle[]> {
  const response = await api.get("/nozzles");

  return response.data.data ?? response.data;
}

export async function createNozzle(
  data: CreateNozzlePayload
): Promise<Nozzle> {
  const response = await api.post("/nozzles", data);

  return response.data.data ?? response.data;
}

export async function updateNozzle(
  id: string,
  data: UpdateNozzlePayload
): Promise<Nozzle> {
  const response = await api.put(`/nozzles/${id}`, data);

  return response.data.data ?? response.data;
}

export async function updateNozzleStatus(
  id: string,
  active: boolean
): Promise<Nozzle> {
  const response = await api.patch(`/nozzles/${id}/status`, {
    active,
  });

  return response.data.data ?? response.data;
}