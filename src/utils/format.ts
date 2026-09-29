export const money = (value: unknown) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const number = (value: unknown) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const dateText = (value?: string) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const pick = (obj: any, keys: string[], fallback: any = "") => keys.reduce((found, key) => found !== undefined && found !== null ? found : obj?.[key], undefined) ?? fallback;
