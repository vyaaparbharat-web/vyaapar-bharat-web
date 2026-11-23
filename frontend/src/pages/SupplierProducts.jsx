import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Pencil, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/ToastContext";
import { money, number } from "../lib/format";
import { Badge, Confirm, EmptyState, ErrorState, Img, PageHeader, PageLoader } from "../components/ui";

export default function SupplierProducts() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/api/supplier/products");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const products = data?.products || [];

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
        title="My products"
        description="Products listed under your company. Buyers see them on the marketplace and your profile."
        actions={
          <Link to="/supplier/products/new" className="btn btn-primary">
            Add product
          </Link>
        }
      />
      <div className="panel overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <PageLoader />
        ) : products.length === 0 ? (
          <EmptyState icon={Package} title="No products yet" action={<Link to="/supplier/products/new" className="btn btn-primary">Add your first product</Link>}>
            Listed products help buyers find you before they post a requirement.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {products.map((p) => (
              <li key={p.id} className="flex items-center gap-4 p-4">
                <Img src={p.image_url} alt="" className="h-16 w-20 shrink-0 rounded-[10px]" />
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${p.id}`} className="font-semibold hover:text-neel-700">
                    {p.name}
                  </Link>
                  <div className="text-[13px] text-muted">{p.category || "No category"}</div>
                  <div className="num mt-1 text-[13.5px]">
                    {money(p.price) ? `${money(p.price)}${p.price_unit ? ` / ${p.price_unit}` : ""}` : "Ask for price"}
                    {p.moq ? <span className="text-muted">, min. {number(p.moq)} {p.moq_unit}</span> : null}
                  </div>
                </div>
                <Badge tone={p.availability === "Out of Stock" ? "bad" : p.availability === "Available" ? "ok" : "warn"}>{p.availability}</Badge>
                <div className="flex gap-1">
                  <Link to={`/supplier/products/${p.id}/edit`} className="btn btn-ghost btn-sm !px-2" aria-label={`Edit ${p.name}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button className="btn btn-ghost btn-sm !px-2 text-bad" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Confirm open={Boolean(deleting)} title={`Delete ${deleting?.name}?`} confirmLabel="Delete product" busy={busy} onConfirm={remove} onCancel={() => setDeleting(null)}>
        It will be removed from the marketplace.
      </Confirm>
    </>
  );
}
