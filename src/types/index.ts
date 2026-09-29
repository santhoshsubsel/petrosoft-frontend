export type Role = 'ADMIN' | 'MANAGER';
export type Status = 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'PAID';
export interface User { name:string; email:string; role:Role; }
export interface Product { id:string; name:string; price:number; qty:number; value:number; type:'Fuel'|'Oil'; }
export interface Tank { name:string; product:string; capacity:number; min:number; available:number; percent:number; }
