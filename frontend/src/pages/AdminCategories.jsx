import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, PackagePlus, Search, X, EyeOff } from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/ToastContext";
import { categoryImage } from "../lib/categories";
import AdminTable from "../components/AdminTable";
import ImageUpload from "../components/ImageUpload";
import { Badge, Confirm, Field, FormError, Img, PageHeader, Spinner } from "../components/ui";

const EMPTY = { name: "", nameHi: "", description: "", imageUrl: null, sortOrder: "", isActive: true };
const toForm = (c) => ({
  name: c.name || "",
  nameHi: c.name_hi || "",
  description: c.description || "",
  imageUrl: c.image_url || null,
  sortOrder: c.sort_order ?? "",
  isActive: c.is_active !== false,
});

// ---------- add / edit ----------
function CategoryForm({ editing, onSaved, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState(() => (editing ? toForm(editing) : EMPTY));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (e) => {
    setError("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Category name is required.");
    setBusy(true);
    try {
      const data = await api(editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories", {
        method: editing ? "PUT" : "POST",
        body: form,
      });
      toast(data.message || (editing ? "Category saved" : "Category added"));
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="panel mb-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[18px] font-bold">{editing ? `Edit ${editing.name}` : "New category"}</h2>
        <button type="button" onClick={onCancel} className="rounded-md p-1.5 text-muted hover:bg-page hover:text-ink" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="cat-name" hint={editing ? "Renaming also updates every product and requirement in it." : undefined}>
            <input id="cat-name" name="name" className="input" value={form.name} onChange={set} placeholder="e.g. Tyres" autoFocus />
          </Field>
          <Field label="Hindi name" htmlFor="cat-hi" optional>
            <input id="cat-hi" name="nameHi" lang="hi" className="input deva" value={form.nameHi} onChange={set} placeholder="टायर" />
          </Field>
          <Field label="Short description" htmlFor="cat-desc" optional>
            <textarea id="cat-desc" name="description" rows={3} className="input !h-auto py-2.5" value={form.description} onChange={set} />
          </Field>
          <div className="grid content-start gap-5">
            <Field label="Order" htmlFor="cat-order" optional hint="Lower numbers show first. The home page shows the first 9.">
              <input id="cat-order" name="sortOrder" type="number" inputMode="numeric" className="input num" value={form.sortOrder} onChange={set} placeholder="100" />
            </Field>
            <label className="flex items-center gap-2.5 text-[14.5px]">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={set} className="h-4 w-4 accent-neel-700" />
              Show on the website
            </label>
          </div>
        </div>
        <Field label="Picture" optional hint="Wide photos look best.">
          <ImageUpload endpoint="/api/admin/categories/upload-image" value={form.imageUrl} onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))} label="Add picture" />
        </Field>
      </div>
      <FormError>{error}</FormError>
      <div className="mt-5 flex gap-2">
        <button className="btn btn-primary" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />} {editing ? "Save category" : "Add category"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------- pick products to put in a category ----------
function AssignProducts({ category, onDone, onClose }) {
  const toast = useToast();
  const { data, loading } = useApi("/api/products");
  const [q, setQ] = useState("");
  const [onlyOthers, setOnlyOthers] = useState(true);
  const [picked, setPicked] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.products || []).filter((p) => {
      if (onlyOthers && p.category === category.name) return false;
      if (!term) return true;
      return [p.name, p.supplier_name, p.category].some((v) => v && v.toLowerCase().includes(term));
    });
  }, [data, q, onlyOthers, category.name]);

  const toggle = (id) =>
    setPicked((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const save = async () => {
    setBusy(true);
    try {
      const res = await api("/api/admin/products/category", { method: "PATCH", body: { productIds: [...picked], category: category.name } });
      toast(res.message || `Moved to ${category.name}`);
      onDone();
    } catch (err) {
      toast(err.message, "error");
      setBusy(false);
    }
  };

  return (
    <div className="panel mb-6 overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-line p-5">
        <div>
          <h2 className="text-[18px] font-bold">Add products to {category.name}</h2>
          <p className="mt-0.5 text-[14px] text-muted">Tick the products that belong here. They'll move out of their current category.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-page hover:text-ink" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input className="input !h-10 pl-9" placeholder="Search product or company" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 px-1 text-[14px]">
          <input type="checkbox" checked={onlyOthers} onChange={(e) => setOnlyOthers(e.target.checked)} className="h-4 w-4 accent-neel-700" />
          Hide products already in {category.name}
        </label>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {loading ? (
          <div className="grid place-items-center p-8">
            <Spinner />
          </div>
        ) : list.length === 0 ? (
          <p className="p-6 text-center text-[14px] text-muted">No products to show.</p>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-page/60">
                  <input type="checkbox" checked={picked.has(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4 shrink-0 accent-neel-700" />
                  <Img src={p.image_url} alt="" className="h-9 w-11 shrink-0 rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold">{p.name}</span>
                    <span className="block truncate text-[12.5px] text-muted">{p.supplier_name}</span>
                  </span>
                  <span className="hidden shrink-0 text-[12.5px] text-muted sm:block">{p.category || "No category"}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line bg-page p-3">
        <span className="num px-1 text-[14px] text-muted">{picked.size} selected</span>
        <button className="btn btn-primary" disabled={!picked.size || busy} onClick={save}>
          {busy && <Spinner className="h-4 w-4" />} Move {picked.size || ""} to {category.name}
        </button>
      </div>
    </div>
  );
}

// ---------- page ----------
export default function AdminCategories() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/api/categories?all=1");
  const rows = data?.categories || [];
  const [panel, setPanel] = useState(null); // { type: "form", editing } | { type: "assign", category }
  const [deleting, setDeleting] = useState(null);
  const [moveTo, setMoveTo] = useState("");
  const [busy, setBusy] = useState(false);

  const closePanel = () => setPanel(null);
  const saved = () => {
    setPanel(null);
    reload();
  };

  const startDelete = (c) => {
    setMoveTo("");
    setDeleting(c);
  };

  const remove = async () => {
    if (deleting.product_count && !moveTo) return toast("Choose where to move its products.", "error");
    setBusy(true);
    try {
      const res = await api(`/api/admin/categories/${deleting.id}${moveTo ? `?moveTo=${moveTo}` : ""}`, { method: "DELETE" });
      toast(res.message || "Category deleted");
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
        title="Categories"
        description="Shown on the home page, the Categories page and in every product and requirement form."
        actions={
          <button className="btn btn-primary" onClick={() => setPanel({ type: "form", editing: null })}>
            Add category
          </button>
        }
      />

      {panel?.type === "form" && <CategoryForm key={panel.editing?.id || "new"} editing={panel.editing} onSaved={saved} onCancel={closePanel} />}
      {panel?.type === "assign" && <AssignProducts key={panel.category.id} category={panel.category} onDone={saved} onClose={closePanel} />}

      <AdminTable
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        placeholder="Search categories"
        searchKeys={["name", "name_hi"]}
        empty="No categories yet."
        columns={[
          {
            key: "name",
            label: "Category",
            render: (c) => (
              <div className="flex items-center gap-3">
                <Img src={categoryImage(c)} alt="" fallbackLabel={c.name.charAt(0)} className="h-10 w-14 shrink-0 rounded-md" />
                <div className="min-w-0">
                  <Link to={`/categories/${c.slug}`} className="font-semibold hover:text-neel-700">
                    {c.name}
                  </Link>
                  {c.name_hi && (
                    <div lang="hi" className="deva text-[13px] text-muted">
                      {c.name_hi}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          { key: "product_count", label: "Products", className: "num" },
          { key: "requirement_count", label: "Open requirements", className: "num" },
          { key: "sort_order", label: "Order", className: "num" },
          {
            key: "is_active",
            label: "Status",
            render: (c) =>
              c.is_active ? (
                <Badge tone="ok">Visible</Badge>
              ) : (
                <Badge tone="muted">
                  <EyeOff className="mr-1 inline h-3.5 w-3.5" />
                  Hidden
                </Badge>
              ),
          },
          {
            key: "actions",
            label: "",
            className: "whitespace-nowrap text-right",
            render: (c) => (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setPanel({ type: "assign", category: c })}>
                  <PackagePlus className="h-4 w-4" /> Add products
                </button>
                <button className="btn btn-ghost btn-sm !px-2" onClick={() => setPanel({ type: "form", editing: c })} aria-label={`Edit ${c.name}`}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="btn btn-ghost btn-sm !px-2 text-bad" onClick={() => startDelete(c)} aria-label={`Delete ${c.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ),
          },
        ]}
      />

      <Confirm
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name}?`}
        confirmLabel={deleting?.product_count ? "Move products and delete" : "Delete category"}
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      >
        {deleting?.product_count ? (
          <div className="grid gap-3">
            <p>
              {deleting.product_count} {deleting.product_count === 1 ? "product is" : "products are"} in this category. Choose where to move{" "}
              {deleting.product_count === 1 ? "it" : "them"}:
            </p>
            <select className="input" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} aria-label="Move products to">
              <option value="">Choose a category</option>
              {rows
                .filter((c) => c.id !== deleting.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        ) : (
          "No products use it. This can't be undone."
        )}
      </Confirm>
    </>
  );
}