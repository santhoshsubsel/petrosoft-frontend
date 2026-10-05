export type Role = 'ADMIN' | 'MANAGER';
export type Status = 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'PAID';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: Role;
  permissions?: string[];
}

export interface Product {
  id: string;
  name: string;
  code?: string | null;
  currentPrice?: number | string;
  price?: number;
  minStock?: number | string;
  unit?: string;
  productType?: string;
  active?: boolean;
  qty?: number;
  value?: number;
  type?: 'Fuel' | 'Oil';
}

export interface Tank {
  id?: string;
  name: string;
  product?: string | { id?: string; name?: string };
  capacity: number | string;
  min?: number | string;
  minCapacity?: number | string;
  available: number | string;
  availableStock?: number | string;
  percent?: number;
  active?: boolean;
}
