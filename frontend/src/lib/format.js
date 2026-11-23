const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export const money = (value) => (value === null || value === undefined || value === "" ? null : `₹${inr.format(Number(value))}`);

export const number = (value) => (value === null || value === undefined || value === "" ? "—" : inr.format(Number(value)));

export function budget(min, max) {
  const a = money(min);
  const b = money(max);
  if (a && b) return a === b ? a : `${a} – ${b}`;
  if (b) return `Up to ${b}`;
  if (a) return `From ${a}`;
  return "Open to offers";
}

export function date(value, opts = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", opts);
}

export function ago(value) {
  if (!value) return "";
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return date(value, { day: "numeric", month: "short" });
}

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

// Short readable reference for ObjectIds / numbers
export const ref = (id) => (id ? String(id).slice(-6).toUpperCase() : "");
