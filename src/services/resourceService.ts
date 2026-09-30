
import { api, apiGet } from "./api";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getResource = async <T>(endpoint: string): Promise<T> => {
  const response = await apiGet<ApiEnvelope<T> | T>(endpoint);
  if (response && typeof response === "object" && "data" in response && "success" in response) {
    return (response as ApiEnvelope<T>).data;
  }
  return response as T;
};

export const createResource = async <T, B>(endpoint: string, body: B): Promise<T> => {
  const response = await api.post<ApiEnvelope<T> | T>(endpoint, body);
  const data = response.data;
  if (data && typeof data === "object" && "data" in data && "success" in data) {
    return (data as ApiEnvelope<T>).data;
  }
  return data as T;
};

export const updateResource = async <T, B>(endpoint: string, body: B): Promise<T> => {
  const response = await api.patch<ApiEnvelope<T> | T>(endpoint, body);
  const data = response.data;
  if (data && typeof data === "object" && "data" in data && "success" in data) {
    return (data as ApiEnvelope<T>).data;
  }
  return data as T;
};
