import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/ToastContext";
import { money } from "../lib/format";
import AdminTable from "../components/AdminTable";
import { Badge, Confirm, Img, PageHeader } from "../components/ui";

export default function AdminProducts() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/api/products");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = data?.products || [];
  const categories = [...new Set(rows.map((p) => p.category).filter(Boolean))].sort();

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/products/${deleting.id}`, { method: "DELETE" });
      toast("Product deleted");
      setDeleting(null);
      reload();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        actions={
          <Link to="/admin/products/add" className="btn btn-primary">
            Add product
          </Link>
        }
      />
      <AdminTable
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        placeholder="Search product or company"
        searchKeys={["name", "supplier_name", "category", "subcategory"]}
        filters={[{ key: "category", label: "Category", options: categories.map((c) => ({ value: c, label: c })), match: (p, v) => p.category === v }]}
        columns={[
          {
            key: "name",
            label: "Product",
            render: (p) => (
              <div className="flex items-center gap-3">
                <Img src={p.image_url} alt="" className="h-10 w-12 shrink-0 rounded-md" />
                <Link to={`/products/${p.id}`} className="font-semibold hover:text-neel-700">
                  {p.name}
                </Link>
              </div>
            ),
          },
          { key: "supplier_name", label: "Company" },
          { key: "category", label: "Category" },
          { key: "price", label: "Price", className: "num whitespace-nowrap", render: (p) => (money(p.price) ? `${money(p.price)}${p.price_unit ? ` / ${p.price_unit}` : ""}` : "On request") },
          { key: "availability", label: "Stock", render: (p) => <Badge tone={p.availability === "Out of Stock" ? "bad" : p.availability === "Available" ? "ok" : "warn"}>{p.availability}</Badge> },
          {
            key: "actions",
            label: "",
            className: "whitespace-nowrap",
            render: (p) => (
              <>
                <Link to={`/admin/products/${p.id}/edit`} className="btn btn-ghost btn-sm !px-2" aria-label="Edit product">
                  <Pencil className="h-4 w-4" />
                </Link>
                <button className="btn btn-ghost btn-sm !px-2 text-bad" onClick={() => setDeleting(p)} aria-label="Delete product">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ),
          },
        ]}
      />
      <Confirm open={Boolean(deleting)} title={`Delete ${deleting?.name}?`} confirmLabel="Delete product" busy={busy} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </>
  );
}
