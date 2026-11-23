import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/ToastContext";
import { ago, money, number } from "../lib/format";
import { QUOTE_STATUS } from "../lib/constants";
import AdminTable from "../components/AdminTable";
import { Confirm, PageHeader, StatusBadge } from "../components/ui";

export default function AdminQuotes() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/api/admin/quotes");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/quotes/${deleting.id}`, { method: "DELETE" });
      toast("Quote deleted");
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
      <PageHeader title="Quotes" description="All quotes sent by suppliers." />
      <AdminTable
        rows={data?.quotes}
        loading={loading}
        error={error}
        onRetry={reload}
        placeholder="Search supplier or requirement"
        searchKeys={["supplier_name", "supplier_email", "requirement_title", "requirement_location"]}
        filters={[
          {
            key: "status",
            label: "Status",
            options: Object.entries(QUOTE_STATUS).map(([value, s]) => ({ value, label: s.label })),
            match: (q, v) => q.status === v,
          },
        ]}
        columns={[
          {
            key: "supplier",
            label: "Supplier",
            render: (q) => (
              <>
                <div className="font-semibold">{q.supplier_name}</div>
                <div className="text-[12.5px] text-muted">{q.supplier_email}</div>
              </>
            ),
          },
          {
            key: "req",
            label: "Requirement",
            render: (q) =>
              q.requirement_id ? (
                <Link to={`/requirements/${q.requirement_id}`} className="hover:text-neel-700">
                  {q.requirement_title}
                </Link>
              ) : (
                <span className="text-muted">Deleted</span>
              ),
          },
          { key: "price", label: "Price", className: "num whitespace-nowrap font-semibold", render: (q) => money(q.quoted_price) },
          { key: "qty", label: "Quantity", className: "num whitespace-nowrap", render: (q) => `${number(q.quantity)} ${q.unit}` },
          { key: "delivery_time", label: "Delivery" },
          { key: "status", label: "Status", render: (q) => <StatusBadge kind="quote" status={q.status} /> },
          { key: "created_at", label: "Sent", className: "whitespace-nowrap text-muted", render: (q) => ago(q.created_at) },
          {
            key: "actions",
            label: "",
            render: (q) => (
              <button className="btn btn-ghost btn-sm !px-2 text-bad" onClick={() => setDeleting(q)} aria-label="Delete quote">
                <Trash2 className="h-4 w-4" />
              </button>
            ),
          },
        ]}
      />
      <Confirm open={Boolean(deleting)} title="Delete this quote?" confirmLabel="Delete" busy={busy} onConfirm={remove} onCancel={() => setDeleting(null)}>
        {deleting?.supplier_name}'s quote will be removed.
      </Confirm>
    </>
  );
}
