import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export default function PageHeader({ title, subtitle, action, onAction, actionIcon = true, children }: { title: string; subtitle?: string; action?: string; onAction?: () => void; actionIcon?: boolean; children?: ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0"><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>{subtitle && <p className="mt-1 text-xs leading-5 text-slate-400">{subtitle}</p>}</div>
    <div className="flex items-center gap-2">{children}{action && <button type="button" onClick={onAction} className="btn-primary">{actionIcon && <Plus size={16}/>} {action}</button>}</div>
  </div>;
}
