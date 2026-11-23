import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/ToastContext";
import { ago, number } from "../lib/format";
import { REQUIREMENT_STATUS } from "../lib/constants";
import AdminTable from "../components/AdminTable";
import { Confirm, PageHeader, StatusBadge } from "../components/ui";

export default function AdminRequirements() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/api/admin/requirements");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/requirements/${deleting.id}`, { method: "DELETE" });
      toast("Requirement deleted");
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
      <PageHeader title="Requirements" description="Every requirement, with the buyer who posted it." />
      <AdminTable
        rows={data?.requirements}
        loading={loading}
        error={error}
        onRetry={reload}
        placeholder="Search title, buyer, city"
        searchKeys={["title", "buyer_name", "buyer_email", "delivery_location", "category"]}
        filters={[
          {
            key: "status",
            label: "Status",
            options: Object.entries(REQUIREMENT_STATUS).map(([value, s]) => ({ value, label: s.label })),
            match: (r, v) => r.status === v,
          },
        ]}
        columns={[
          {
            key: "title",
            label: "Requirement",
            render: (r) => (
              <>
                <Link to={`/requirements/${r.id}`} className="font-semibold hover:text-neel-700">
                  {r.title}
                </Link>
                <div className="text-[12.5px] text-muted">{r.category}</div>
              </>
            ),
          },
          {
            key: "buyer",
            label: "Buyer",
            render: (r) => (
              <>
                <div>{r.buyer_name}</div>
                <div className="text-[12.5px] text-muted">{r.buyer_email}</div>
                {r.buyer_phone && <div className="text-[12.5px] text-muted">{r.buyer_phone}</div>}
              </>
            ),
          },
          { key: "qty", label: "Quantity", className: "num whitespace-nowrap", render: (r) => `${number(r.quantity)} ${r.unit}` },
          { key: "delivery_location", label: "Deliver to" },
          { key: "quote_count", label: "Quotes", className: "num text-center" },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "created_at", label: "Posted", className: "whitespace-nowrap text-muted", render: (r) => ago(r.created_at) },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <button className="btn btn-ghost btn-sm !px-2 text-bad" onClick={() => setDeleting(r)} aria-label="Delete requirement">
                <Trash2 className="h-4 w-4" />
              </button>
            ),
          },
        ]}
      />
      <Confirm open={Boolean(deleting)} title="Delete requirement?" confirmLabel="Delete" busy={busy} onConfirm={remove} onCancel={() => setDeleting(null)}>
        “{deleting?.title}” and all its quotes will be removed.
      </Confirm>
    </>
  );
}
