import type { ReactNode } from "react";
import PageHeader from "./PageHeader";
export default function GenericPage({ title, subtitle, action, onAction, children, toolbar }: { title: string; subtitle?: string; action?: string; onAction?: () => void; children?: ReactNode; toolbar?: ReactNode }) { return <div className="space-y-5"><PageHeader title={title} subtitle={subtitle} action={action} onAction={onAction}/>{toolbar}{children}</div>; }
