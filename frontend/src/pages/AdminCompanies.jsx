import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, BadgeCheck } from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/ToastContext";
import AdminTable from "../components/AdminTable";
import { Badge, Confirm, Img, PageHeader } from "../components/ui";

export default function AdminCompanies() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/api/suppliers");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/admin/suppliers/${deleting.id}`, { method: "DELETE" });
      toast("Company deleted");
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
        title="Companies"
        description="Supplier profiles in the directory. Suppliers who register get one automatically."
        actions={
          <Link to="/admin/companies/add" className="btn btn-primary">
            Add company
          </Link>
        }
      />
      <AdminTable
        rows={data?.suppliers}
        loading={loading}
        error={error}
        onRetry={reload}
        placeholder="Search company, industry, city"
        searchKeys={["name", "industry", "location", "email", "phone"]}
        filters={[
          {
            key: "verified",
            label: "Verified",
            options: [
              { value: "yes", label: "Verified" },
              { value: "no", label: "Not verified" },
            ],
            match: (s, v) => (v === "yes" ? s.verified : !s.verified),
          },
        ]}
        columns={[
          {
            key: "name",
            label: "Company",
            render: (s) => (
              <div className="flex items-center gap-3">
                <Img src={s.image_url} alt="" className="h-10 w-14 shrink-0 rounded-md" />
                <div>
                  <Link to={`/suppliers/${s.id}`} className="inline-flex items-center gap-1 font-semibold hover:text-neel-700">
                    {s.name} {s.verified && <BadgeCheck className="h-4 w-4 text-ok" />}
                  </Link>
                  <div className="text-[12.5px] text-muted">{s.email || s.phone || "No contact"}</div>
                </div>
              </div>
            ),
          },
          { key: "industry", label: "Industry" },
          { key: "location", label: "Location" },
          { key: "product_count", label: "Products", className: "num text-center" },
          { key: "owner", label: "Account", render: (s) => (s.owner_id ? <Badge tone="neel">Self-managed</Badge> : <Badge>Admin-managed</Badge>) },
          {
            key: "actions",
            label: "",
            className: "whitespace-nowrap",
            render: (s) => (
              <>
                <Link to={`/admin/companies/${s.id}/edit`} className="btn btn-ghost btn-sm !px-2" aria-label="Edit company">
                  <Pencil className="h-4 w-4" />
                </Link>
                <button className="btn btn-ghost btn-sm !px-2 text-bad" onClick={() => setDeleting(s)} aria-label="Delete company">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ),
          },
        ]}
      />
      <Confirm open={Boolean(deleting)} title={`Delete ${deleting?.name}?`} confirmLabel="Delete company" busy={busy} onConfirm={remove} onCancel={() => setDeleting(null)}>
        The company and all {deleting?.product_count || 0} of its products will be removed.
      </Confirm>
    </>
  );
}
