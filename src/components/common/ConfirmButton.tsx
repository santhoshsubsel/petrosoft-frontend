import type { ReactNode } from "react";
export default function ConfirmButton({ children, onConfirm, disabled = false }: { children: ReactNode; onConfirm: () => void; disabled?: boolean }) { return <button type="button" disabled={disabled} onClick={() => { if (window.confirm("Are you sure you want to continue?")) onConfirm(); }} className="btn-secondary disabled:opacity-50">{children}</button>; }
