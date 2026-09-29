import { useEffect, useMemo, useState } from "react";
import GenericPage from "../components/common/GenericPage";
import SearchToolbar from "../components/common/SearchToolbar";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import StatusBadge from "../components/common/StatusBadge";
import { endpoints, resource } from "../services/resourceService";
import type { Product } from "../types";
import { money, number } from "../utils/format";

export default function Products() { const [rows,setRows]=useState<Product[]>([]); const [q,setQ]=useState(""); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const load=async()=>{try{setLoading(true);setError("");setRows(await resource.list<Product>(endpoints.products));}catch(e:any){setError(e.response?.data?.message||"Unable to load products.");}finally{setLoading(false);}}; useEffect(()=>{load();},[]); const filtered=useMemo(()=>rows.filter(r=>`${r.name} ${r.productType||""}`.toLowerCase().includes(q.toLowerCase())),[rows,q]); return <GenericPage title="Product & Stock" subtitle="View fuel and oil products, current pricing and stock from the backend." action="Refresh" onAction={load} toolbar={<SearchToolbar value={q} onChange={setQ} placeholder="Search product or type..."/>}>{loading?<LoadingState/>:error?<ErrorState message={error} onRetry={load}/>:<div className="table-shell overflow-x-auto"><table className="table-base min-w-[720px]"><thead><tr><th>Product</th><th>Type</th><th>Price</th><th>Available Stock</th><th>Status</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td className="font-semibold">{p.name}</td><td>{p.productType||"—"}</td><td>{money(p.currentPrice??p.price)}</td><td>{number(p.availableStock??p.quantity)}</td><td><StatusBadge status={p.active===false?"INACTIVE":"ACTIVE"}/></td></tr>)}{filtered.length===0&&<tr><td colSpan={5} className="p-8 text-center text-sm text-slate-400">No products found.</td></tr>}</tbody></table></div>}</GenericPage>; }
