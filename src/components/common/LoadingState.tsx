import { Loader2 } from "lucide-react";
export default function LoadingState({ label = "Loading data..." }: { label?: string }) { return <div className="card grid min-h-48 place-items-center p-8"><div className="flex items-center gap-2 text-sm font-medium text-slate-500"><Loader2 className="animate-spin" size={18}/>{label}</div></div>; }
